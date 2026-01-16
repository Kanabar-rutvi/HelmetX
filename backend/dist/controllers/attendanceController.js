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
exports.approveAttendance = exports.scanQR = exports.getAllHistory = exports.getAllLogs = exports.getTodayAll = exports.checkOut = exports.checkIn = exports.processScan = exports.getScanLogs = exports.getAuditLogs = exports.deleteAttendance = exports.updateAttendance = exports.verifyAttendance = exports.getOverview = exports.getMyHistory = exports.getMyWeekly = exports.getMyDaily = exports.getMyVitals = void 0;
const Attendance_1 = __importDefault(require("../models/Attendance"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const SensorData_1 = __importDefault(require("../models/SensorData"));
const User_1 = __importDefault(require("../models/User"));
const Device_1 = __importDefault(require("../models/Device"));
const Site_1 = __importDefault(require("../models/Site"));
const Shift_1 = __importDefault(require("../models/Shift"));
const ScanLog_1 = __importDefault(require("../models/ScanLog"));
const Notification_1 = __importDefault(require("../models/Notification"));
const formatDate = (d) => d.toISOString().split('T')[0];
// Helper: Haversine Distance in meters
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const getMyVitals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const data = yield SensorData_1.default.find({ userId }).sort({ timestamp: -1 }).limit(100);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyVitals = getMyVitals;
const getMyDaily = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const today = formatDate(new Date());
        const records = yield Attendance_1.default.find({ user: userId, date: today }).sort({ checkInTime: -1 });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyDaily = getMyDaily;
const getMyWeekly = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(formatDate(d));
        }
        const records = yield Attendance_1.default.find({ user: userId, date: { $in: days } }).sort({ date: -1 });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyWeekly = getMyWeekly;
const getMyHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const records = yield Attendance_1.default.find({ user: userId }).sort({ date: -1 }).limit(30);
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyHistory = getMyHistory;
const getOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId, date } = req.query;
        const queryDate = date ? date : formatDate(new Date());
        // Find users in this site first
        let userFilter = {};
        if (siteId) {
            const users = yield User_1.default.find({ assignedSite: siteId }).select('_id');
            userFilter.user = { $in: users.map(u => u._id) };
        }
        const query = Object.assign({ date: queryDate }, userFilter);
        const totalUsers = yield User_1.default.countDocuments(siteId ? { assignedSite: siteId, role: 'worker' } : { role: 'worker' });
        const totalAttendance = yield Attendance_1.default.countDocuments(query);
        const present = yield Attendance_1.default.countDocuments(Object.assign(Object.assign({}, query), { status: 'present' }));
        const late = yield Attendance_1.default.countDocuments(Object.assign(Object.assign({}, query), { status: 'late' }));
        const checkedOut = yield Attendance_1.default.countDocuments(Object.assign(Object.assign({}, query), { status: 'checked_out' }));
        // Calculate Average Duration for checked out users
        const completedRecords = yield Attendance_1.default.find(Object.assign(Object.assign({}, query), { status: 'checked_out', duration: { $exists: true } }));
        const totalDuration = completedRecords.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const avgDuration = completedRecords.length ? Math.round(totalDuration / completedRecords.length) : 0;
        // Absent = Total Users - (Present + Late + Checked Out)
        // This accounts for both users with no record and users with explicit 'absent' status
        const absent = Math.max(0, totalUsers - (present + late + checkedOut));
        res.json({ date: queryDate, total: totalAttendance, present, late, checkedOut, absent, avgDuration });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getOverview = getOverview;
const verifyAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const record = yield Attendance_1.default.findById(id);
        if (!record)
            return res.status(404).json({ message: 'Record not found' });
        record.verified = true;
        yield record.save();
        yield AuditLog_1.default.create({
            actor: adminId,
            action: 'VERIFY_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: `Attendance verified by ${((_b = req.user) === null || _b === void 0 ? void 0 : _b.name) || 'Admin'}`
        });
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.verifyAttendance = verifyAttendance;
const updateAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { checkInTime, checkOutTime, status } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const record = yield Attendance_1.default.findById(id);
        if (!record)
            return res.status(404).json({ message: 'Record not found' });
        const oldValues = {
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            status: record.status,
            duration: record.duration
        };
        if (checkInTime)
            record.checkInTime = new Date(checkInTime);
        if (checkOutTime) {
            record.checkOutTime = new Date(checkOutTime);
            record.status = 'checked_out';
        }
        if (status)
            record.status = status;
        // Recalculate duration if times changed
        if (record.checkInTime && record.checkOutTime) {
            const start = new Date(record.checkInTime).getTime();
            const end = new Date(record.checkOutTime).getTime();
            record.duration = Math.round((end - start) / (1000 * 60));
        }
        record.source = 'MANUAL_OVERRIDE'; // Mark as manually edited
        yield record.save();
        yield AuditLog_1.default.create({
            actor: adminId,
            action: 'UPDATE_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: 'Manual correction of attendance record',
            metadata: {
                old: oldValues,
                new: {
                    checkInTime: record.checkInTime,
                    checkOutTime: record.checkOutTime,
                    status: record.status,
                    duration: record.duration
                }
            }
        });
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateAttendance = updateAttendance;
const deleteAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const record = yield Attendance_1.default.findById(id);
        if (!record)
            return res.status(404).json({ message: 'Record not found' });
        yield Attendance_1.default.findByIdAndDelete(id);
        // Remove associated scan logs for the same day to allow re-scan
        try {
            const base = record.checkInTime ? new Date(record.checkInTime) : new Date(record.date);
            const dayStart = new Date(base);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            yield ScanLog_1.default.deleteMany({
                helmetId: record.deviceId,
                timestamp: { $gte: dayStart, $lt: dayEnd },
                status: { $in: ['valid', 'duplicate'] }
            });
        }
        catch ( /* noop */_b) { /* noop */ }
        yield AuditLog_1.default.create({
            actor: adminId,
            action: 'DELETE_ATTENDANCE',
            targetType: 'Attendance',
            targetId: id,
            details: 'Attendance record deleted',
            metadata: {
                user: record.user,
                date: record.date,
                deviceId: record.deviceId,
                status: record.status,
                duration: record.duration
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.deleteAttendance = deleteAttendance;
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield AuditLog_1.default.find()
            .populate('actor', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAuditLogs = getAuditLogs;
const getScanLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId, date, workerId, helmetId } = req.query;
        let query = {};
        if (siteId)
            query.siteId = siteId;
        if (workerId)
            query.workerId = workerId;
        if (helmetId)
            query.helmetId = { $regex: helmetId, $options: 'i' };
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            query.timestamp = { $gte: start, $lt: end };
        }
        const logs = yield ScanLog_1.default.find(query)
            .populate('workerId', 'name email')
            .populate('siteId', 'name')
            .sort({ timestamp: -1 })
            .limit(200);
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getScanLogs = getScanLogs;
// Internal function to process scan (used by MQTT/Socket/API)
const processScan = (payload, io) => __awaiter(void 0, void 0, void 0, function* () {
    const { helmetId, scanType, timestamp, lat, lng } = payload;
    console.log(`Processing Scan: ${helmetId} ${scanType}`);
    // 1. Identify User & Site
    const device = yield Device_1.default.findOne({ deviceId: helmetId }).populate('assignedUser');
    if (!device || !device.assignedUser) {
        yield ScanLog_1.default.create({
            helmetId, scanType, timestamp, location: { lat, lng }, status: 'invalid', failReason: 'Device not assigned'
        });
        return { error: 'Device not assigned' };
    }
    const user = device.assignedUser;
    const siteId = user.assignedSite;
    let site = null;
    if (siteId) {
        site = yield Site_1.default.findById(siteId);
    }
    // 2. Geo-fence Validation
    if (site && site.location && site.location.coordinates && lat && lng) {
        const [siteLng, siteLat] = site.location.coordinates;
        const distance = getDistanceFromLatLonInM(lat, lng, siteLat, siteLng);
        if (distance > (site.geofenceRadius || 100)) {
            yield ScanLog_1.default.create({
                helmetId, workerId: user._id, siteId: site._id, scanType, timestamp, location: { lat, lng },
                status: 'geo_fail', failReason: `Outside geofence: ${Math.round(distance)}m`
            });
            // We log it but do we block it? Requirement says "validate". 
            // For strictness, we might return error, but for now let's allow with warning log or strict block.
            // Requirement: "validate that Scan-IN occurs inside the site geo-fence" -> implies block.
            if (scanType === 'IN') {
                return { error: 'Outside Geofence' };
            }
        }
    }
    const today = formatDate(new Date(timestamp));
    // 3. Attendance Logic
    if (scanType === 'IN') {
        // Check for existing IN
        const existing = yield Attendance_1.default.findOne({ user: user._id, date: today });
        if (existing) {
            yield ScanLog_1.default.create({
                helmetId, workerId: user._id, siteId: site === null || site === void 0 ? void 0 : site._id, scanType, timestamp, location: { lat, lng },
                status: 'duplicate', failReason: 'Already checked in'
            });
            return { message: 'Already checked in', record: existing };
        }
        const newRecord = yield Attendance_1.default.create({
            user: user._id,
            deviceId: helmetId,
            site: site === null || site === void 0 ? void 0 : site._id,
            date: today,
            checkInTime: timestamp,
            checkInLocation: (lat !== undefined && lng !== undefined) ? { lat, lng } : undefined,
            status: 'present',
            source: 'HELMET_SCANNER'
        });
        yield ScanLog_1.default.create({
            helmetId, workerId: user._id, siteId: site === null || site === void 0 ? void 0 : site._id, scanType, timestamp, location: { lat, lng }, status: 'valid'
        });
        if (io)
            io.emit('attendance-update', { type: 'IN', record: newRecord });
        return { success: true, record: newRecord };
    }
    else {
        // scanType === 'OUT'
        const record = yield Attendance_1.default.findOne({ user: user._id, date: today });
        if (!record) {
            yield ScanLog_1.default.create({
                helmetId, workerId: user._id, siteId: site === null || site === void 0 ? void 0 : site._id, scanType, timestamp, location: { lat, lng },
                status: 'invalid', failReason: 'No check-in found'
            });
            return { error: 'No check-in found' };
        }
        if (record.checkOutTime) {
            yield ScanLog_1.default.create({
                helmetId, workerId: user._id, siteId: site === null || site === void 0 ? void 0 : site._id, scanType, timestamp, location: { lat, lng },
                status: 'duplicate', failReason: 'Already checked out'
            });
            return { message: 'Already checked out', record };
        }
        record.checkOutTime = timestamp;
        if (lat !== undefined && lng !== undefined) {
            record.checkOutLocation = { lat, lng };
        }
        record.status = 'checked_out';
        // Calculate Duration
        const start = new Date(record.checkInTime).getTime();
        const end = new Date(timestamp).getTime();
        record.duration = Math.round((end - start) / (1000 * 60)); // minutes
        yield record.save();
        yield ScanLog_1.default.create({
            helmetId, workerId: user._id, siteId: site === null || site === void 0 ? void 0 : site._id, scanType, timestamp, location: { lat, lng }, status: 'valid'
        });
        if (io)
            io.emit('attendance-update', { type: 'OUT', record });
        return { success: true, record };
    }
});
exports.processScan = processScan;
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { deviceId, scannedData } = req.body;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Attempt to find assigned device for logging
        let helmetId = deviceId || 'MANUAL_APP';
        if (!deviceId) {
            const device = yield Device_1.default.findOne({ assignedUser: userId });
            if (device)
                helmetId = device.deviceId;
        }
        const today = formatDate(new Date());
        let record = yield Attendance_1.default.findOne({ user: userId, date: today });
        // Log the scan attempt
        yield ScanLog_1.default.create({
            helmetId,
            workerId: userId,
            scanType: 'IN',
            timestamp: new Date(),
            status: 'valid',
            failReason: scannedData ? `Scanned: ${scannedData}` : 'Manual App Check-in'
        });
        if (!record) {
            record = yield Attendance_1.default.create({
                user: userId,
                deviceId: helmetId,
                date: today,
                checkInTime: new Date(),
                status: 'present',
                source: scannedData ? 'QR_SCAN' : 'MANUAL'
            });
        }
        res.status(201).json(record);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.checkIn = checkIn;
const checkOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { scannedData } = req.body;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Attempt to find assigned device for logging
        let helmetId = 'MANUAL_APP';
        const device = yield Device_1.default.findOne({ assignedUser: userId });
        if (device)
            helmetId = device.deviceId;
        const today = formatDate(new Date());
        const record = yield Attendance_1.default.findOne({ user: userId, date: today });
        // Log the scan attempt
        yield ScanLog_1.default.create({
            helmetId,
            workerId: userId,
            scanType: 'OUT',
            timestamp: new Date(),
            status: record ? 'valid' : 'invalid',
            failReason: scannedData ? `Scanned: ${scannedData}` : 'Manual App Check-out'
        });
        if (record) {
            record.checkOutTime = new Date();
            // Calc duration
            const start = new Date(record.checkInTime).getTime();
            const end = record.checkOutTime.getTime();
            record.duration = Math.round((end - start) / (1000 * 60));
            record.status = 'checked_out';
            yield record.save();
            res.json(record);
        }
        else {
            res.status(404).json({ message: 'No check-in record found for today' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.checkOut = checkOut;
const getTodayAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId } = req.query;
        const today = formatDate(new Date());
        let userFilter = {};
        if (siteId) {
            const users = yield User_1.default.find({ assignedSite: siteId }).select('_id');
            userFilter.user = { $in: users.map(u => u._id) };
        }
        const records = yield Attendance_1.default.find(Object.assign({ date: today }, userFilter))
            .populate('user', 'name role assignedSite')
            .sort({ checkInTime: -1 });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getTodayAll = getTodayAll;
const getAllLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId, date } = req.query;
        let query = {};
        if (date)
            query.date = date;
        if (siteId) {
            const users = yield User_1.default.find({ assignedSite: siteId }).select('_id');
            query.user = { $in: users.map(u => u._id) };
        }
        const records = yield Attendance_1.default.find(query)
            .populate('user', 'name role')
            .sort({ date: -1, checkInTime: -1 })
            .limit(100);
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAllLogs = getAllLogs;
const getAllHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId, startDate, endDate } = req.query;
        let query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        if (siteId) {
            const users = yield User_1.default.find({ assignedSite: siteId }).select('_id');
            query.user = { $in: users.map(u => u._id) };
        }
        const records = yield Attendance_1.default.find(query)
            .populate('user', 'name role')
            .sort({ date: -1 });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAllHistory = getAllHistory;
const scanQR = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { qrPayload } = req.body;
        const supervisorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!supervisorId)
            return res.status(401).json({ message: 'Unauthorized' });
        let parsedPayload;
        try {
            parsedPayload = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        }
        catch (e) {
            return res.status(400).json({ message: 'Invalid QR Format' });
        }
        const { type, id } = parsedPayload;
        if (type !== 'HELMET') {
            return res.status(400).json({ message: 'Invalid QR Type. Must be HELMET QR.' });
        }
        const helmetId = id;
        const device = yield Device_1.default.findOne({ deviceId: helmetId }).populate('assignedUser');
        if (!device || !device.assignedUser) {
            return res.status(404).json({ message: 'Helmet not assigned to any worker' });
        }
        const worker = device.assignedUser;
        // Determine Action
        let action = 'CHECK_IN';
        let attendanceRecord = null;
        const existingAttendance = yield Attendance_1.default.findOne({
            user: worker._id,
            date: formatDate(new Date())
        });
        if (existingAttendance && !existingAttendance.checkOutTime) {
            action = 'CHECK_OUT';
            attendanceRecord = existingAttendance;
        }
        else if (existingAttendance && existingAttendance.checkOutTime) {
            return res.status(400).json({ message: 'Worker already checked out for today' });
        }
        // Determine Shift
        let shiftData = {
            name: 'Standard Shift',
            startTime: '09:00',
            endTime: '17:00'
        };
        if (worker.assignedShift) {
            const shift = yield Shift_1.default.findById(worker.assignedShift);
            if (shift) {
                shiftData = {
                    name: shift.name,
                    startTime: shift.startTime,
                    endTime: shift.endTime
                };
            }
        }
        else if (worker.assignedSite) {
            const site = yield Site_1.default.findById(worker.assignedSite);
            if (site && site.shiftTimings) {
                shiftData = {
                    name: `${site.name} Shift`,
                    startTime: site.shiftTimings.start,
                    endTime: site.shiftTimings.end
                };
            }
        }
        res.json({
            action,
            worker: {
                id: worker._id,
                name: worker.name,
                role: worker.role,
                email: worker.email
            },
            helmetId,
            attendanceId: attendanceRecord === null || attendanceRecord === void 0 ? void 0 : attendanceRecord._id,
            shift: shiftData
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.scanQR = scanQR;
const approveAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { workerId, helmetId, action, attendanceId, jobRole } = req.body;
        const supervisorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const io = req.app.get('io');
        if (!supervisorId)
            return res.status(401).json({ message: 'Unauthorized' });
        const timestamp = new Date();
        const worker = yield User_1.default.findById(workerId);
        if (!worker)
            return res.status(404).json({ message: 'Worker not found' });
        if (action === 'CHECK_IN') {
            // Create Attendance
            const today = formatDate(timestamp);
            const newRecord = yield Attendance_1.default.create({
                user: workerId,
                deviceId: helmetId,
                site: worker.assignedSite,
                date: today,
                checkInTime: timestamp,
                status: 'present',
                source: 'SUPERVISOR_SCAN',
                verified: true,
                jobRole
            });
            yield ScanLog_1.default.create({
                helmetId,
                workerId,
                siteId: worker.assignedSite,
                scanType: 'IN',
                timestamp,
                status: 'valid',
                approvedBy: supervisorId,
                approvedAt: timestamp
            });
            // Notify Worker
            const notification = yield Notification_1.default.create({
                recipient: workerId,
                type: 'success',
                title: 'Check-In Approved',
                message: `Your check-in has been approved by supervisor at ${timestamp.toLocaleTimeString()}`,
                read: false
            });
            if (io) {
                io.emit('attendance_notification', {
                    workerId,
                    type: 'CHECK_IN',
                    message: `Check-in approved at ${timestamp.toLocaleTimeString()}`,
                    notification
                });
            }
            res.json(newRecord);
        }
        else {
            // Check Out
            if (!attendanceId)
                return res.status(400).json({ message: 'Attendance ID required for check-out' });
            const record = yield Attendance_1.default.findById(attendanceId);
            if (!record)
                return res.status(404).json({ message: 'Attendance record not found' });
            record.checkOutTime = timestamp;
            record.status = 'checked_out';
            record.verified = true;
            record.verifiedBy = supervisorId;
            record.verifiedAt = timestamp;
            // Duration
            const start = new Date(record.checkInTime).getTime();
            const end = timestamp.getTime();
            record.duration = Math.round((end - start) / (1000 * 60));
            yield record.save();
            yield ScanLog_1.default.create({
                helmetId,
                workerId,
                siteId: worker.assignedSite,
                scanType: 'OUT',
                timestamp,
                status: 'valid',
                approvedBy: supervisorId,
                approvedAt: timestamp
            });
            // Notify Worker
            const notification = yield Notification_1.default.create({
                recipient: workerId,
                type: 'success',
                title: 'Check-Out Approved',
                message: `Your check-out has been approved by supervisor at ${timestamp.toLocaleTimeString()}. Duration: ${Math.floor((record.duration || 0) / 60)}h ${(record.duration || 0) % 60}m`,
                read: false
            });
            if (io) {
                io.emit('attendance_notification', {
                    workerId,
                    type: 'CHECK_OUT',
                    message: `Check-out approved. Duration: ${Math.floor((record.duration || 0) / 60)}h ${(record.duration || 0) % 60}m`,
                    notification
                });
            }
            res.json(record);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.approveAttendance = approveAttendance;
