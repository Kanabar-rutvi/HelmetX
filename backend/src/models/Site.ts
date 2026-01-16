import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  geofenceRadius: { type: Number, default: 100 }, // in meters
  isActive: { type: Boolean, default: true },
  supervisors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shiftTimings: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  safetyThresholds: {
    maxTemp: { type: Number, default: 40 },
    maxHeartRate: { type: Number, default: 120 },
    gasLimit: { type: Number, default: 50 }
  }
}, { timestamps: true });

siteSchema.index({ location: '2dsphere' });

export default mongoose.model('Site', siteSchema);
