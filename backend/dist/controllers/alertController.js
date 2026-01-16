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
exports.createAlert = exports.updateAlertStatus = exports.getAlertStats = exports.getAlerts = void 0;
const Alert_1 = __importDefault(require("../models/Alert"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const Site_1 = __importDefault(require("../models/Site"));
const auditService_1 = require("../services/auditService");
// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private/Admin
const getAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, type, startDate, endDate, severity } = req.query;
        let query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (severity)
            query.severity = severity;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate)
                query.timestamp.$gte = new Date(startDate);
            if (endDate)
                query.timestamp.$lte = new Date(endDate);
        }
        const alerts = yield Alert_1.default.find(query)
            .populate('user', 'name email employeeId')
            .populate('acknowledgedBy', 'name')
            .populate('resolvedBy', 'name')
            .sort({ timestamp: -1 });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.getAlerts = getAlerts;
// @desc    Get alert statistics
// @route   GET /api/alerts/stats
// @access  Private/Admin
const getAlertStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const total = yield Alert_1.default.countDocuments();
        const active = yield Alert_1.default.countDocuments({ status: { $ne: 'resolved' } });
        const critical = yield Alert_1.default.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } });
        const resolved = yield Alert_1.default.countDocuments({ status: 'resolved' });
        // Group by type
        const byType = yield Alert_1.default.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        res.json({ total, active, critical, resolved, byType });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.getAlertStats = getAlertStats;
// @desc    Update alert status (acknowledge/resolve)
// @route   PUT /api/alerts/:id
// @access  Private/Admin
const updateAlertStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const alert = yield Alert_1.default.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        alert.status = status;
        if (status === 'acknowledged') {
            alert.acknowledgedBy = req.user._id;
            alert.acknowledgedAt = new Date();
        }
        else if (status === 'resolved') {
            alert.resolvedBy = req.user._id;
            alert.resolvedAt = new Date();
        }
        yield alert.save();
        res.json(alert);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.updateAlertStatus = updateAlertStatus;
// @desc    Create manual alert (for testing)
// @route   POST /api/alerts
// @access  Private/Admin
const createAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, deviceId, severity, message, userId } = req.body;
        const alert = yield Alert_1.default.create({
            type,
            deviceId,
            severity,
            value: message,
            user: userId,
            status: 'new',
            timestamp: new Date()
        });
        const io = req.app.get('io');
        // Workflow Logic
        try {
            const user = userId ? yield User_1.default.findById(userId) : null;
            const siteId = user === null || user === void 0 ? void 0 : user.assignedSite;
            // 1. Notify Worker (Low Severity)
            if (severity === 'low' && userId) {
                yield Notification_1.default.create({
                    recipient: userId,
                    type: 'info',
                    title: 'Alert',
                    message: message || `New alert: ${type}`,
                    read: false
                });
                // io.to(userId).emit('alert', alert); // Assuming user joins room by ID
            }
            // 2. Notify Supervisors (Medium+)
            if (['medium', 'high', 'critical'].includes(severity) && siteId) {
                const site = yield Site_1.default.findById(siteId);
                if (site && site.supervisors && site.supervisors.length > 0) {
                    const notifs = site.supervisors.map((supId) => ({
                        recipient: supId,
                        type: severity === 'critical' ? 'error' : 'warning',
                        title: `Site Alert: ${type}`,
                        message: `New ${severity} alert at ${site.name}: ${message || type}`,
                        read: false,
                        link: `/supervisor`
                    }));
                    yield Notification_1.default.insertMany(notifs);
                    site.supervisors.forEach((supId) => {
                        io.to(supId.toString()).emit('new_alert', alert);
                    });
                }
            }
            // 3. Notify Admin (High/Critical)
            if (['high', 'critical'].includes(severity)) {
                const admins = yield User_1.default.find({ role: 'admin' });
                if (admins.length > 0) {
                    const notifs = admins.map(admin => ({
                        recipient: admin._id,
                        type: 'error',
                        title: `CRITICAL ALERT: ${type}`,
                        message: `Critical incident reported: ${message || type}`,
                        read: false
                    }));
                    yield Notification_1.default.insertMany(notifs);
                    admins.forEach(admin => {
                        io.to(admin._id.toString()).emit('new_alert', alert);
                    });
                }
            }
        }
        catch (workflowError) {
            console.error('Workflow Error:', workflowError);
            // Don't fail the request if notifications fail, just log it
        }
        // Audit Log for manual creation
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) {
            yield (0, auditService_1.logAction)(req.user._id, 'CREATE_ALERT_MANUAL', 'Alert', alert._id.toString(), `Manual alert: ${type}`);
        }
        res.status(201).json(alert);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.createAlert = createAlert;
