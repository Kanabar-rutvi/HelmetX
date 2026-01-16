"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = void 0;
const User_1 = __importDefault(require("../models/User"));
const Device_1 = __importDefault(require("../models/Device"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const DailyReport_1 = __importDefault(require("../models/DailyReport"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Config_1 = __importDefault(require("../models/Config"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const createBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const backup = {
            timestamp: new Date(),
            users: yield User_1.default.find(),
            devices: yield Device_1.default.find(),
            attendance: yield Attendance_1.default.find(),
            reports: yield DailyReport_1.default.find(),
            alerts: yield Alert_1.default.find(),
            configs: yield Config_1.default.find(),
            auditLogs: yield AuditLog_1.default.find(),
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
        res.send(JSON.stringify(backup, null, 2));
    }
    catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ message: 'Backup failed' });
    }
});
exports.createBackup = createBackup;
