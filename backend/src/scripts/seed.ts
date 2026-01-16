import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Device from '../models/Device';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartsafetyhelmet');
    console.log('MongoDB Connected for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Device.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create Users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      employeeId: 'ADMIN001',
      phone: '1234567890'
    });

    const supervisor = await User.create({
      name: 'Site Supervisor',
      email: 'supervisor@example.com',
      password: hashedPassword,
      role: 'supervisor',
      employeeId: 'SUP001',
      phone: '0987654321'
    });

    const worker1 = await User.create({
      name: 'John Worker',
      email: 'worker1@example.com',
      password: hashedPassword,
      role: 'worker',
      employeeId: 'W001',
      phone: '1122334455'
    });

    const worker2 = await User.create({
      name: 'Jane Worker',
      email: 'worker2@example.com',
      password: hashedPassword,
      role: 'worker',
      employeeId: 'W002',
      phone: '5544332211'
    });

    console.log('Users created');

    // Create Devices
    await Device.create({
      deviceId: 'ESP32_001',
      assignedUser: worker1._id,
      status: 'online'
    });

    await Device.create({
      deviceId: 'ESP32_002',
      assignedUser: worker2._id,
      status: 'offline'
    });

    console.log('Devices created');

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
