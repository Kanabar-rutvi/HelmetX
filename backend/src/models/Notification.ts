import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'info' | 'warning' | 'error' | 'success' | 'site_assignment' | 'work_order';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success', 'site_assignment', 'work_order'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
