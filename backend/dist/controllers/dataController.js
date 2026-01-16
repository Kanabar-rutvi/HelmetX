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
exports.ingestSensorData = exports.escalateAlert = exports.updateAlertStatus = exports.createAlert = exports.getAlerts = exports.getSafetySummary = exports.getSensorData = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const SensorData_1 = __importDefault(require("../models/SensorData"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Device_1 = __importDefault(require("../models/Device"));
const User_1 = __importDefault(require("../models/User"));
const Config_1 = __importDefault(require("../models/Config"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const getSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield SensorData_1.default.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getSensorData = getSensorData;
const getSafetySummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dateStr = req.query.date || new Date().toISOString().split('T')[0];
        const site = req.query.site || undefined;
        const start = new Date(dateStr + 'T00:00:00.000Z');
        const end = new Date(dateStr + 'T23:59:59.999Z');
        let userFilter = {};
        if (site) {
            const usersAtSite = yield User_1.default.find({ assignedSite: site }).select('_id');
            userFilter.userId = { $in: usersAtSite.map(u => u._id) };
        }
        const sensor = yield SensorData_1.default.find(Object.assign({ timestamp: { $gte: start, $lte: end } }, userFilter));
        const alerts = yield Alert_1.default.find({
            timestamp: { $gte: start, $lte: end }
        });
        const totals = {
            samples: sensor.length,
            helmetOffEvents: alerts.filter(a => a.type === 'helmet_off').length,
            sosEvents: alerts.filter(a => a.type === 'SOS').length,
            gasAlerts: alerts.filter(a => a.type === 'GAS').length,
            highTempAlerts: alerts.filter(a => a.type === 'high_temp').length,
            falls: alerts.filter(a => a.type === 'fall').length,
            unsafeBehaviorReports: alerts.filter(a => a.type === 'unsafe_behavior').length
        };
        const helmetOnRate = sensor.length
            ? (sensor.filter(s => s.helmetOn === true).length / sensor.length)
            : 0;
        res.json({
            date: dateStr,
            site: site || null,
            helmetOnRate,
            totals
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getSafetySummary = getSafetySummary;
const getAlerts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const mine = req.query.mine === 'true';
        const filter = mine ? { user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id } : {};
        const alerts = yield Alert_1.default.find(filter)
            .populate('user', 'name')
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAlerts = getAlerts;
const createAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, deviceId, severity, value } = req.body;
        // Check if device exists
        const device = yield Device_1.default.findOne({ deviceId });
        const alert = yield Alert_1.default.create({
            type,
            deviceId,
            user: (device === null || device === void 0 ? void 0 : device.assignedUser) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id), // Prefer device user, fallback to req.user
            severity: severity || 'critical',
            value: value || 'Manual SOS',
            status: 'new'
        });
        // Emit socket event for real-time alert
        const io = req.app.get('io');
        if (io) {
            io.emit('new_alert', alert);
        }
        res.status(201).json(alert);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createAlert = createAlert;
const updateAlertStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { status } = req.body; // 'acknowledged' | 'resolved'
        const alert = yield Alert_1.default.findById(id);
        if (!alert)
            return res.status(404).json({ message: 'Alert not found' });
        alert.status = status || alert.status;
        if (status === 'acknowledged') {
            alert.acknowledgedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            alert.acknowledgedAt = new Date();
        }
        if (status === 'resolved') {
            alert.resolvedBy = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            alert.resolvedAt = new Date();
        }
        const updated = yield alert.save();
        const io = req.app.get('io');
        if (io)
            io.emit('alert_update', updated);
        yield AuditLog_1.default.create({
            actor: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            action: 'update_alert_status',
            targetType: 'Alert',
            targetId: id,
            metadata: { status }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateAlertStatus = updateAlertStatus;
const escalateAlert = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const alert = yield Alert_1.default.findById(id);
        if (!alert)
            return res.status(404).json({ message: 'Alert not found' });
        alert.escalated = true;
        alert.escalatedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        alert.escalatedAt = new Date();
        const updated = yield alert.save();
        const io = req.app.get('io');
        if (io)
            io.emit('alert_escalated', updated);
        yield AuditLog_1.default.create({
            actor: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            action: 'escalate_alert',
            targetType: 'Alert',
            targetId: id
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.escalateAlert = escalateAlert;
const mapPayload = (p) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const helmetValue = (_a = p.helmet) !== null && _a !== void 0 ? _a : p.helmetOn;
    return {
        heartRate: (_d = (_c = (_b = p.hr) !== null && _b !== void 0 ? _b : p.heartRate) !== null && _c !== void 0 ? _c : p.heart) !== null && _d !== void 0 ? _d : p.pulse,
        temperature: (_g = (_f = (_e = p.temp) !== null && _e !== void 0 ? _e : p.temperature) !== null && _f !== void 0 ? _f : p.bodyTemp) !== null && _g !== void 0 ? _g : p.bodytemp,
        gasLevel: (_j = (_h = p.mq) !== null && _h !== void 0 ? _h : p.gasLevel) !== null && _j !== void 0 ? _j : p.gas,
        helmetOn: typeof helmetValue === 'boolean' ? helmetValue : helmetValue !== 'off',
        latitude: (_k = p.lat) !== null && _k !== void 0 ? _k : p.latitude,
        longitude: (_l = p.lng) !== null && _l !== void 0 ? _l : p.longitude,
        ambientTemp: (_m = p.ambientTemp) !== null && _m !== void 0 ? _m : p.ambient,
        battery: p.battery,
        sos: p.sos === true || p.alert === 'SOS' || p.sosButton === true,
        accident: p.accident === true || p.fall === true,
        humidity: (_o = p.hum) !== null && _o !== void 0 ? _o : p.humidity,
        accel: (_p = p.accel) !== null && _p !== void 0 ? _p : {
            x: p.ax,
            y: p.ay,
            z: p.az,
            total: (_q = p.totalAccel) !== null && _q !== void 0 ? _q : (p.ax && p.ay && p.az ? Math.sqrt(p.ax * p.ax + p.ay * p.ay + p.az * p.az) : undefined)
        },
        ledStatus: (_r = p.led) !== null && _r !== void 0 ? _r : (p.ledStatus === true || p.ledStatus === 'ON')
    };
};
const lastByDevice = new Map();
const BATCH_INTERVAL = Number(process.env.BATCH_INTERVAL_MS || 10000);
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        if (lastByDevice.size === 0)
            return;
        const docs = [];
        const now = new Date();
        const config = yield Config_1.default.findOne().sort({ createdAt: -1 });
        const thresholds = (config === null || config === void 0 ? void 0 : config.thresholds) || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };
        for (const [deviceId, entry] of lastByDevice.entries()) {
            const payload = entry.payload;
            const device = yield Device_1.default.findOne({ deviceId }).populate('assignedUser');
            const userId = (_a = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _a === void 0 ? void 0 : _a._id;
            docs.push({
                deviceId,
                userId,
                timestamp: now,
                heartRate: payload.heartRate,
                temperature: payload.temperature,
                gasLevel: payload.gasLevel,
                helmetOn: payload.helmetOn,
                latitude: payload.latitude,
                longitude: payload.longitude,
                ambientTemp: payload.ambientTemp,
                battery: payload.battery
            });
            if (device) {
                device.lastSeen = now;
                if (payload.latitude)
                    device.lat = payload.latitude;
                if (payload.longitude)
                    device.lng = payload.longitude;
                if (typeof payload.battery === 'number')
                    device.batteryLevel = payload.battery;
                device.status = 'online';
                yield device.save();
            }
            else {
                yield Device_1.default.findOneAndUpdate({ deviceId }, { status: 'online', lastSeen: now, batteryLevel: payload.battery }, { upsert: true, new: true });
            }
            // Basic alert rules
            const io = (_d = (_c = ((_b = entry.req) === null || _b === void 0 ? void 0 : _b.app)) === null || _c === void 0 ? void 0 : _c.get) === null || _d === void 0 ? void 0 : _d.call(_c, 'io');
            const alerts = [];
            if (payload.sos)
                alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
            if (payload.accident)
                alerts.push({ type: 'fall', severity: 'critical', value: 'Possible fall detected' });
            if (payload.helmetOn === false)
                alerts.push({ type: 'helmet_off', severity: 'warning', value: 'Helmet not worn' });
            if (typeof payload.temperature === 'number' && payload.temperature > thresholds.temperature)
                alerts.push({ type: 'high_temp', severity: 'warning', value: `Temp ${payload.temperature}` });
            if (typeof payload.gasLevel === 'number' && payload.gasLevel > thresholds.gasLevel)
                alerts.push({ type: 'GAS', severity: 'critical', value: `Gas ${payload.gasLevel}` });
            for (const a of alerts) {
                const created = yield Alert_1.default.create({
                    type: a.type,
                    deviceId,
                    user: (_e = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _e === void 0 ? void 0 : _e._id,
                    severity: a.severity,
                    value: a.value,
                    status: 'new'
                });
                // Link to Attendance
                if ((_f = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _f === void 0 ? void 0 : _f._id) {
                    const today = new Date().toISOString().split('T')[0];
                    yield Attendance_1.default.findOneAndUpdate({ user: device.assignedUser._id, date: today, checkOutTime: { $exists: false } }, { $push: { alerts: created._id } });
                }
                if (io)
                    io.emit('new_alert', created);
            }
        }
        if (docs.length) {
            yield SensorData_1.default.insertMany(docs);
        }
        lastByDevice.clear();
    }
    catch (error) {
        console.error('Batch storage error:', error);
    }
}), BATCH_INTERVAL);
const ingestSensorData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body || {};
        const deviceId = body.deviceId || req.query.deviceId;
        if (!deviceId) {
            return res.status(400).json({ message: 'deviceId is required' });
        }
        const payload = mapPayload(body);
        lastByDevice.set(deviceId, { payload, req });
        const io = req.app.get('io');
        if (io) {
            io.emit('sensor_update', { deviceId, data: payload });
            io.emit('device_status', { deviceId, status: 'online' });
        }
        res.status(202).json({ queued: true, deviceId });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.ingestSensorData = ingestSensorData;
