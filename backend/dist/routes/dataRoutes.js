"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataController_1 = require("../controllers/dataController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authMiddleware_2 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/sensors/:deviceId', authMiddleware_1.protect, dataController_1.getSensorData);
router.get('/alerts', authMiddleware_1.protect, dataController_1.getAlerts);
router.post('/alerts', authMiddleware_1.protect, dataController_1.createAlert);
router.put('/alerts/:id', authMiddleware_1.protect, (0, authMiddleware_2.authorize)('admin', 'supervisor'), dataController_1.updateAlertStatus);
router.post('/alerts/:id/escalate', authMiddleware_1.protect, (0, authMiddleware_2.authorize)('admin', 'supervisor'), dataController_1.escalateAlert);
router.get('/safety/summary', authMiddleware_1.protect, (0, authMiddleware_2.authorize)('admin', 'supervisor'), dataController_1.getSafetySummary);
router.post('/ingest', dataController_1.ingestSensorData);
exports.default = router;
