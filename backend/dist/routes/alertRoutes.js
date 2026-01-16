"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const alertController_1 = require("../controllers/alertController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), alertController_1.getAlerts);
router.get('/stats', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), alertController_1.getAlertStats);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), alertController_1.updateAlertStatus);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), alertController_1.createAlert);
exports.default = router;
