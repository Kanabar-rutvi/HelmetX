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
exports.createNotification = exports.markAllAsRead = exports.markAsRead = exports.getMyNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
const getMyNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const notifications = yield Notification_1.default.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMyNotifications = getMyNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { id } = req.params;
        const notification = yield Notification_1.default.findOne({ _id: id, recipient: userId });
        if (!notification)
            return res.status(404).json({ message: 'Not found' });
        notification.read = true;
        yield notification.save();
        res.json(notification);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.markAsRead = markAsRead;
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        yield Notification_1.default.updateMany({ recipient: userId, read: false }, { read: true });
        res.json({ message: 'All marked as read' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.markAllAsRead = markAllAsRead;
// Internal use or for testing
const createNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipientId, title, message, type } = req.body;
        const notification = yield Notification_1.default.create({
            recipient: recipientId,
            title,
            message,
            type: type || 'info'
        });
        res.status(201).json(notification);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createNotification = createNotification;
