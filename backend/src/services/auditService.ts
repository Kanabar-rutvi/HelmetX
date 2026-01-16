import AuditLog from '../models/AuditLog';
import mongoose from 'mongoose';

export const logAction = async (
  actorId: string | mongoose.Types.ObjectId,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string,
  metadata?: Record<string, any>
) => {
  try {
    await AuditLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      details,
      metadata
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    // Don't block the main flow if audit fails
  }
};
