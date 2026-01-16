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
const Notification_1 = __importDefault(require("../models/Notification"));
const Site_1 = __importDefault(require("../models/Site"));
dotenv_1.default.config();
const simulate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartsafetyhelmet');
        console.log('MongoDB Connected');
        const supervisor = yield User_1.default.findOne({ email: 'supervisor@example.com' });
        if (!supervisor) {
            console.error('Supervisor not found');
            process.exit(1);
        }
        // Create a dummy site if not exists or assign to an existing one
        // For this simulation, let's just create a notification about a new site work
        const siteName = "Construction Zone B";
        // Check if site exists, if not create
        let site = yield Site_1.default.findOne({ name: siteName });
        if (!site) {
            site = yield Site_1.default.create({
                name: siteName,
                description: "New high-rise construction project",
                location: { coordinates: [77.2090, 28.6139] },
                geofenceRadius: 150
            });
            console.log(`Created new site: ${siteName}`);
        }
        // Assign supervisor to this site
        supervisor.assignedSite = site._id;
        yield supervisor.save();
        console.log(`Assigned supervisor to ${siteName}`);
        // Create Notification
        yield Notification_1.default.create({
            recipient: supervisor._id,
            type: 'site_assignment',
            title: 'New Site Assignment',
            message: `You have been assigned to oversee operations at ${siteName}. Please review the site details and active work orders.`,
            read: false
        });
        console.log('Notification created successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
});
simulate();
