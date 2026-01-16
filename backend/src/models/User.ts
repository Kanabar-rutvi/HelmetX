import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'worker' | 'supervisor' | 'admin';
  phone?: string;
  employeeId?: string;
  assignedSupervisor?: mongoose.Types.ObjectId;

  assignedSite?: string;
  createdAt: Date;
  otpCode?: string;
  otpExpires?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'supervisor', 'admin'], default: 'worker' },
  phone: { type: String },
  workerId: { type: String, unique: true, sparse: true },
  employeeId: { type: String, unique: true, sparse: true },
  assignedSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedSite: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  assignedShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  otpCode: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
