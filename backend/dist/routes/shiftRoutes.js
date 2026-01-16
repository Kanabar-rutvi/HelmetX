"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shiftController_1 = require("../controllers/shiftController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), shiftController_1.getShifts);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), shiftController_1.createShift);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), shiftController_1.updateShift);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), shiftController_1.deleteShift);
exports.default = router;
