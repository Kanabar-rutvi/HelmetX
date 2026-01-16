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
exports.notifyAlert = exports.sendPush = exports.sendSMS = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const Config_1 = __importDefault(require("../models/Config"));
// Placeholder for SMS/Push providers (e.g., Twilio, Firebase)
// Since we don't have actual keys, we'll log to console or simulate.
const sendEmail = (to, subject, text) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[NotificationService] Preparing to send email to ${to.join(', ')}`);
    try {
        let transporter;
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-email@gmail.com') {
            // Use configured SMTP
            transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
            console.log('[NotificationService] Using configured SMTP server');
        }
        else {
            // Fallback to Ethereal Email (Test Account)
            console.log('[NotificationService] SMTP not fully configured. Using Ethereal Test Account...');
            const testAccount = yield nodemailer_1.default.createTestAccount();
            transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }
        const info = yield transporter.sendMail({
            from: process.env.SMTP_FROM || '"Smart Helmet System" <system@helmet.com>',
            to: to.join(', '),
            subject,
            text,
        });
        console.log(`[NotificationService] Email sent: ${info.messageId}`);
        // If using Ethereal, log the preview URL
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`[NotificationService] Preview Email URL: ${previewUrl}`);
            console.log(`[NotificationService] ^^^ CLICK THE LINK ABOVE TO SEE THE OTP ^^^`);
        }
    }
    catch (error) {
        console.error('[NotificationService] Email Error:', error);
    }
});
exports.sendEmail = sendEmail;
const sendSMS = (to, message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[NotificationService] Sending SMS to ${to.join(', ')}: ${message}`);
});
exports.sendSMS = sendSMS;
const sendPush = (userIds, title, body) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[NotificationService] Sending Push to users ${userIds.join(', ')}: ${title} - ${body}`);
});
exports.sendPush = sendPush;
const notifyAlert = (alert, device) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const config = yield Config_1.default.findOne().sort({ createdAt: -1 });
        if (!config)
            return;
        const { notifications } = config;
        if (!notifications)
            return;
        const recipients = [...(notifications.adminEmails || [])];
        const emergencyContacts = [...(notifications.emergencyContacts || [])];
        // Construct Message
        const subject = `[${alert.severity.toUpperCase()}] Alert: ${alert.type}`;
        const message = `
      Alert Type: ${alert.type}
      Severity: ${alert.severity}
      Value: ${alert.value}
      Device: ${(device === null || device === void 0 ? void 0 : device.deviceId) || 'Unknown'}
      User: ${((_a = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _a === void 0 ? void 0 : _a.name) || 'Unassigned'}
      Location: ${device === null || device === void 0 ? void 0 : device.lat}, ${device === null || device === void 0 ? void 0 : device.lng}
      Time: ${new Date().toLocaleString()}
    `;
        // Email
        if (notifications.emailEnabled && recipients.length > 0) {
            yield (0, exports.sendEmail)(recipients, subject, message);
        }
        // SMS
        if (notifications.smsEnabled && emergencyContacts.length > 0) {
            yield (0, exports.sendSMS)(emergencyContacts, `CRITICAL: ${alert.type} detected for ${((_b = device === null || device === void 0 ? void 0 : device.assignedUser) === null || _b === void 0 ? void 0 : _b.name) || 'worker'}.`);
        }
        // Push (simulated to all admins)
        if (notifications.pushEnabled) {
            // Logic to find admin user IDs would go here
            yield (0, exports.sendPush)(['admin-ids'], subject, message);
        }
    }
    catch (error) {
        console.error('Notification Error:', error);
    }
});
exports.notifyAlert = notifyAlert;
