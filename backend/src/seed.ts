import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Device from './models/Device';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart-helmet');
    console.log('MongoDB Connected');

    await User.deleteMany({});
    await Device.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const workerPassword = await bcrypt.hash('worker123', salt);
    const supervisorPassword = await bcrypt.hash('supervisor123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@helmet.com',
      password: adminPassword,
      role: 'admin',
    });

    const supervisor = await User.create({
      name: 'Site Supervisor',
      email: 'supervisor@helmet.com',
      password: supervisorPassword,
      role: 'supervisor',
    });

    const worker = await User.create({
      name: 'John Doe',
      email: 'worker@helmet.com',
      password: workerPassword,
      role: 'worker',
      assignedSupervisor: supervisor._id,
      assignedSite: 'Site A'
    });

    await Device.create({
      deviceId: 'HELMET_001',
      assignedUser: worker._id,
      status: 'offline'
    });

    console.log('Database Seeded!');
    console.log('Admin: admin@helmet.com / admin123');
    console.log('Supervisor: supervisor@helmet.com / supervisor123');
    console.log('Worker: worker@helmet.com / worker123');
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
