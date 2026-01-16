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
exports.setupReportingService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Site_1 = __importDefault(require("../models/Site"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const Alert_1 = __importDefault(require("../models/Alert"));
const SiteSafetyReport_1 = __importDefault(require("../models/SiteSafetyReport"));
const User_1 = __importDefault(require("../models/User"));
const setupReportingService = () => {
    // Run every day at 23:59
    node_cron_1.default.schedule('59 23 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Generating Daily Site Safety Reports...');
        try {
            const sites = yield Site_1.default.find();
            const today = new Date().toISOString().split('T')[0];
            const startOfDay = new Date(today + 'T00:00:00.000Z');
            const endOfDay = new Date(today + 'T23:59:59.999Z');
            for (const site of sites) {
                // 1. Workers Stats
                // Find users assigned to this site
                const workers = yield User_1.default.find({ role: 'worker' });
                const totalWorkers = workers.length;
                // Attendance
                const attendanceCount = yield Attendance_1.default.countDocuments({
                    user: { $in: workers.map(w => w._id) },
                    date: today,
                    status: { $in: ['present', 'late'] }
                });
                const presentWorkers = attendanceCount;
                const absentWorkers = totalWorkers - presentWorkers;
                // 2. Alerts Stats
                const alerts = yield Alert_1.default.find({
                    timestamp: { $gte: startOfDay, $lte: endOfDay },
                    // We need to link alerts to site. Alerts have 'user' or 'deviceId'.
                    // Best is to find alerts for users assigned to this site.
                    user: { $in: workers.map(w => w._id) }
                });
                const totalAlerts = alerts.length;
                const alertsBySeverity = {
                    critical: alerts.filter(a => a.severity === 'critical').length,
                    high: alerts.filter(a => a.severity === 'high').length,
                    medium: alerts.filter(a => a.severity === 'medium').length,
                    low: alerts.filter(a => a.severity === 'low').length
                };
                const alertsByType = {};
                alerts.forEach(a => {
                    alertsByType[a.type] = (alertsByType[a.type] || 0) + 1;
                });
                // 3. Helmet Compliance
                // Check sensor data for helmetOn=true vs total samples
                // This is heavy, so maybe just sample or check alerts 'helmet_off'
                // Let's use helmet_off alerts vs present workers duration (approx)
                // Or just simpler: 100 - (helmet_off_alerts * penalty)
                // Better: Avg helmetOn from sensor data for these users
                // Limit sensor data query to avoid OOM
                // const sensorData = await SensorData.find({
                //    userId: { $in: workers.map(w => w._id) },
                //    timestamp: { $gte: startOfDay, $lte: endOfDay }
                // }).select('helmetOn');
                // This could be millions of records.
                // Alternative: Use alerts 'helmet_off'.
                // If 0 helmet_off alerts => 100% compliance.
                // If 10 alerts => less.
                // Let's stick to a simple heuristic for now: 100 - (helmet_off_count * 5), min 0.
                const helmetOffCount = alertsByType['helmet_off'] || 0;
                const avgHelmetCompliance = Math.max(0, 100 - (helmetOffCount * 5));
                // 4. Status Determination
                let status = 'safe';
                if (alertsBySeverity.critical > 0 || alertsBySeverity.high > 2) {
                    status = 'critical';
                }
                else if (alertsBySeverity.medium > 5 || helmetOffCount > 5) {
                    status = 'attention';
                }
                // Save Report
                yield SiteSafetyReport_1.default.findOneAndUpdate({ site: site._id, date: today }, {
                    metrics: {
                        totalWorkers,
                        presentWorkers,
                        absentWorkers,
                        totalAlerts,
                        alertsBySeverity,
                        alertsByType,
                        avgHelmetCompliance
                    },
                    status,
                    generatedAt: new Date()
                }, { upsert: true, new: true });
                console.log(`Report generated for site: ${site.name}`);
            }
        }
        catch (error) {
            console.error('Error generating daily reports:', error);
        }
    }));
    console.log('Reporting Service initialized');
};
exports.setupReportingService = setupReportingService;
