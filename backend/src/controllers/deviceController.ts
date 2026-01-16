import { Request, Response } from 'express';
import Device from '../models/Device';

export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await Device.find().populate('assignedUser', 'name email');
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getWorkerLocations = async (_req: Request, res: Response) => {
  try {
    const devices = await Device.find({ lat: { $ne: null }, lng: { $ne: null } })
      .populate('assignedUser', 'name email assignedSite');
    const locations = devices.map(d => ({
      deviceId: d.deviceId,
      lat: d.lat,
      lng: d.lng,
      user: (d as any).assignedUser ? {
        name: (d as any).assignedUser.name,
        email: (d as any).assignedUser.email,
        assignedSite: (d as any).assignedUser.assignedSite
      } : null
    }));
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getWorkerCountsBySite = async (_req: Request, res: Response) => {
  try {
    const devices = await Device.find().populate('assignedUser', 'assignedSite');
    const counts: Record<string, number> = {};
    for (const d of devices) {
      const site = (d as any).assignedUser?.assignedSite || 'Unknown';
      if (d.lat != null && d.lng != null) {
        counts[site] = (counts[site] || 0) + 1;
      }
    }
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createDevice = async (req: Request, res: Response) => {
  const { deviceId, assignedUser } = req.body;

  try {
    const device = new Device({ deviceId, assignedUser });
    const createdDevice = await device.save();
    res.status(201).json(createdDevice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid device data' });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  const { assignedUser, status } = req.body;

  try {
    const device = await Device.findById(req.params.id);

    if (device) {
      device.assignedUser = assignedUser || device.assignedUser;
      device.status = status || device.status;
      const updatedDevice = await device.save();
      res.json(updatedDevice);
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const device = await Device.findById(req.params.id);

    if (device) {
      await device.deleteOne();
      res.json({ message: 'Device removed' });
    } else {
      res.status(404).json({ message: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
