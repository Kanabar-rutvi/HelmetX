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
exports.setupMQTT = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const SensorData_1 = __importDefault(require("../models/SensorData"));
const Device_1 = __importDefault(require("../models/Device"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Attendance_1 = __importDefault(require("../models/Attendance"));
const Config_1 = __importDefault(require("../models/Config"));
const notificationService_1 = require("../services/notificationService");
const attendanceController_1 = require("../controllers/attendanceController");
const setupMQTT = (io) => {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
    const client = mqtt_1.default.connect(brokerUrl);
    client.on('connect', () => {
        console.log(`Connected to MQTT Broker: ${brokerUrl}`);
        client.subscribe('helmet/+/data', (err) => {
            if (!err)
                console.log('Subscribed to helmet/+/data');
        });
        client.subscribe('helmet/+/status', (err) => {
            if (!err)
                console.log('Subscribed to helmet/+/status');
        });
        client.subscribe('helmet/+/scan', (err) => {
            if (!err)
                console.log('Subscribed to helmet/+/scan');
        });
    });
    client.on('message', (topic, message) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const payload = JSON.parse(message.toString());
            const topicParts = topic.split('/');
            const deviceId = topicParts[1];
            const msgType = topicParts[2]; // data, status, scan
            if (msgType === 'scan') {
                yield (0, attendanceController_1.processScan)({
                    helmetId: deviceId,
                    scanType: payload.type || payload.scanType,
                    timestamp: new Date(payload.timestamp || Date.now()),
                    lat: payload.lat,
                    lng: payload.lng
                }, io);
                return;
            }
            if (msgType === 'status') {
                const device = yield Device_1.default.findOneAndUpdate({ deviceId }, { status: payload.status, lastSeen: new Date(), batteryLevel: payload.battery }, { upsert: true, new: true });
                io.emit('device_status', { deviceId, status: payload.status });
                // Removed old auto-checkout on offline to adhere to strict scan-out requirement
                return;
            }
            // Handle Sensor Data
            // Payload: { heartRate, temperature, gasLevel, helmetOn, lat, lng, battery }
            // Fetch Config
            const config = yield Config_1.default.findOne().sort({ createdAt: -1 });
            const thresholds = (config === null || config === void 0 ? void 0 : config.thresholds) || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };
            // 1. Save Sensor Data
            const device = yield Device_1.default.findOne({ deviceId }).populate('assignedUser');
            const userId = (_a = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _a === void 0 ? void 0 : _a._id;
            const newData = new SensorData_1.default(Object.assign(Object.assign({ deviceId,
                userId }, payload), { timestamp: new Date() }));
            yield newData.save();
            // 2. Update Device Last Seen & Battery
            if (device) {
                device.lastSeen = new Date();
                device.batteryLevel = payload.battery || device.batteryLevel;
                if (payload.lat)
                    device.lat = payload.lat;
                if (payload.lng)
                    device.lng = payload.lng;
                yield device.save();
            }
            // 3. Emit to WebSocket
            io.emit('sensor_update', { deviceId, data: payload, user: device === null || device === void 0 ? void 0 : device.assignedUser });
            // Removed old auto-checkin on helmetOn to adhere to strict scan-in requirement
            // 5. Alert Logic
            const alerts = [];
            // SOS
            if (payload.sos) {
                alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
            }
            // Gas
            if (payload.gasLevel > thresholds.gasLevel) {
                alerts.push({ type: 'GAS', severity: 'critical', value: `Gas Level: ${payload.gasLevel}` });
            }
            // Temperature
            if (payload.temperature > thresholds.temperature) {
                alerts.push({ type: 'high_temp', severity: 'high', value: `Body Temp: ${payload.temperature}` });
            }
            // Heart Rate
            if (payload.heartRate && (payload.heartRate < thresholds.heartRateMin || payload.heartRate > thresholds.heartRateMax)) {
                alerts.push({ type: 'abnormal_heart_rate', severity: 'high', value: `Heart Rate: ${payload.heartRate}` });
            }
            // Helmet Off
            if (payload.helmetOn === false) {
                alerts.push({ type: 'helmet_off', severity: 'medium', value: 'Helmet Removed' });
            }
            // Fall Detection
            if (payload.fall) {
                alerts.push({ type: 'fall', severity: 'critical', value: 'Fall Detected' });
            }
            // Unsafe Behavior (e.g., entering restricted area, running, etc. - detected by device)
            if (payload.unsafe_behavior) {
                alerts.push({ type: 'unsafe_behavior', severity: 'medium', value: payload.unsafe_behavior_type || 'Unsafe Behavior Detected' });
            }
            for (const alert of alerts) {
                // Debounce: Check if recent alert of same type exists
                const recentAlert = yield Alert_1.default.findOne({
                    deviceId,
                    type: alert.type,
                    status: 'new',
                    timestamp: { $gt: new Date(Date.now() - 60000) } // 1 minute debounce
                });
                if (!recentAlert) {
                    const newAlert = yield Alert_1.default.create(Object.assign(Object.assign({ deviceId, user: device === null || device === void 0 ? void 0 : device.assignedUser }, alert), { status: 'new' }));
                    console.log(`Alert Generated: ${alert.type} for ${deviceId}`);
                    // Link to Attendance
                    if (userId) {
                        const today = new Date().toISOString().split('T')[0];
                        yield Attendance_1.default.findOneAndUpdate({ user: userId, date: today, checkOutTime: { $exists: false } }, { $push: { alerts: newAlert._id } });
                    }
                    // Emit Alert to WebSocket
                    io.emit('new_alert', newAlert);
                    // Send Notifications
                    (0, notificationService_1.notifyAlert)(newAlert, device);
                }
            }
        }
        catch (error) {
            console.error('MQTT Message Error:', error);
        }
    }));
    return client;
};
exports.setupMQTT = setupMQTT;
