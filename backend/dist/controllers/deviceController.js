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
exports.deleteDevice = exports.updateDevice = exports.createDevice = exports.getWorkerCountsBySite = exports.getWorkerLocations = exports.getDevices = void 0;
const Device_1 = __importDefault(require("../models/Device"));
const getDevices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const devices = yield Device_1.default.find().populate('assignedUser', 'name email');
        res.json(devices);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getDevices = getDevices;
const getWorkerLocations = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const devices = yield Device_1.default.find({ lat: { $ne: null }, lng: { $ne: null } })
            .populate('assignedUser', 'name email assignedSite');
        const locations = devices.map(d => ({
            deviceId: d.deviceId,
            lat: d.lat,
            lng: d.lng,
            user: d.assignedUser ? {
                name: d.assignedUser.name,
                email: d.assignedUser.email,
                assignedSite: d.assignedUser.assignedSite
            } : null
        }));
        res.json(locations);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getWorkerLocations = getWorkerLocations;
const getWorkerCountsBySite = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const devices = yield Device_1.default.find().populate('assignedUser', 'assignedSite');
        const counts = {};
        for (const d of devices) {
            const site = ((_a = d.assignedUser) === null || _a === void 0 ? void 0 : _a.assignedSite) || 'Unknown';
            if (d.lat != null && d.lng != null) {
                counts[site] = (counts[site] || 0) + 1;
            }
        }
        res.json(counts);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getWorkerCountsBySite = getWorkerCountsBySite;
const createDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { deviceId, assignedUser } = req.body;
    try {
        const device = new Device_1.default({ deviceId, assignedUser });
        const createdDevice = yield device.save();
        res.status(201).json(createdDevice);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid device data' });
    }
});
exports.createDevice = createDevice;
const updateDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { assignedUser, status } = req.body;
    try {
        const device = yield Device_1.default.findById(req.params.id);
        if (device) {
            device.assignedUser = assignedUser || device.assignedUser;
            device.status = status || device.status;
            const updatedDevice = yield device.save();
            res.json(updatedDevice);
        }
        else {
            res.status(404).json({ message: 'Device not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateDevice = updateDevice;
const deleteDevice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const device = yield Device_1.default.findById(req.params.id);
        if (device) {
            yield device.deleteOne();
            res.json({ message: 'Device removed' });
        }
        else {
            res.status(404).json({ message: 'Device not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.deleteDevice = deleteDevice;
