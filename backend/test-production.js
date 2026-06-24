import mongoose from 'mongoose';
import User from './models/User.js';

// Test trực tiếp gọi API production trên Render
const PRODUCTION_API = 'https://ql-taekwondoptit.onrender.com/api';
const MONGO_URI = 'mongodb://admin:NguyenTuanViet123@ac-qnsmpqr-shard-00-01.izmnk2n.mongodb.net:27017/taekwondo_ptit?ssl=true&authSource=admin';

async function testProductionLogin() {
  console.log('🔍 === KIỂM TRA API PRODUCTION ===\n');

  // 1. Test health check
  console.log('1️⃣ Kiểm tra server health...');
  try {
    const healthRes = await fetch(`${PRODUCTION_API}/health`);
    const health = await healthRes.json();
    console.log('✅ Server:', health.message, '| Version:', health.version);
  } catch (err) {
    console.error('❌ Server không phản hồi:', err.message);
    return;
  }

  // 2. Gọi login API
  console.log('\n2️⃣ Gửi yêu cầu đăng nhập Admin...');
  let loginData;
  try {
    const loginRes = await fetch(`${PRODUCTION_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tunav602@gmail.com', password: 'Tuanvietnguyen123' })
    });
    loginData = await loginRes.json();
    console.log('📦 Login Response:', JSON.stringify(loginData, null, 2));
  } catch (err) {
    console.error('❌ Login request failed:', err.message);
    return;
  }

  // 3. Kiểm tra DB xem OTP có được lưu không
  console.log('\n3️⃣ Kiểm tra DB sau khi login...');
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email: 'tunav602@gmail.com' });
    console.log('OTP Code trong DB:', user?.otpCode || 'KHÔNG CÓ');
    console.log('OTP Expires:', user?.otpExpires || 'KHÔNG CÓ');
    if (user?.otpExpires) {
      const remaining = Math.round((new Date(user.otpExpires) - new Date()) / 1000);
      console.log('Thời gian còn lại:', remaining, 'giây');
    }
  } catch (err) {
    console.error('❌ DB check error:', err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n✅ Kiểm tra xong!');
}

testProductionLogin();
