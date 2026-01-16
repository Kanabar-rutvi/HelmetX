import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorData extends Document {
  deviceId: string;
  userId?: mongoose.Types.ObjectId;
  timestamp: Date;
  heartRate?: number;
  temperature?: number; // Body temp
  gasLevel?: number;
  helmetOn: boolean;
  latitude?: number;
  longitude?: number;
  ambientTemp?: number;
  battery?: number;
}

const SensorDataSchema: Schema = new Schema({
  deviceId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now, index: true },
  heartRate: { type: Number },
  temperature: { type: Number },
  gasLevel: { type: Number },
  helmetOn: { type: Boolean, default: true },
  latitude: { type: Number },
  longitude: { type: Number },
  ambientTemp: { type: Number },
  battery: { type: Number },
}, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // Keep data for 30 days

export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);
