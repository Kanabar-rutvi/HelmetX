import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string; // MAC Address or Serial
  assignedUser?: mongoose.Types.ObjectId;
  status: 'online' | 'offline';
  batteryLevel: number;
  lastSeen: Date;
  lat?: number;
  lng?: number;
}

const DeviceSchema: Schema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  batteryLevel: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  lat: { type: Number },
  lng: { type: Number },
}, { timestamps: true });

export default mongoose.model<IDevice>('Device', DeviceSchema);
