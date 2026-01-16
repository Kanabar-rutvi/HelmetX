import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import { setupMQTT } from './mqtt/mqttHandler';
import { setupSocket } from './socket/socketHandler';
import { setupEscalationService } from './services/escalationService';
import { setupReportingService } from './services/reportingService';
import path from 'path';
import { setupSerial } from './serial/serialHandler';

// Load Config
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes (Placeholders for now)
app.get('/', (req, res) => {
  res.send('Smart Safety Helmet API is Running');
});

// Import Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import deviceRoutes from './routes/deviceRoutes';
import dataRoutes from './routes/dataRoutes';
import reportRoutes from './routes/reportRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import auditRoutes from './routes/auditRoutes';
import siteRoutes from './routes/siteRoutes';
import shiftRoutes from './routes/shiftRoutes';
import alertRoutes from './routes/alertRoutes';
import configRoutes from './routes/configRoutes';
import backupRoutes from './routes/backupRoutes';
import notificationRoutes from './routes/notificationRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/config', configRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationRoutes);


// Setup Real-time Services
setupSocket(io);
setupMQTT(io);
setupSerial(io);
setupEscalationService(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
