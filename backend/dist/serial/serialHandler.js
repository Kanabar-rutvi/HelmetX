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
exports.setupSerial = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const SensorData_1 = __importDefault(require("../models/SensorData"));
const Device_1 = __importDefault(require("../models/Device"));
const Alert_1 = __importDefault(require("../models/Alert"));
const Config_1 = __importDefault(require("../models/Config"));
const notificationService_1 = require("../services/notificationService");
const setupSerial = (io) => {
    const portPath = process.env.SERIAL_PORT || 'COM10';
    const defaultDeviceId = process.env.SERIAL_DEVICE_ID || 'esp32-com10';
    try {
        const port = new serialport_1.SerialPort({ path: portPath, baudRate: 115200 });
        const parser = port.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\n' }));
        console.log(`Serial listening on ${portPath}`);
        parser.on('data', (line) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const text = line.trim();
                if (!text.startsWith('{') || !text.endsWith('}')) {
                    return;
                }
                const payload = JSON.parse(text);
                const deviceId = payload.deviceId || defaultDeviceId;
                const config = yield Config_1.default.findOne().sort({ createdAt: -1 });
                const thresholds = (config === null || config === void 0 ? void 0 : config.thresholds) || { temperature: 38, gasLevel: 400, heartRateMin: 60, heartRateMax: 100 };
                const device = yield Device_1.default.findOne({ deviceId }).populate('assignedUser');
                const userId = (_a = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _a === void 0 ? void 0 : _a._id;
                const newData = new SensorData_1.default({
                    deviceId,
                    userId,
                    heartRate: payload.heartRate,
                    temperature: payload.temperature,
                    gasLevel: payload.gasLevel,
                    helmetOn: payload.helmetOn,
                    latitude: payload.lat || payload.latitude,
                    longitude: payload.lng || payload.longitude,
                    ambientTemp: payload.ambientTemp,
                    battery: payload.battery,
                    timestamp: new Date()
                });
                yield newData.save();
                if (device) {
                    device.lastSeen = new Date();
                    device.batteryLevel = payload.battery || device.batteryLevel;
                    if (payload.lat || payload.latitude)
                        device.lat = payload.lat || payload.latitude;
                    if (payload.lng || payload.longitude)
                        device.lng = payload.lng || payload.longitude;
                    device.status = 'online';
                    yield device.save();
                }
                else {
                    yield Device_1.default.findOneAndUpdate({ deviceId }, { status: 'online', lastSeen: new Date(), batteryLevel: payload.battery }, { upsert: true, new: true });
                }
                io.emit('sensor_update', { deviceId, data: payload, user: device === null || device === void 0 ? void 0 : device.assignedUser });
                io.emit('device_status', { deviceId, status: 'online' });
                // Removed auto-attendance on helmetOn (Requirement: Strict scan events only)
                const alerts = [];
                if (payload.sos)
                    alerts.push({ type: 'SOS', severity: 'critical', value: 'SOS Button Pressed' });
                if (payload.gasLevel > thresholds.gasLevel)
                    alerts.push({ type: 'GAS', severity: 'critical', value: `Gas Level: ${payload.gasLevel}` });
                if (payload.temperature > thresholds.temperature)
                    alerts.push({ type: 'high_temp', severity: 'high', value: `Body Temp: ${payload.temperature}` });
                if (payload.heartRate && (payload.heartRate < thresholds.heartRateMin || payload.heartRate > thresholds.heartRateMax)) {
                    alerts.push({ type: 'abnormal_heart_rate', severity: 'high', value: `Heart Rate: ${payload.heartRate}` });
                }
                if (payload.helmetOn === false)
                    alerts.push({ type: 'helmet_off', severity: 'medium', value: 'Helmet Removed' });
                if (payload.fall)
                    alerts.push({ type: 'fall', severity: 'critical', value: 'Fall Detected' });
                if (payload.unsafe_behavior)
                    alerts.push({ type: 'unsafe_behavior', severity: 'medium', value: payload.unsafe_behavior_type || 'Unsafe Behavior Detected' });
                for (const alert of alerts) {
                    const recentAlert = yield Alert_1.default.findOne({
                        deviceId,
                        type: alert.type,
                        status: 'new',
                        timestamp: { $gt: new Date(Date.now() - 60000) }
                    });
                    if (!recentAlert) {
                        const newAlert = yield Alert_1.default.create(Object.assign(Object.assign({ deviceId, user: device === null || device === void 0 ? void 0 : device.assignedUser }, alert), { status: 'new' }));
                        io.emit('new_alert', newAlert);
                        (0, notificationService_1.notifyAlert)(newAlert, device || undefined);
                    }
                }
            }
            catch (err) {
                console.error('Serial parse error:', err);
            }
        }));
        port.on('error', (err) => {
            console.error(`Serial port error on ${portPath}:`, err);
        });
        return port;
    }
    catch (error) {
        console.error(`Failed to open serial port ${portPath}:`, error);
        return null;
    }
};
exports.setupSerial = setupSerial;
