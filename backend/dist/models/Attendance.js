"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const AttendanceSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceId: { type: String },
    site: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Site' },
    date: { type: String, required: true },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    checkInLocation: { lat: Number, lng: Number },
    checkOutLocation: { lat: Number, lng: Number },
    status: { type: String, enum: ['present', 'absent', 'late', 'checked_out'], default: 'present' },
    duration: { type: Number, default: 0 },
    source: { type: String, enum: ['HELMET_SCANNER', 'MANUAL', 'AUTO', 'MANUAL_OVERRIDE', 'QR_SCAN', 'SUPERVISOR_SCAN'], default: 'HELMET_SCANNER' },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    alerts: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Alert' }],
    jobRole: { type: String, enum: ['welding', 'carpenter', 'mason', 'electrician', 'plumber', 'painter', 'steel_fixer', 'scaffolder', 'operator'] },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Attendance', AttendanceSchema);
