import bcrypt from 'bcryptjs';
import fs from 'fs';

const raw = fs.readFileSync('./data/users.json','utf8');
const data = JSON.parse(raw);
const arr = Object.values(data);
const admin = arr.find(u => u.role === 'Super-Admin');
console.log('Admin Email:', admin.email);
const passwords = ['123456', 'admin123', 'Admin123', '123456789', 'admin@123', '12345678', 'ptit123', 'taekwondo'];
const results = await Promise.all(passwords.map(p => bcrypt.compare(p, admin.password).then(r => ({ p, r }))));
results.forEach(({p, r}) => console.log(`  "${p}": ${r ? '✅ MATCH!' : '❌'}`));
