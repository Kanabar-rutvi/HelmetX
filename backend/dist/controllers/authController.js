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
exports.getMe = exports.verifyOtp = exports.requestOtp = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const notificationService_1 = require("../services/notificationService");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, role, phone, assignedSite } = req.body;
    const userExists = yield User_1.default.findOne({ email });
    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
    const user = yield User_1.default.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'worker',
        phone,
        assignedSite
    });
    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    }
    else {
        res.status(400).json({ message: 'Invalid user data' });
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, employeeId, password } = req.body;
    const user = yield User_1.default.findOne(email ? { email } : { employeeId });
    if (user && (yield bcryptjs_1.default.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    }
    else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});
exports.loginUser = loginUser;
const requestOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, employeeId } = req.body;
    const user = yield User_1.default.findOne(email ? { email } : { employeeId });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    user.otpCode = code;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    yield user.save();
    // Send OTP via Email
    try {
        yield (0, notificationService_1.sendEmail)([user.email], 'Your Login OTP', `Your OTP for login is: ${code}. It expires in 5 minutes.`);
        console.log(`[AUTH] OTP for ${user.email}: ${code}`);
    }
    catch (error) {
        console.error('Error sending OTP email:', error);
    }
    res.json({ message: 'OTP sent' });
});
exports.requestOtp = requestOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, employeeId, otp } = req.body;
    const user = yield User_1.default.findOne(email ? { email } : { employeeId });
    if (!user || !user.otpCode || !user.otpExpires) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otpCode !== otp || user.otpExpires.getTime() < Date.now()) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }
    user.otpCode = undefined;
    user.otpExpires = undefined;
    yield user.save();
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' }),
    });
});
exports.verifyOtp = verifyOtp;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(req.user._id).populate('assignedSite', 'name description location geofenceRadius isActive');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            assignedSite: user.assignedSite || null,
        });
    }
    else {
        res.status(404).json({ message: 'User not found' });
    }
});
exports.getMe = getMe;
