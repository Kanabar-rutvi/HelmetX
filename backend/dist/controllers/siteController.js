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
exports.deleteSite = exports.updateSite = exports.createSite = exports.getSiteById = exports.getSites = void 0;
const Site_1 = __importDefault(require("../models/Site"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const auditService_1 = require("../services/auditService");
const getSites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield Site_1.default.find()
            .populate('supervisors', 'name email')
            .populate('workers', 'name email');
        res.json(sites);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching sites' });
    }
});
exports.getSites = getSites;
const getSiteById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const site = yield Site_1.default.findById(req.params.id)
            .populate('supervisors', 'name email')
            .populate('workers', 'name email');
        if (!site)
            return res.status(404).json({ message: 'Site not found' });
        res.json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching site' });
    }
});
exports.getSiteById = getSiteById;
const createSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, location, geofenceRadius, shiftTimings, safetyThresholds, supervisors, // Array of User IDs
        workers // Array of User IDs
         } = req.body;
        // 1. Save Site
        const site = new Site_1.default({
            name,
            description,
            location,
            geofenceRadius,
            shiftTimings,
            safetyThresholds,
            supervisors,
            workers,
            isActive: true
        });
        yield site.save();
        const io = req.app.get('io');
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // 2. Assign Supervisors
        if (supervisors && supervisors.length > 0) {
            yield User_1.default.updateMany({ _id: { $in: supervisors } }, { $set: { assignedSite: site._id } });
            // Notifications for Supervisors
            const supervisorNotifs = supervisors.map((id) => ({
                recipient: id,
                type: 'site_assignment',
                title: 'New Site Assignment',
                message: `You have been assigned to new site: ${name}. Monitoring is now active.`,
                read: false,
                link: `/supervisor/sites/${site._id}`
            }));
            yield Notification_1.default.insertMany(supervisorNotifs);
            // Real-time Update
            supervisors.forEach((id) => {
                io.to(id.toString()).emit('notification', {
                    title: 'New Site Assignment',
                    message: `You have been assigned to ${name}`
                });
                io.to(id.toString()).emit('site_assigned', site);
            });
        }
        // 3. Assign Workers
        if (workers && workers.length > 0) {
            yield User_1.default.updateMany({ _id: { $in: workers } }, { $set: { assignedSite: site._id } });
            // Notifications for Workers
            const workerNotifs = workers.map((id) => ({
                recipient: id,
                type: 'site_assignment',
                title: 'Site Assignment Update',
                message: `You have been assigned to ${name}. Shift details are available.`,
                read: false
            }));
            yield Notification_1.default.insertMany(workerNotifs);
            // Real-time Update
            workers.forEach((id) => {
                io.to(id.toString()).emit('notification', {
                    title: 'Site Assignment Update',
                    message: `You have been assigned to ${name}`
                });
                io.to(id.toString()).emit('site_assigned', site);
            });
        }
        // 4. Audit Log
        if (adminId) {
            const log = new AuditLog_1.default({
                actor: adminId,
                action: 'CREATE_SITE',
                targetType: 'Site',
                targetId: site._id.toString(),
                details: `Created site ${name} with ${(supervisors === null || supervisors === void 0 ? void 0 : supervisors.length) || 0} supervisors and ${(workers === null || workers === void 0 ? void 0 : workers.length) || 0} workers`,
                metadata: { siteName: name }
            });
            yield log.save();
        }
        // 5. Admin Confirmation (Socket)
        if (adminId) {
            io.to(adminId.toString()).emit('site_created_success', {
                message: `Site ${name} created and activated successfully.`
            });
        }
        res.status(201).json(site);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating site', error });
    }
});
exports.createSite = createSite;
const updateSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const siteId = req.params.id;
        const { supervisors, workers } = req.body;
        // 1. Find existing site to compare
        const oldSite = yield Site_1.default.findById(siteId);
        if (!oldSite) {
            return res.status(404).json({ message: 'Site not found' });
        }
        // 2. Update Site
        const site = yield Site_1.default.findByIdAndUpdate(siteId, req.body, { new: true });
        // 3. Handle Supervisors Changes
        if (supervisors) {
            const oldSups = ((_a = oldSite.supervisors) === null || _a === void 0 ? void 0 : _a.map(s => s.toString())) || [];
            const newSups = supervisors.map((s) => s.toString());
            const removedSups = oldSups.filter((id) => !newSups.includes(id));
            const addedSups = newSups.filter((id) => !oldSups.includes(id));
            if (removedSups.length > 0) {
                yield User_1.default.updateMany({ _id: { $in: removedSups } }, { $unset: { assignedSite: 1 } });
            }
            if (addedSups.length > 0) {
                yield User_1.default.updateMany({ _id: { $in: addedSups } }, { $set: { assignedSite: siteId } });
            }
        }
        // 4. Handle Workers Changes
        if (workers) {
            const oldWorkers = ((_b = oldSite.workers) === null || _b === void 0 ? void 0 : _b.map(w => w.toString())) || [];
            const newWorkers = workers.map((w) => w.toString());
            const removedWorkers = oldWorkers.filter((id) => !newWorkers.includes(id));
            const addedWorkers = newWorkers.filter((id) => !oldWorkers.includes(id));
            if (removedWorkers.length > 0) {
                yield User_1.default.updateMany({ _id: { $in: removedWorkers } }, { $unset: { assignedSite: 1 } });
            }
            if (addedWorkers.length > 0) {
                yield User_1.default.updateMany({ _id: { $in: addedWorkers } }, { $set: { assignedSite: siteId } });
            }
        }
        // Audit (outside transaction)
        if ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id) {
            yield (0, auditService_1.logAction)(req.user._id, 'UPDATE_SITE', 'Site', site === null || site === void 0 ? void 0 : site._id.toString(), `Updated site ${site === null || site === void 0 ? void 0 : site.name}`);
        }
        res.json(site);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating site' });
    }
});
exports.updateSite = updateSite;
const deleteSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const site = yield Site_1.default.findById(req.params.id);
        if (!site)
            return res.status(404).json({ message: 'Site not found' });
        yield Site_1.default.findByIdAndDelete(req.params.id);
        // Audit
        if ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) {
            yield (0, auditService_1.logAction)(req.user._id, 'DELETE_SITE', 'Site', req.params.id, `Deleted site ${site.name}`);
        }
        res.json({ message: 'Site deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting site' });
    }
});
exports.deleteSite = deleteSite;
