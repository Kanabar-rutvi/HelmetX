import mqtt from 'mqtt';
import SensorData from '../models/SensorData';
import Device from '../models/Device';
import Alert from '../models/Alert';
import { Server } from 'socket.io';
import Attendance from '../models/Attendance';
import Config from '../models/Config';
import { notifyAlert } from '../services/notificationService';
import { processScan } from '../controllers/attendanceController';

export const setupMQTT = (io: Server) => {
  const brokerUrl = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
  const client = mqtt.connect(brokerUrl);

  client.on('connect', () => {
    console.log(`Connected to MQTT Broker: ${brokerUrl}`);
    client.subscribe('helmet/+/data', (err) => {
      if (!err) console.log('Subscribed to helmet/+/data');
    });
    client.subscribe('helmet/+/status', (err) => { // online/offline
      if (!err) console.log('Subscribed to helmet/+/status');
    });
    client.subscribe('helmet/+/scan', (err) => {
      if (!err) console.log('Subscribed to helmet/+/scan');
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const msgType = topicParts[2]; // data, status, scan

      if (msgType === 'scan') {
        await processScan({
          helmetId: deviceId,
          scanType: payload.type || payload.scanType,
          timestamp: new Date(payload.timestamp || Date.now()),
          lat: payload.lat,
          lng: payload.lng
        }, io);
        return;
      }

      if (msgType === 'status') {
         const device = await Device.findOneAndUpdate(
            { deviceId }, 
            { status: payload.status, lastSeen: new Date(), batteryLevel: payload.battery },
            { upsert: true, new: true }
         );
         io.emit('device_status', { deviceId, status: payload.status });
         // Removed old auto-checkout on offline to adhere to strict scan-out requirement
         return;
      }

      // Handle Sensor Data
      // Payload: { heartRate, temperature, gasLevel, helmetOn, lat, lng, battery }
      
      // Fetch Config
      const config = await Config.findOne().sort({ createdAt: -1 });
      const thresholds = config?.thresholds || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };

      // 1. Save Sensor Data
      const device = await Device.findOne({ deviceId }).populate('assignedUser');
      const userId = device?.assignedUser?._id;

      const newData = new SensorData({
        deviceId,
        userId,
        ...payload,
        timestamp: new Date()
      });
      await newData.save();

      // 2. Update Device Last Seen & Battery
      if (device) {
        device.lastSeen = new Date();
        device.batteryLevel = payload.battery || device.batteryLevel;
        if (payload.lat) device.lat = payload.lat;
        if (payload.lng) device.lng = payload.lng;
        await device.save();
      }

      // 3. Emit to WebSocket
      io.emit('sensor_update', { deviceId, data: payload, user: device?.assignedUser });

      // Removed old auto-checkin on helmetOn to adhere to strict scan-in requirement

      // 5. Alert Logic
      const alerts = [];
      
      // SOS
      if (payload.sos) {
        alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
      }

      // Gas
      if (payload.gasLevel > thresholds.gasLevel) {
        alerts.push({ type: 'GAS', severity: 'critical', value: `Gas Level: ${payload.gasLevel}` });
      }

      // Temperature
      if (payload.temperature > thresholds.temperature) {
         alerts.push({ type: 'high_temp', severity: 'high', value: `Body Temp: ${payload.temperature}` });
      }

      // Heart Rate
      if (payload.heartRate && (payload.heartRate < thresholds.heartRateMin || payload.heartRate > thresholds.heartRateMax)) {
         alerts.push({ type: 'abnormal_heart_rate', severity: 'high', value: `Heart Rate: ${payload.heartRate}` });
      }

      // Helmet Off
      if (payload.helmetOn === false) {
         alerts.push({ type: 'helmet_off', severity: 'medium', value: 'Helmet Removed' });
      }

      // Fall Detection
      if (payload.fall) {
         alerts.push({ type: 'fall', severity: 'critical', value: 'Fall Detected' });
      }

      // Unsafe Behavior (e.g., entering restricted area, running, etc. - detected by device)
      if (payload.unsafe_behavior) {
          alerts.push({ type: 'unsafe_behavior', severity: 'medium', value: payload.unsafe_behavior_type || 'Unsafe Behavior Detected' });
      }

      for (const alert of alerts) {
         // Debounce: Check if recent alert of same type exists
         const recentAlert = await Alert.findOne({ 
            deviceId, 
            type: alert.type, 
            status: 'new',
            timestamp: { $gt: new Date(Date.now() - 60000) } // 1 minute debounce
         });

         if (!recentAlert) {
            const newAlert = await Alert.create({
               deviceId,
               user: device?.assignedUser,
               ...alert,
               status: 'new'
            });
            console.log(`Alert Generated: ${alert.type} for ${deviceId}`);
            
            // Link to Attendance
            if (userId) {
                const today = new Date().toISOString().split('T')[0];
                await Attendance.findOneAndUpdate(
                    { user: userId, date: today, checkOutTime: { $exists: false } },
                    { $push: { alerts: newAlert._id } }
                );
            }
            
            // Emit Alert to WebSocket
            io.emit('new_alert', newAlert);
            
            // Send Notifications
            notifyAlert(newAlert, device);
         }
      }
    } catch (error) {
      console.error('MQTT Message Error:', error);
    }
  });

  return client;
};
