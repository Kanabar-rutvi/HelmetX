"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const mqttHandler_1 = require("./mqtt/mqttHandler");
const socketHandler_1 = require("./socket/socketHandler");
const escalationService_1 = require("./services/escalationService");
const path_1 = __importDefault(require("path"));
const serialHandler_1 = require("./serial/serialHandler");
// Load Config
dotenv_1.default.config();
// Connect DB
(0, db_1.default)();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: true
    }
});
// Make io accessible in routes
app.set('io', io);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.resolve('uploads')));
// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('Smart Safety Helmet API is Running');
});
// Import Routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const deviceRoutes_1 = __importDefault(require("./routes/deviceRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const siteRoutes_1 = __importDefault(require("./routes/siteRoutes"));
const shiftRoutes_1 = __importDefault(require("./routes/shiftRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
const configRoutes_1 = __importDefault(require("./routes/configRoutes"));
const backupRoutes_1 = __importDefault(require("./routes/backupRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/devices', deviceRoutes_1.default);
app.use('/api/data', dataRoutes_1.default);
app.use('/api/reports', reportRoutes_1.default);
app.use('/api/attendance', attendanceRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/sites', siteRoutes_1.default);
app.use('/api/shifts', shiftRoutes_1.default);
app.use('/api/alerts', alertRoutes_1.default);
app.use('/api/config', configRoutes_1.default);
app.use('/api/backup', backupRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
// Setup Real-time Services
(0, socketHandler_1.setupSocket)(io);
(0, mqttHandler_1.setupMQTT)(io);
(0, serialHandler_1.setupSerial)(io);
(0, escalationService_1.setupEscalationService)(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
