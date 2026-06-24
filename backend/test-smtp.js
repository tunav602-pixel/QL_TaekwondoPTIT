import nodemailer from 'nodemailer';

const SMTP_EMAIL = 'taekwondoptitweb@gmail.com';
const SMTP_PASSWORD = 'znercsdfqxkuoxan';

// Test port 465 SSL
console.log('🔍 Testing SMTP port 465 (SSL)...');
try {
  const t465 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
    connectionTimeout: 8000,
  });
  await t465.verify();
  console.log('✅ Port 465 OK!');
  await t465.sendMail({
    from: `"Taekwondo PTIT" <${SMTP_EMAIL}>`,
    to: 'tunav602@gmail.com',
    subject: '🔐 Test OTP - Port 465',
    text: 'SMTP port 465 hoạt động! OTP test: 654321'
  });
  console.log('✅ Email gửi qua port 465 thành công!');
} catch (err) {
  console.error('❌ Port 465 failed:', err.message);
}
