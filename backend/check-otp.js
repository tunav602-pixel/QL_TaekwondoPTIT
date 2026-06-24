import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = 'mongodb://admin:NguyenTuanViet123@ac-qnsmpqr-shard-00-01.izmnk2n.mongodb.net:27017/taekwondo_ptit?ssl=true&authSource=admin';

async function checkUserOTP() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB Atlas');

    const user = await User.findOne({ email: 'tunav602@gmail.com' });
    if (!user) {
      console.log('❌ User not found in DB!');
      return;
    }

    console.log('👤 User details:');
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('OTP Code:', user.otpCode);
    console.log('OTP Expires:', user.otpExpires);
    
    // Check if OTP was updated in the last 10 minutes
    if (user.otpExpires) {
      const diffMs = new Date(user.otpExpires) - new Date();
      console.log(`⏱️ Time remaining for OTP: ${Math.round(diffMs / 1000)} seconds`);
    } else {
      console.log('⏱️ No active OTP expiration set.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserOTP();
