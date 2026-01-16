"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const siteSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    description: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    geofenceRadius: { type: Number, default: 100 }, // in meters
    isActive: { type: Boolean, default: true },
    supervisors: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
    workers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
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
exports.default = mongoose_1.default.model('Site', siteSchema);
