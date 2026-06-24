import mongoose from 'mongoose';
import User from './models/User.js';

const MONGO_URI = 'mongodb://admin:NguyenTuanViet123@ac-qnsmpqr-shard-00-01.izmnk2n.mongodb.net:27017/taekwondo_ptit?ssl=true&authSource=admin';

async function checkNow() {
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email: 'tunav602@gmail.com' });
  console.log('OTP Code:', user?.otpCode || 'KHÔNG CÓ');
  console.log('OTP Expires:', user?.otpExpires || 'KHÔNG CÓ');
  if (user?.otpExpires) {
    const remaining = Math.round((new Date(user.otpExpires) - new Date()) / 1000);
    console.log('Thời gian còn lại:', remaining, 'giây');
  }
  await mongoose.disconnect();
}

checkNow();
