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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("./models/User"));
const Device_1 = __importDefault(require("./models/Device"));
dotenv_1.default.config();
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-helmet');
        console.log('MongoDB Connected');
        yield User_1.default.deleteMany({});
        yield Device_1.default.deleteMany({});
        const salt = yield bcryptjs_1.default.genSalt(10);
        const adminPassword = yield bcryptjs_1.default.hash('admin123', salt);
        const workerPassword = yield bcryptjs_1.default.hash('worker123', salt);
        const supervisorPassword = yield bcryptjs_1.default.hash('supervisor123', salt);
        const admin = yield User_1.default.create({
            name: 'System Admin',
            email: 'admin@helmet.com',
            password: adminPassword,
            role: 'admin',
        });
        const supervisor = yield User_1.default.create({
            name: 'Site Supervisor',
            email: 'supervisor@helmet.com',
            password: supervisorPassword,
            role: 'supervisor',
        });
        const worker = yield User_1.default.create({
            name: 'John Doe',
            email: 'worker@helmet.com',
            password: workerPassword,
            role: 'worker',
            assignedSupervisor: supervisor._id,
            assignedSite: 'Site A'
        });
        yield Device_1.default.create({
            deviceId: 'HELMET_001',
            assignedUser: worker._id,
            status: 'offline'
        });
        console.log('Database Seeded!');
        console.log('Admin: admin@helmet.com / admin123');
        console.log('Supervisor: supervisor@helmet.com / supervisor123');
        console.log('Worker: worker@helmet.com / worker123');
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
seed();
