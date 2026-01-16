"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const configSchema = new mongoose_1.default.Schema({
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
    updatedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Config', configSchema);
