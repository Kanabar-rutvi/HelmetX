"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const shiftSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    startTime: { type: String, required: true }, // HH:mm format
    endTime: { type: String, required: true }, // HH:mm format
    gracePeriod: { type: Number, default: 15 }, // minutes
    siteId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Site' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Shift', shiftSchema);
