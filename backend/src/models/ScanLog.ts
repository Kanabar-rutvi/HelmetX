import mongoose, { Document, Schema } from 'mongoose';

export interface IScanLog extends Document {
  helmetId: string;
  workerId?: mongoose.Types.ObjectId;
  siteId?: mongoose.Types.ObjectId;
  scanType: 'IN' | 'OUT';
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  status: 'valid' | 'invalid' | 'duplicate' | 'geo_fail';
  failReason?: string;
  rawPayload?: any;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
}

const ScanLogSchema: Schema = new Schema({
  helmetId: { type: String, required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  scanType: { type: String, enum: ['IN', 'OUT'], required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ['valid', 'invalid', 'duplicate', 'geo_fail'], default: 'valid' },
  failReason: { type: String },
  rawPayload: { type: Schema.Types.Mixed },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IScanLog>('ScanLog', ScanLogSchema);
