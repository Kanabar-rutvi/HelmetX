import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // HH:mm format
  endTime: { type: String, required: true }, // HH:mm format
  gracePeriod: { type: Number, default: 15 }, // minutes
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Shift', shiftSchema);
