import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSafetyReport extends Document {
  site: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  metrics: {
    totalWorkers: number;
    presentWorkers: number;
    absentWorkers: number;
    totalAlerts: number;
    alertsBySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    alertsByType: Record<string, number>;
    avgHelmetCompliance: number; // Percentage 0-100
  };
  status: 'safe' | 'attention' | 'critical';
  generatedAt: Date;
}

const SiteSafetyReportSchema = new Schema<ISiteSafetyReport>({
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  date: { type: String, required: true },
  metrics: {
    totalWorkers: { type: Number, default: 0 },
    presentWorkers: { type: Number, default: 0 },
    absentWorkers: { type: Number, default: 0 },
    totalAlerts: { type: Number, default: 0 },
    alertsBySeverity: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 }
    },
    alertsByType: { type: Map, of: Number, default: {} },
    avgHelmetCompliance: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['safe', 'attention', 'critical'], default: 'safe' },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

SiteSafetyReportSchema.index({ site: 1, date: 1 }, { unique: true });

export default mongoose.model<ISiteSafetyReport>('SiteSafetyReport', SiteSafetyReportSchema);
