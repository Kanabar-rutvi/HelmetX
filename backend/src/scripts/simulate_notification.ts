import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Notification from '../models/Notification';
import Site from '../models/Site';

dotenv.config();

const simulate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartsafetyhelmet');
    console.log('MongoDB Connected');

    const supervisor = await User.findOne({ email: 'supervisor@example.com' });
    if (!supervisor) {
      console.error('Supervisor not found');
      process.exit(1);
    }

    // Create a dummy site if not exists or assign to an existing one
    // For this simulation, let's just create a notification about a new site work
    const siteName = "Construction Zone B";
    
    // Check if site exists, if not create
    let site = await Site.findOne({ name: siteName });
    if (!site) {
        site = await Site.create({
            name: siteName,
            description: "New high-rise construction project",
            location: { coordinates: [77.2090, 28.6139] },
            geofenceRadius: 150
        });
        console.log(`Created new site: ${siteName}`);
    }

    // Assign supervisor to this site
    supervisor.assignedSite = site._id as any;
    await supervisor.save();
    console.log(`Assigned supervisor to ${siteName}`);

    // Create Notification
    await Notification.create({
      recipient: supervisor._id,
      type: 'site_assignment',
      title: 'New Site Assignment',
      message: `You have been assigned to oversee operations at ${siteName}. Please review the site details and active work orders.`,
      read: false
    });

    console.log('Notification created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

simulate();
