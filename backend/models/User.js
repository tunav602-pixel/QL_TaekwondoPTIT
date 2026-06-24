import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to users.json file inside backend workspace
const dataDir = path.join(__dirname, '../data');
const usersFilePath = path.join(dataDir, 'users.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
  }
};

const getLocalUsers = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalUsers = (users) => {
  initLocalStore();
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
};

/**
 * Parse user data đọc từ JSON file → đảm bảo otpExpires là Date object
 * Đây là nguyên nhân chính gây lỗi OTP: JSON serialize Date thành string,
 * khiến phép so sánh `new Date() > user.otpExpires` không hoạt động đúng.
 */
const parseUserFromJSON = (rawUser) => {
  if (!rawUser) return null;
  return {
    ...rawUser,
    otpExpires: rawUser.otpExpires ? new Date(rawUser.otpExpires) : null,
    select: function() { return this; }
  };
};

/**
 * Tự động tạo mã hội viên dạng TKD-PTIT-XXXX
 */
const generateMaHoiVien = (users) => {
  let maxNumber = 0;
  for (const u of users) {
    if (u.maHoiVien) {
      const match = u.maHoiVien.match(/TKD-PTIT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
  }
  const nextNumber = maxNumber + 1;
  return `TKD-PTIT-${nextNumber.toString().padStart(4, '0')}`;
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [50, 'Họ tên không quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },
  role: {
    type: String,
    default: 'Member',
    enum: [
      'Super-Admin',    // tunav602@gmail.com - The only one
      'Sub-Admin',      // Ban tài chính, Ban nhân sự, etc.
      'Member'          // Regular members
    ]
  },
  subRole: {
    type: String,
    default: '',
    enum: [
      '',
      'Chủ nhiệm',
      'Ban chuyên môn',
      'Ban tài chính',
      'Ban sự kiện',
      'Ban nhân sự',
      'Ban truyền thông'
    ]
  },
  maHoiVien: {
    type: String,
    unique: true,
    default: ''
  },
  otpCode: {
    type: String,
    default: ''
  },
  otpExpires: {
    type: Date,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  dob: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    default: 'Nam',
    enum: ['Nam', 'Nữ', 'Khác']
  },
  studentId: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  attendanceStatus: {
    type: String,
    default: 'pending',
    enum: ['eligible', 'ineligible', 'pending']
  },
  lastEvaluated: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const MongoUser = mongoose.model('User', userSchema);

// Hybrid model that works both with MongoDB and Local JSON fallback
const UserWrapper = {
  findOne: async (query) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUser.findOne(query);
      } catch (e) {
        console.error('Mongo findOne error, falling back:', e);
      }
    }
    const users = getLocalUsers();
    if (query.email) {
      const emailLower = query.email.toLowerCase();
      const rawUser = users.find(u => u.email === emailLower);
      return parseUserFromJSON(rawUser);
    }
    return null;
  },

  create: async (userData) => {
    if (global.isMongoConnected) {
      try {
        // Auto-generate mã hội viên nếu chưa có
        if (!userData.maHoiVien) {
          const allUsers = await MongoUser.find({}).select('maHoiVien');
          userData.maHoiVien = generateMaHoiVien(allUsers);
        }
        return await MongoUser.create(userData);
      } catch (e) {
        console.error('Mongo create error, falling back:', e);
      }
    }
    const users = getLocalUsers();
    // Auto-generate mã hội viên
    const maHoiVien = userData.maHoiVien || generateMaHoiVien(users);
    const newUser = {
      _id: Date.now().toString(),
      phone: '',
      dob: '',
      gender: 'Nam',
      studentId: '',
      maHoiVien,
      otpCode: '',
      otpExpires: null,
      ...userData,
      maHoiVien, // Đảm bảo luôn có mã hội viên (override nếu userData không có)
      email: userData.email.toLowerCase(),
      role: userData.role || 'Member',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    saveLocalUsers(users);
    return parseUserFromJSON(newUser);
  },

  findById: (id) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoUser.findById(id);
        } catch (e) {
          console.error('Mongo findById error, falling back:', e);
        }
      }
      const users = getLocalUsers();
      const rawUser = users.find(u => u._id === id.toString());
      return parseUserFromJSON(rawUser);
    };

    const promise = exec();
    // Mimic the mongoose query chain .select()
    promise.select = () => promise;
    return promise;
  },

  findByIdAndUpdate: async (id, updateData, options) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUser.findByIdAndUpdate(id, updateData, { new: true, ...options });
      } catch (e) {
        console.error('Mongo findByIdAndUpdate error, falling back:', e);
      }
    }
    const users = getLocalUsers();
    const index = users.findIndex(u => u._id === id.toString());
    if (index !== -1) {
      const dataToUpdate = updateData.$set || updateData;
      
      // Serialize Date objects (otpExpires) to ISO strings for JSON storage
      const serializedData = {};
      for (const [key, value] of Object.entries(dataToUpdate)) {
        if (value instanceof Date) {
          serializedData[key] = value.toISOString();
        } else {
          serializedData[key] = value;
        }
      }
      
      users[index] = {
        ...users[index],
        ...serializedData,
        updatedAt: new Date().toISOString()
      };
      saveLocalUsers(users);
      return parseUserFromJSON(users[index]);
    }
    return null;
  },

  /**
   * Find multiple documents (needed for getAllSubAdmins)
   */
  find: (query) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoUser.find(query).select('-password');
        } catch (e) {
          console.error('Mongo find error, falling back:', e);
        }
      }
      const users = getLocalUsers();
      let filtered = users;
      
      // Apply query filters
      if (query && typeof query === 'object') {
        filtered = users.filter(u => {
          return Object.entries(query).every(([key, value]) => u[key] === value);
        });
      }
      
      // Remove password field
      return filtered.map(u => {
        const { password, ...rest } = u;
        return parseUserFromJSON(rest);
      });
    };

    const promise = exec();
    // Mimic mongoose chain .select()
    promise.select = () => promise;
    return promise;
  }
};

export default UserWrapper;
