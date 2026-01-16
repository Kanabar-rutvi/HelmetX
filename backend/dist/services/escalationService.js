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
exports.setupEscalationService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const setupEscalationService = (io) => {
    // Run every minute
    node_cron_1.default.schedule('* * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Find unacknowledged critical alerts older than 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const alertsToEscalate = yield Alert_1.default.find({
                severity: 'critical',
                status: 'new',
                timestamp: { $lt: fiveMinutesAgo },
                escalated: { $ne: true }
            });
            if (alertsToEscalate.length === 0)
                return;
            const admins = yield User_1.default.find({ role: 'admin' });
            for (const alert of alertsToEscalate) {
                // Mark as escalated
                alert.escalated = true;
                alert.escalatedAt = new Date();
                yield alert.save();
                // Notify Admins
                const notifs = admins.map(admin => ({
                    recipient: admin._id,
                    type: 'error',
                    title: 'ESCALATED ALERT',
                    message: `Critical alert escalated: ${alert.type} (ID: ${alert._id}) - Unacknowledged for 5+ mins`,
                    read: false,
                    link: '/admin/alerts'
                }));
                yield Notification_1.default.insertMany(notifs);
                // Real-time Push
                admins.forEach(admin => {
                    io.to(admin._id.toString()).emit('new_alert', Object.assign(Object.assign({}, alert.toObject()), { message: `ESCALATED: ${alert.type}` }));
                });
                console.log(`Escalated alert ${alert._id} to admins`);
            }
        }
        catch (error) {
            console.error('Escalation Service Error:', error);
        }
    }));
    console.log('Escalation Service initialized');
};
exports.setupEscalationService = setupEscalationService;
