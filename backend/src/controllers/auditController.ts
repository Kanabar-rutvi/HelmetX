import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { targetType, limit } = req.query;
    const query: any = {};
    if (targetType) query.targetType = targetType;
    const logs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt((limit as string) || '100', 10));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
