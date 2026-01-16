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
exports.updateConfig = exports.getConfig = void 0;
const Config_1 = __importDefault(require("../models/Config"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const getConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let config = yield Config_1.default.findOne();
        if (!config) {
            config = yield Config_1.default.create({});
        }
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getConfig = getConfig;
const updateConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { thresholds, notifications, system } = req.body;
        let config = yield Config_1.default.findOne();
        if (!config) {
            config = new Config_1.default({});
        }
        config.thresholds = Object.assign(Object.assign({}, config.thresholds), thresholds);
        config.notifications = Object.assign(Object.assign({}, config.notifications), notifications);
        config.system = Object.assign(Object.assign({}, config.system), system);
        config.updatedBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const updatedConfig = yield config.save();
        yield AuditLog_1.default.create({
            actor: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
            action: 'update_system_config',
            targetType: 'Config',
            targetId: updatedConfig._id.toString(),
            details: 'System configuration updated'
        });
        res.json(updatedConfig);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.updateConfig = updateConfig;
