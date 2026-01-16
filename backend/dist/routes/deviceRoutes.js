"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deviceController_1 = require("../controllers/deviceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.protect, deviceController_1.getDevices);
router.get('/locations', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('supervisor', 'admin'), deviceController_1.getWorkerLocations);
router.get('/locations/counts', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('supervisor', 'admin'), deviceController_1.getWorkerCountsBySite);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), deviceController_1.createDevice);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), deviceController_1.updateDevice);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), deviceController_1.deleteDevice);
exports.default = router;
