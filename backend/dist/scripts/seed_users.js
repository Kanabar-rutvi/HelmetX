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
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || '');
        console.log('MongoDB Connected');
        // Check if users exist
        const count = yield User_1.default.countDocuments();
        if (count > 5) {
            console.log('Users already exist. Skipping seed.');
            process.exit();
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const password = yield bcryptjs_1.default.hash('password123', salt);
        const users = [
            { name: 'Supervisor One', email: 'sup1@example.com', password, role: 'supervisor', phone: '1234567890' },
            { name: 'Supervisor Two', email: 'sup2@example.com', password, role: 'supervisor', phone: '0987654321' },
            { name: 'Worker Alpha', email: 'worker1@example.com', password, role: 'worker', employeeId: 'W001' },
            { name: 'Worker Beta', email: 'worker2@example.com', password, role: 'worker', employeeId: 'W002' },
            { name: 'Worker Gamma', email: 'worker3@example.com', password, role: 'worker', employeeId: 'W003' },
        ];
        for (const u of users) {
            yield User_1.default.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
            console.log(`Seeded user: ${u.name}`);
        }
        console.log('Seeding complete');
        process.exit();
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
});
seedUsers();
