import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const SUPER_ADMIN_EMAIL = 'tunav602@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Tuanvietnguyen123';
const SUPER_ADMIN_NAME = 'Tuấn Việt Nguyễn';

const seedSuperAdmin = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists in the system.');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Name:', existingSuperAdmin.name);
      console.log('🔐 Role:', existingSuperAdmin.role);
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);

    // Create Super Admin
    console.log('👤 Creating Super Admin account...');
    const superAdmin = await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'Super-Admin',
      subRole: '',
      avatarUrl: '',
      phone: '',
      dob: '',
      gender: 'Nam',
      studentId: ''
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdmin.email);
    console.log('🔑 Password:', SUPER_ADMIN_PASSWORD);
    console.log('👤 Name:', superAdmin.name);
    console.log('🔐 Role:', superAdmin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Please keep these credentials secure!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
