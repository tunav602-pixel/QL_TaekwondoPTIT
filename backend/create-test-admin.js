import bcrypt from 'bcryptjs';
import fs from 'fs';

const raw = fs.readFileSync('./data/users.json','utf8');
const data = JSON.parse(raw);
const arr = Object.values(data);

// Tạo tài khoản test admin mới với mật khẩu biết trước
const testPassword = 'Test@123456';
const hashedPw = await bcrypt.hash(testPassword, 12);

const testAdmin = {
  _id: 'test-admin-puppeteer-001',
  name: 'Test Admin Puppeteer',
  email: 'testadmin@ptit.test',
  password: hashedPw,
  role: 'Super-Admin',
  studentId: 'TEST001',
  class: 'TEST',
  phone: '0000000000',
  createdAt: new Date().toISOString()
};

// Thêm vào mảng nếu chưa tồn tại
const exists = arr.find(u => u.email === 'testadmin@ptit.test');
if (!exists) {
  // Ghi lại vào file - tìm index tiếp theo
  const keys = Object.keys(data);
  const nextIdx = keys.length;
  data[nextIdx] = testAdmin;
  fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Đã tạo tài khoản test admin:', testAdmin.email);
  console.log('🔑 Mật khẩu:', testPassword);
} else {
  console.log('ℹ️ Tài khoản test đã tồn tại:', exists.email);
  // Reset mật khẩu
  exists.password = hashedPw;
  fs.writeFileSync('./data/users.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('🔄 Đã reset mật khẩu:', testPassword);
}
