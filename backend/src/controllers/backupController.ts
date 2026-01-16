import { Request, Response } from 'express';
import User from '../models/User';
import Device from '../models/Device';
import Attendance from '../models/Attendance';
import DailyReport from '../models/DailyReport';
import Alert from '../models/Alert';
import Config from '../models/Config';
import AuditLog from '../models/AuditLog';

export const createBackup = async (req: Request, res: Response) => {
  try {
    const backup = {
      timestamp: new Date(),
      users: await User.find(),
      devices: await Device.find(),
      attendance: await Attendance.find(),
      reports: await DailyReport.find(),
      alerts: await Alert.find(),
      configs: await Config.find(),
      auditLogs: await AuditLog.find(),
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ message: 'Backup failed' });
  }
};
