import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterialItem {
  name: string;
  quantity: number;
  note?: string;
  status?: 'requested' | 'approved' | 'rejected' | 'delivered';
}

export interface IDailyReport extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  task: string;
  imageUrl?: string;
  materials: IMaterialItem[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterialItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: { type: String },
  status: { type: String, enum: ['requested', 'approved', 'rejected', 'delivered'], default: 'requested' }
});

const DailyReportSchema = new Schema<IDailyReport>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, index: true },
  task: { type: String, required: true },
  imageUrl: { type: String },
  materials: { type: [MaterialSchema], default: [] },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  approvalNote: { type: String },
}, { timestamps: true });

DailyReportSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);
