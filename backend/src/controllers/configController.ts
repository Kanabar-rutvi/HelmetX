import { Request, Response } from 'express';
import Config from '../models/Config';
import AuditLog from '../models/AuditLog';

export const getConfig = async (req: Request, res: Response) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateConfig = async (req: any, res: Response) => {
  try {
    const { thresholds, notifications, system } = req.body;
    let config = await Config.findOne();
    
    if (!config) {
      config = new Config({});
    }

    config.thresholds = { ...config.thresholds, ...thresholds };
    config.notifications = { ...config.notifications, ...notifications };
    config.system = { ...config.system, ...system };
    config.updatedBy = req.user?._id;

    const updatedConfig = await config.save();

    await AuditLog.create({
      actor: req.user?._id,
      action: 'update_system_config',
      targetType: 'Config',
      targetId: updatedConfig._id.toString(),
      details: 'System configuration updated'
    });

    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
