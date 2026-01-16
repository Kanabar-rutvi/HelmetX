"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const backupController_1 = require("../controllers/backupController");
const router = express_1.default.Router();
router.get('/download', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), backupController_1.createBackup);
exports.default = router;
