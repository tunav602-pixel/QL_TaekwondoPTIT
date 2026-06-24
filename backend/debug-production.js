// Script test gọi trực tiếp Render API để debug
// Kiểm tra xem DB nào Render đang dùng

const PRODUCTION_API = 'https://ql-taekwondoptit.onrender.com/api';

async function debugProduction() {
  console.log('🔍 === DEBUG PRODUCTION API ===\n');

  // 1. Test debug endpoint - xem env vars
  console.log('1️⃣ Kiểm tra env vars trên Render...');
  try {
    const res = await fetch(`${PRODUCTION_API}/debug/env`);
    const data = await res.json();
    console.log('Debug env:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('⚠️ Debug endpoint không tồn tại (bình thường):', err.message);
  }

  // 2. Test resend OTP endpoint trực tiếp với userId đã biết
  // userId của tunav602@gmail.com từ DB check trước: 6a3b5cfb635f5eff886d0d2e
  console.log('\n2️⃣ Gọi resend-otp với userId thực...');
  try {
    const res = await fetch(`${PRODUCTION_API}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: '6a3b5cfb635f5eff886d0d2e' })
    });
    const data = await res.json();
    console.log('Resend OTP response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('\n✅ Xong!');
}

debugProduction();
