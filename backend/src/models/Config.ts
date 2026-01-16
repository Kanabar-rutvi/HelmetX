import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
  thresholds: {
    temperature: { type: Number, default: 38 },
    gasLevel: { type: Number, default: 400 },
    heartRateMin: { type: Number, default: 60 },
    heartRateMax: { type: Number, default: 100 },
  },
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true },
    adminEmails: [{ type: String }],
    emergencyContacts: [{ type: String }],
  },
  system: {
    dataRetentionDays: { type: Number, default: 30 },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    maintenanceMode: { type: Boolean, default: false },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Config', configSchema);
