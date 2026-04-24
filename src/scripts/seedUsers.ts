import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in your .env file');
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);
    
    // Clear existing users to avoid Duplicate Key Errors
    await User.deleteMany({});
    console.log('Cleared existing users collection. Re-seeding...');

    const salt = await bcrypt.genSalt(10);
    
    // Generate passwords
    const userPass = await bcrypt.hash('user123', salt);
    const adminPass = await bcrypt.hash('admin123', salt);
    const driverPass = await bcrypt.hash('driver123', salt);

    const users = [
      {
        name: 'Jane Doe',
        email: 'user@waypoint.com',
        password: userPass,
        role: 'passenger',
        customId: 'P001'
      },
      {
        name: 'Admin Boss',
        email: 'admin@waypoint.com',
        password: adminPass,
        role: 'admin',
        customId: 'A001'
      },
      {
        name: 'Rob Driver',
        email: 'driver@waypoint.com',
        password: driverPass,
        role: 'driver',
        customId: 'D001'
      }
    ];

    await User.insertMany(users);
    console.log('✅ Successfully seeded User Database:');
    users.forEach(u => console.log(`- ${u.role}: ${u.email} (ID: ${u.customId})`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
