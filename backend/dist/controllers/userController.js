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
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const auditService_1 = require("../services/auditService");
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { siteId, role, employeeId } = req.query;
        let query = {};
        if (siteId)
            query.assignedSite = siteId;
        if (role)
            query.role = role;
        if (employeeId)
            query.employeeId = employeeId;
        const users = yield User_1.default.find(query)
            .select('-password')
            .populate('assignedSite', 'name')
            .populate('assignedSupervisor', 'name');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getUsers = getUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, employeeId, phone } = req.body;
        const userExists = yield User_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }
        if (employeeId) {
            const idExists = yield User_1.default.findOne({ employeeId });
            if (idExists) {
                res.status(400).json({ message: 'Employee ID already exists' });
                return;
            }
        }
        const user = yield User_1.default.create({
            name,
            email,
            password,
            role,
            employeeId,
            phone
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.params.id);
        if (user) {
            // Check for duplicate email if being changed
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = yield User_1.default.findOne({ email: req.body.email });
                if (emailExists) {
                    res.status(400).json({ message: 'Email already in use' });
                    return;
                }
            }
            // Check for duplicate employeeId if being changed
            if (req.body.employeeId && req.body.employeeId !== user.employeeId) {
                const idExists = yield User_1.default.findOne({ employeeId: req.body.employeeId });
                if (idExists) {
                    res.status(400).json({ message: 'Employee ID already in use' });
                    return;
                }
            }
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.employeeId = req.body.employeeId || user.employeeId;
            user.phone = req.body.phone || user.phone;
            user.assignedSite = req.body.assignedSite || user.assignedSite;
            if (req.body.password) {
                user.password = req.body.password;
            }
            const updatedUser = yield user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                assignedSite: updatedUser.assignedSite
            });
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield User_1.default.findById(req.params.id);
        if (user) {
            yield user.deleteOne();
            const actorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (actorId) {
                yield (0, auditService_1.logAction)(actorId, 'DELETE_USER', 'User', user._id.toString(), `Deleted user ${user.name}`);
            }
            res.json({ message: 'User removed' });
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.deleteUser = deleteUser;
