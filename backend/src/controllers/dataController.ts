import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import SensorData from '../models/SensorData';
import Alert from '../models/Alert';
import Device from '../models/Device';
import User from '../models/User';
import Config from '../models/Config';
import Attendance from '../models/Attendance';
import { Server } from 'socket.io';

export const getSensorData = async (req: Request, res: Response) => {
  try {
    const data = await SensorData.find({ deviceId: req.params.deviceId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getSafetySummary = async (req: Request, res: Response) => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const site = (req.query.site as string) || undefined;
    const start = new Date(dateStr + 'T00:00:00.000Z');
    const end = new Date(dateStr + 'T23:59:59.999Z');

    let userFilter: any = {};
    if (site) {
      const usersAtSite = await User.find({ assignedSite: site }).select('_id');
      userFilter.userId = { $in: usersAtSite.map(u => u._id) };
    }

    const sensor = await SensorData.find({
      timestamp: { $gte: start, $lte: end },
      ...userFilter
    });

    const alerts = await Alert.find({
      timestamp: { $gte: start, $lte: end }
    });

    const totals = {
      samples: sensor.length,
      helmetOffEvents: alerts.filter(a => a.type === 'helmet_off').length,
      sosEvents: alerts.filter(a => a.type === 'SOS').length,
      gasAlerts: alerts.filter(a => a.type === 'GAS').length,
      highTempAlerts: alerts.filter(a => a.type === 'high_temp').length,
      falls: alerts.filter(a => a.type === 'fall').length,
      unsafeBehaviorReports: alerts.filter(a => a.type === 'unsafe_behavior').length
    };

    const helmetOnRate = sensor.length
      ? (sensor.filter(s => (s as any).helmetOn === true).length / sensor.length)
      : 0;

    res.json({
      date: dateStr,
      site: site || null,
      helmetOnRate,
      totals
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const mine = (req.query.mine as string) === 'true';
    const filter = mine ? { user: (req as any).user?._id } : {};
    const alerts = await Alert.find(filter)
      .populate('user', 'name')
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createAlert = async (req: Request, res: Response) => {
  try {
    const { type, deviceId, severity, value } = req.body;
    
    // Check if device exists
    const device = await Device.findOne({ deviceId });
    
    const alert = await Alert.create({
      type,
      deviceId,
      user: device?.assignedUser || (req as any).user?._id, // Prefer device user, fallback to req.user
      severity: severity || 'critical',
      value: value || 'Manual SOS',
      status: 'new'
    });

    // Emit socket event for real-time alert
    const io = req.app.get('io');
    if (io) {
      io.emit('new_alert', alert);
    }

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateAlertStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'acknowledged' | 'resolved'
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    alert.status = status || alert.status;
    if (status === 'acknowledged') {
      (alert as any).acknowledgedBy = req.user?._id;
      (alert as any).acknowledgedAt = new Date();
    }
    if (status === 'resolved') {
      alert.resolvedBy = req.user?._id;
      alert.resolvedAt = new Date();
    }
    const updated = await alert.save();
    const io = req.app.get('io');
    if (io) io.emit('alert_update', updated);
    await AuditLog.create({
      actor: req.user?._id,
      action: 'update_alert_status',
      targetType: 'Alert',
      targetId: id,
      metadata: { status }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const escalateAlert = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    (alert as any).escalated = true;
    (alert as any).escalatedBy = req.user?._id;
    (alert as any).escalatedAt = new Date();
    const updated = await alert.save();
    const io = req.app.get('io');
    if (io) io.emit('alert_escalated', updated);
    await AuditLog.create({
      actor: req.user?._id,
      action: 'escalate_alert',
      targetType: 'Alert',
      targetId: id
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

type IncomingPayload = any;

const mapPayload = (p: IncomingPayload) => {
  const helmetValue = p.helmet ?? p.helmetOn;
  return {
    heartRate: p.hr ?? p.heartRate ?? p.heart ?? p.pulse,
    temperature: p.temp ?? p.temperature ?? p.bodyTemp ?? p.bodytemp,
    gasLevel: p.mq ?? p.gasLevel ?? p.gas,
    helmetOn: typeof helmetValue === 'boolean' ? helmetValue : helmetValue !== 'off',
    latitude: p.lat ?? p.latitude,
    longitude: p.lng ?? p.longitude,
    ambientTemp: p.ambientTemp ?? p.ambient,
    battery: p.battery,
    sos: p.sos === true || p.alert === 'SOS' || p.sosButton === true,
    accident: p.accident === true || p.fall === true,
    humidity: p.hum ?? p.humidity,
    accel: p.accel ?? { 
      x: p.ax, 
      y: p.ay, 
      z: p.az, 
      total: p.totalAccel ?? (p.ax && p.ay && p.az ? Math.sqrt(p.ax*p.ax + p.ay*p.ay + p.az*p.az) : undefined) 
    },
    ledStatus: p.led ?? (p.ledStatus === true || p.ledStatus === 'ON')
  };
};

const lastByDevice: Map<string, any> = new Map();
const BATCH_INTERVAL = Number(process.env.BATCH_INTERVAL_MS || 10000);

setInterval(async () => {
  try {
    if (lastByDevice.size === 0) return;
    const docs: any[] = [];
    const now = new Date();

    const config = await Config.findOne().sort({ createdAt: -1 });
    const thresholds = config?.thresholds || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };

    for (const [deviceId, entry] of lastByDevice.entries()) {
      const payload = entry.payload;
      const device = await Device.findOne({ deviceId }).populate('assignedUser');
      const userId = (device as any)?.assignedUser?._id;

      docs.push({
        deviceId,
        userId,
        timestamp: now,
        heartRate: payload.heartRate,
        temperature: payload.temperature,
        gasLevel: payload.gasLevel,
        helmetOn: payload.helmetOn,
        latitude: payload.latitude,
        longitude: payload.longitude,
        ambientTemp: payload.ambientTemp,
        battery: payload.battery
      });

      if (device) {
        device.lastSeen = now;
        if (payload.latitude) device.lat = payload.latitude;
        if (payload.longitude) device.lng = payload.longitude;
        if (typeof payload.battery === 'number') device.batteryLevel = payload.battery;
        device.status = 'online';
        await device.save();
      } else {
        await Device.findOneAndUpdate(
          { deviceId },
          { status: 'online', lastSeen: now, batteryLevel: payload.battery },
          { upsert: true, new: true }
        );
      }

      // Basic alert rules
      const io: Server | undefined = (entry.req?.app)?.get?.('io');
      const alerts: Array<{ type: string; severity: string; value: string }> = [];
      if (payload.sos) alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
      if (payload.accident) alerts.push({ type: 'fall', severity: 'critical', value: 'Possible fall detected' });
      if (payload.helmetOn === false) alerts.push({ type: 'helmet_off', severity: 'warning', value: 'Helmet not worn' });
      if (typeof payload.temperature === 'number' && payload.temperature > thresholds.temperature) alerts.push({ type: 'high_temp', severity: 'warning', value: `Temp ${payload.temperature}` });
      if (typeof payload.gasLevel === 'number' && payload.gasLevel > thresholds.gasLevel) alerts.push({ type: 'GAS', severity: 'critical', value: `Gas ${payload.gasLevel}` });

      for (const a of alerts) {
        const created = await Alert.create({
          type: a.type,
          deviceId,
          user: (device as any)?.assignedUser?._id,
          severity: a.severity,
          value: a.value,
          status: 'new'
        });
        
        // Link to Attendance
        if ((device as any)?.assignedUser?._id) {
             const today = new Date().toISOString().split('T')[0];
             await Attendance.findOneAndUpdate(
                 { user: (device as any).assignedUser._id, date: today, checkOutTime: { $exists: false } },
                 { $push: { alerts: created._id } }
             );
        }

        if (io) io.emit('new_alert', created);
      }
    }

    if (docs.length) {
      await SensorData.insertMany(docs);
    }

    lastByDevice.clear();
  } catch (error) {
    console.error('Batch storage error:', error);
  }
}, BATCH_INTERVAL);

export const ingestSensorData = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const deviceId = (body.deviceId as string) || (req.query.deviceId as string);
    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const payload = mapPayload(body);
    lastByDevice.set(deviceId, { payload, req });

    const io = req.app.get('io') as Server | undefined;
    if (io) {
      io.emit('sensor_update', { deviceId, data: payload });
      io.emit('device_status', { deviceId, status: 'online' });
    }

    res.status(202).json({ queued: true, deviceId });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
