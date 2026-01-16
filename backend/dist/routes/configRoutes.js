"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const configController_1 = require("../controllers/configController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), configController_1.getConfig);
router.put('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), configController_1.updateConfig);
exports.default = router;
