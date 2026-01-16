import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import SensorData from '../models/SensorData';
import Device from '../models/Device';
import Alert from '../models/Alert';
import Attendance from '../models/Attendance';
import Config from '../models/Config';
import { notifyAlert } from '../services/notificationService';

export const setupSerial = (io: Server) => {
  const portPath = process.env.SERIAL_PORT || 'COM10';
  const defaultDeviceId = process.env.SERIAL_DEVICE_ID || 'esp32-com10';

  try {
    const port = new SerialPort({ path: portPath, baudRate: 115200 });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    console.log(`Serial listening on ${portPath}`);

    parser.on('data', async (line: string) => {
      try {
        const text = line.trim();
        if (!text.startsWith('{') || !text.endsWith('}')) {
          return;
        }
        const payload = JSON.parse(text);
        const deviceId = payload.deviceId || defaultDeviceId;

        const config = await Config.findOne().sort({ createdAt: -1 });
        const thresholds = config?.thresholds || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };

        const device = await Device.findOne({ deviceId }).populate('assignedUser');
        const userId = device?.assignedUser?._id;

        const newData = new SensorData({
          deviceId,
          userId,
          heartRate: payload.heartRate,
          temperature: payload.temperature,
          gasLevel: payload.gasLevel,
          helmetOn: payload.helmetOn,
          latitude: payload.lat || payload.latitude,
          longitude: payload.lng || payload.longitude,
          ambientTemp: payload.ambientTemp,
          battery: payload.battery,
          timestamp: new Date()
        });
        await newData.save();

        if (device) {
          device.lastSeen = new Date();
          device.batteryLevel = payload.battery || device.batteryLevel;
          if (payload.lat || payload.latitude) device.lat = payload.lat || payload.latitude;
          if (payload.lng || payload.longitude) device.lng = payload.lng || payload.longitude;
          device.status = 'online';
          await device.save();
        } else {
          await Device.findOneAndUpdate(
            { deviceId },
            { status: 'online', lastSeen: new Date(), batteryLevel: payload.battery },
            { upsert: true, new: true }
          );
        }

        io.emit('sensor_update', { deviceId, data: payload, user: device?.assignedUser });
        io.emit('device_status', { deviceId, status: 'online' });

        // Removed auto-attendance on helmetOn (Requirement: Strict scan events only)

        const alerts: Array<{ type: string; severity: string; value: string }> = [];

        if (payload.sos) alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
        if (payload.gasLevel > thresholds.gasLevel) alerts.push({ type: 'GAS', severity: 'critical', value: `Gas Level: ${payload.gasLevel}` });
        if (payload.temperature > thresholds.temperature) alerts.push({ type: 'high_temp', severity: 'high', value: `Body Temp: ${payload.temperature}` });
        if (payload.heartRate && (payload.heartRate < thresholds.heartRateMin || payload.heartRate > thresholds.heartRateMax)) {
          alerts.push({ type: 'abnormal_heart_rate', severity: 'high', value: `Heart Rate: ${payload.heartRate}` });
        }
        if (payload.helmetOn === false) alerts.push({ type: 'helmet_off', severity: 'medium', value: 'Helmet Removed' });
        if (payload.fall) alerts.push({ type: 'fall', severity: 'critical', value: 'Fall Detected' });
        if (payload.unsafe_behavior) alerts.push({ type: 'unsafe_behavior', severity: 'medium', value: payload.unsafe_behavior_type || 'Unsafe Behavior Detected' });

        for (const alert of alerts) {
          const recentAlert = await Alert.findOne({
            deviceId,
            type: alert.type,
            status: 'new',
            timestamp: { $gt: new Date(Date.now() - 60000) }
          });
          if (!recentAlert) {
            const newAlert = await Alert.create({
              deviceId,
              user: device?.assignedUser,
              ...alert,
              status: 'new'
            });
            io.emit('new_alert', newAlert);
            notifyAlert(newAlert, device || undefined);
          }
        }
      } catch (err) {
        console.error('Serial parse error:', err);
      }
    });

    port.on('error', (err) => {
      console.error(`Serial port error on ${portPath}:`, err);
    });

    return port;
  } catch (error) {
    console.error(`Failed to open serial port ${portPath}:`, error);
    return null;
  }
};
