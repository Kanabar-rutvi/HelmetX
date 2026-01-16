"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getSiteSafetyReports = exports.getMaterialsPending = exports.getReportsPending = exports.updateMaterialStatus = exports.approveReport = exports.getMaterialsList = exports.getMaterialsStats = exports.getAllReports = exports.createMaterials = exports.addMaterials = exports.getMyReports = exports.getMyTodayReport = exports.createMyReport = void 0;
const DailyReport_1 = __importDefault(require("../models/DailyReport"));
const SiteSafetyReport_1 = __importDefault(require("../models/SiteSafetyReport"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const formatDate = (d) => d.toISOString().split('T')[0];
const createMyReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { task, imageData, materials } = req.body;
        const date = formatDate(new Date());
        let imageUrl;
        if (imageData && typeof imageData === 'string' && imageData.includes('base64')) {
            const match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
            if (match) {
                const mime = match[1];
                const b64 = match[2];
                const ext = mime.split('/')[1];
                const uploadsDir = path_1.default.resolve('uploads', 'reports');
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
                const filename = `${userId}_${date}.${ext}`;
                const filepath = path_1.default.join(uploadsDir, filename);
                fs_1.default.writeFileSync(filepath, Buffer.from(b64, 'base64'));
                imageUrl = `/uploads/reports/${filename}`;
            }
        }
        const report = yield DailyReport_1.default.findOneAndUpdate({ user: userId, date }, { task, imageUrl, materials: materials || [] }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.status(201).json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createMyReport = createMyReport;
const getMyTodayReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const date = formatDate(new Date());
        const report = yield DailyReport_1.default.findOne({ user: userId, date });
        res.json(report || null);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyTodayReport = getMyTodayReport;
const getMyReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const reports = yield DailyReport_1.default.find({ user: userId }).sort({ date: -1 }).limit(30);
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyReports = getMyReports;
const addMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const { items } = req.body;
        const report = yield DailyReport_1.default.findOne({ _id: id, user: userId });
        if (!report)
            return res.status(404).json({ message: 'Report not found' });
        report.materials = [...report.materials, ...(items || [])];
        yield report.save();
        res.json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.addMaterials = addMaterials;
const createMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { items } = req.body;
        const date = formatDate(new Date());
        const report = yield DailyReport_1.default.findOneAndUpdate({ user: userId, date }, { $push: { materials: { $each: items || [] } } }, { upsert: true, new: true, setDefaultsOnInsert: true });
        res.status(201).json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createMaterials = createMaterials;
// Admin: Get all reports with filters
const getAllReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate, userId, siteId, approvalStatus } = req.query;
        let query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        if (userId) {
            query.user = userId;
        }
        if (siteId) {
            const User = (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            const users = yield User.find({ assignedSite: siteId }).select('_id');
            query.user = { $in: users.map(u => u._id) };
        }
        if (approvalStatus) {
            query.approvalStatus = approvalStatus;
        }
        const reports = yield DailyReport_1.default.find(query)
            .populate('user', 'name email employeeId assignedSite')
            .sort({ date: -1 });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.getAllReports = getAllReports;
// Restored Functions
const getMaterialsStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authReq = req;
        const role = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = authReq.user) === null || _b === void 0 ? void 0 : _b._id;
        const { siteId } = req.query;
        let userFilter = {};
        if (role === 'worker') {
            userFilter.user = userId;
        }
        else if (role === 'supervisor') {
            userFilter.user = ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.assignedSite)
                ? { $in: (yield (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default.find({ assignedSite: authReq.user.assignedSite }).select('_id')).map(u => u._id) }
                : undefined;
        }
        else if (role === 'admin') {
            if (siteId) {
                userFilter.user = { $in: (yield (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default.find({ assignedSite: siteId }).select('_id')).map(u => u._id) };
            }
        }
        const reports = yield DailyReport_1.default.find(userFilter).select('materials');
        const materials = reports.flatMap((r) => (r.materials || []).map((m) => (Object.assign(Object.assign({}, m), { status: m.status || 'requested' }))));
        const total = materials.length;
        const pending = materials.filter((m) => m.status === 'requested').length;
        const approved = materials.filter((m) => m.status === 'approved').length;
        res.json({ total, pending, approved });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMaterialsStats = getMaterialsStats;
const getMaterialsList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const authReq = req;
        const role = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a.role;
        const userId = (_b = authReq.user) === null || _b === void 0 ? void 0 : _b._id;
        const { siteId } = req.query;
        let userFilter = {};
        if (role === 'worker') {
            userFilter.user = userId;
        }
        else if (role === 'supervisor') {
            userFilter.user = ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.assignedSite)
                ? { $in: (yield (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default.find({ assignedSite: authReq.user.assignedSite }).select('_id')).map(u => u._id) }
                : undefined;
        }
        else if (role === 'admin') {
            if (siteId) {
                userFilter.user = { $in: (yield (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default.find({ assignedSite: siteId }).select('_id')).map(u => u._id) };
            }
        }
        const reports = yield DailyReport_1.default.find(userFilter)
            .select('materials date user')
            .populate('user', 'name');
        const items = reports.flatMap((r) => (r.materials || []).map((m) => ({
            _id: m._id,
            name: m.name,
            quantity: m.quantity,
            note: m.note,
            status: m.status || 'requested',
            date: r.date,
            user: r.user,
            reportId: r._id
        }))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMaterialsList = getMaterialsList;
const approveReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        yield DailyReport_1.default.findByIdAndUpdate(id, { approvalStatus: status, approvedAt: new Date() });
        res.json({ message: 'Report updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.approveReport = approveReport;
const updateMaterialStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reportId, materialId } = req.params;
        const { status } = req.body;
        if (!['requested', 'approved', 'rejected', 'delivered'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const updated = yield DailyReport_1.default.findOneAndUpdate({ _id: reportId, 'materials._id': materialId }, { $set: { 'materials.$[m].status': status } }, { new: true, arrayFilters: [{ 'm._id': materialId }] });
        if (!updated)
            return res.status(404).json({ message: 'Material item not found' });
        try {
            const io = req.app.get('io');
            io === null || io === void 0 ? void 0 : io.emit('materials_updated', { reportId, materialId, status });
        }
        catch ( /* noop */_a) { /* noop */ }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateMaterialStatus = updateMaterialStatus;
const getReportsPending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield DailyReport_1.default.find({ approvalStatus: 'pending' }).populate('user', 'name');
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getReportsPending = getReportsPending;
const getMaterialsPending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { siteId } = req.query;
        let userFilter = {};
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'supervisor') {
            const User = (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            const users = yield User.find({ assignedSite: req.user.assignedSite }).select('_id name');
            userFilter.user = { $in: users.map(u => u._id) };
        }
        else if (siteId) {
            const User = (yield Promise.resolve().then(() => __importStar(require('../models/User')))).default;
            const users = yield User.find({ assignedSite: siteId }).select('_id name');
            userFilter.user = { $in: users.map(u => u._id) };
        }
        const reports = yield DailyReport_1.default.find(userFilter)
            .select('materials date user')
            .populate('user', 'name');
        const pendingItems = reports.flatMap((r) => (r.materials || [])
            .filter((m) => m.status === 'requested')
            .map((m) => ({
            _id: m._id,
            name: m.name,
            quantity: m.quantity,
            note: m.note,
            status: m.status,
            date: r.date,
            user: r.user,
            reportId: r._id
        })));
        res.json(pendingItems);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMaterialsPending = getMaterialsPending;
const getSiteSafetyReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { siteId, date } = req.query;
        let query = {};
        if (siteId)
            query.site = siteId;
        if (date)
            query.date = date;
        // Access Control: If supervisor, only show assigned site
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'supervisor') {
            query.site = req.user.assignedSite;
        }
        const reports = yield SiteSafetyReport_1.default.find(query).sort({ date: -1 }).limit(30);
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getSiteSafetyReports = getSiteSafetyReports;
