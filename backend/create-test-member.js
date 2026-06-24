import bcrypt from 'bcryptjs';
import fs from 'fs';

const raw = fs.readFileSync('./data/users.json','utf8');
const data = JSON.parse(raw);
const arr = Object.values(data);

// Tạo tài khoản thành viên thường (không cần OTP)
const testPassword = 'Member@123';
const hashedPw = await bcrypt.hash(testPassword, 10);

const testMember = {
  _id: 'test-member-puppeteer-001',
  name: 'Test Member UI',
  email: 'testmember@ptit.test',
  password: hashedPw,
  role: 'Member',
  studentId: 'TESTM001',
  class: 'TEST',
  phone: '0000000001',
  createdAt: new Date().toISOString()
};

const exists = arr.find(u => u.email === 'testmember@ptit.test');
if (!exists) {
  const keys = Object.keys(data);
  data[keys.length] = testMember;
  fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Đã tạo Member test:', testMember.email);
  console.log('🔑 Mật khẩu:', testPassword);
} else {
  exists.password = hashedPw;
  fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('🔄 Reset mật khẩu member test:', testPassword);
}
