"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const siteController_1 = require("../controllers/siteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), siteController_1.getSites);
router.get('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin', 'supervisor'), siteController_1.getSiteById);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), siteController_1.createSite);
router.put('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), siteController_1.updateSite);
router.delete('/:id', authMiddleware_1.protect, (0, authMiddleware_1.authorize)('admin'), siteController_1.deleteSite);
exports.default = router;
