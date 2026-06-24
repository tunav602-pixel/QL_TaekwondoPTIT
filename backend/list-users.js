import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = 'mongodb://admin:NguyenTuanViet123@ac-qnsmpqr-shard-00-01.izmnk2n.mongodb.net:27017/taekwondo_ptit?ssl=true&authSource=admin';

async function listUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');

    const users = await User.find({}, 'name email role otpCode otpExpires updatedAt');
    console.log(`👥 Total users found: ${users.length}`);
    for (const u of users) {
      console.log(`- ${u.name} (${u.email}) [${u.role}] | OTP: ${u.otpCode || 'None'} | Updated: ${u.updatedAt}`);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
