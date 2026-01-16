import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  type: 'SOS' | 'GAS' | 'high_temp' | 'helmet_off' | 'fall' | 'low_battery' | 'geofence' | 'unsafe_behavior';
  deviceId: string;
  user?: mongoose.Types.ObjectId;
  value?: string | number;
  timestamp: Date;
  status: 'new' | 'acknowledged' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  escalated?: boolean;
  escalatedAt?: Date;
}

const AlertSchema: Schema = new Schema({
  type: { type: String, required: true },
  deviceId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  value: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  escalated: { type: Boolean, default: false },
  escalatedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);
