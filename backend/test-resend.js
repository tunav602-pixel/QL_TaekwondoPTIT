import { Resend } from 'resend';

const RESEND_API_KEY = 're_GLbVquBv_Fw8f2EBSrGY9d5xbkVi82mGG';
const resend = new Resend(RESEND_API_KEY);

console.log('🔑 Testing Resend API key...');

async function testResend() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Taekwondo PTIT <onboarding@resend.dev>',
      to: ['tunav602@gmail.com'],
      subject: '🔐 TEST - Mã OTP Đăng Nhập - Taekwondo PTIT',
      html: '<h1>TEST EMAIL</h1><p>OTP của bạn là: <strong>123456</strong></p>'
    });

    if (error) {
      console.error('❌ Resend error:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📧 Email ID:', data.id);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error(err);
  }
}

testResend();
