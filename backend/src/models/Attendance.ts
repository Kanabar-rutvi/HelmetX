import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  user: mongoose.Types.ObjectId;
  deviceId: string;
  site?: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  status: 'present' | 'absent' | 'late' | 'checked_out';
  duration?: number; // in minutes
  source: 'HELMET_SCANNER' | 'MANUAL' | 'AUTO' | 'MANUAL_OVERRIDE';
  verified?: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  alerts?: mongoose.Types.ObjectId[];
  jobRole?: 'welding' | 'carpenter' | 'mason' | 'electrician' | 'plumber' | 'painter' | 'steel_fixer' | 'scaffolder' | 'operator';
}

const AttendanceSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String },
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  date: { type: String, required: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  checkInLocation: { lat: Number, lng: Number },
  checkOutLocation: { lat: Number, lng: Number },
  status: { type: String, enum: ['present', 'absent', 'late', 'checked_out'], default: 'present' },
  duration: { type: Number, default: 0 },
  source: { type: String, enum: ['HELMET_SCANNER', 'MANUAL', 'AUTO', 'MANUAL_OVERRIDE', 'QR_SCAN', 'SUPERVISOR_SCAN'], default: 'HELMET_SCANNER' },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  alerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
  jobRole: { type: String, enum: ['welding', 'carpenter', 'mason', 'electrician', 'plumber', 'painter', 'steel_fixer', 'scaffolder', 'operator'] },
}, { timestamps: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
