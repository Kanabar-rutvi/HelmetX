import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('MongoDB Connected');

    // Check if users exist
    const count = await User.countDocuments();
    if (count > 5) {
        console.log('Users already exist. Skipping seed.');
        process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    const users = [
        { name: 'Supervisor One', email: 'sup1@example.com', password, role: 'supervisor', phone: '1234567890' },
        { name: 'Supervisor Two', email: 'sup2@example.com', password, role: 'supervisor', phone: '0987654321' },
        { name: 'Worker Alpha', email: 'worker1@example.com', password, role: 'worker', employeeId: 'W001' },
        { name: 'Worker Beta', email: 'worker2@example.com', password, role: 'worker', employeeId: 'W002' },
        { name: 'Worker Gamma', email: 'worker3@example.com', password, role: 'worker', employeeId: 'W003' },
    ];

    for (const u of users) {
        await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
        console.log(`Seeded user: ${u.name}`);
    }

    console.log('Seeding complete');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedUsers();
