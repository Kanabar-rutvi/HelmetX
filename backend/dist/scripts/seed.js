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
const User_1 = __importDefault(require("../models/User"));
const Device_1 = __importDefault(require("../models/Device"));
dotenv_1.default.config();
const seedData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartsafetyhelmet');
        console.log('MongoDB Connected for seeding');
        // Clear existing data
        yield User_1.default.deleteMany({});
        yield Device_1.default.deleteMany({});
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash('password123', salt);
        // Create Users
        const admin = yield User_1.default.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            employeeId: 'ADMIN001',
            phone: '1234567890'
        });
        const supervisor = yield User_1.default.create({
            name: 'Site Supervisor',
            email: 'supervisor@example.com',
            password: hashedPassword,
            role: 'supervisor',
            employeeId: 'SUP001',
            phone: '0987654321'
        });
        const worker1 = yield User_1.default.create({
            name: 'John Worker',
            email: 'worker1@example.com',
            password: hashedPassword,
            role: 'worker',
            employeeId: 'W001',
            phone: '1122334455'
        });
        const worker2 = yield User_1.default.create({
            name: 'Jane Worker',
            email: 'worker2@example.com',
            password: hashedPassword,
            role: 'worker',
            employeeId: 'W002',
            phone: '5544332211'
        });
        console.log('Users created');
        // Create Devices
        yield Device_1.default.create({
            deviceId: 'ESP32_001',
            assignedUser: worker1._id,
            status: 'online'
        });
        yield Device_1.default.create({
            deviceId: 'ESP32_002',
            assignedUser: worker2._id,
            status: 'offline'
        });
        console.log('Devices created');
        console.log('Seeding completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
});
seedData();
