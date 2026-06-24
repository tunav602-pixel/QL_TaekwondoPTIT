import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const userExpensesFilePath = path.join(dataDir, 'user_expenses.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(userExpensesFilePath)) {
    fs.writeFileSync(userExpensesFilePath, JSON.stringify([]));
  }
};

const getLocalUserExpenses = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(userExpensesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalUserExpenses = (userExpenses) => {
  initLocalStore();
  fs.writeFileSync(userExpensesFilePath, JSON.stringify(userExpenses, null, 2), 'utf8');
};

// Mongoose Schema — Bảng trung gian giữa Expense ↔ User
const userExpenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  // Trạng thái thanh toán
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'confirmed', 'rejected']
    // pending = chưa thanh toán
    // paid = user đã nhấn "Đã thanh toán" (chờ xác nhận)
    // confirmed = admin đã xác nhận hoặc webhook tự động
    // rejected = admin từ chối
  },
  // Số tiền cần trả (có thể khác nhau nếu cần)
  amount: {
    type: Number,
    required: true
  },
  // Nội dung chuyển khoản (tự sinh cho VietQR)
  transferContent: {
    type: String,
    default: ''
  },
  // Ảnh bill minh chứng (upload bởi user)
  billImageUrl: {
    type: String,
    default: ''
  },
  // Ngày thanh toán thực tế
  paidAt: {
    type: String,
    default: ''
  },
  // Ngày xác nhận bởi admin
  confirmedAt: {
    type: String,
    default: ''
  },
  confirmedBy: {
    type: String,
    default: ''
  },
  // Ghi chú từ admin
  adminNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const MongoUserExpense = mongoose.model('UserExpense', userExpenseSchema);

// Hybrid wrapper
const UserExpenseWrapper = {
  find: (query = {}) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoUserExpense.find(query).sort({ createdAt: -1 });
        } catch (e) {
          console.error('Mongo UserExpense find error, falling back:', e);
        }
      }
      let records = getLocalUserExpenses();

      // Apply query filters
      if (query && typeof query === 'object' && Object.keys(query).length > 0) {
        records = records.filter(rec => {
          return Object.entries(query).every(([key, value]) => {
            if (value && typeof value === 'object' && value.$in) {
              return value.$in.includes(rec[key]);
            }
            if (value && typeof value === 'object' && value.$ne) {
              return rec[key] !== value.$ne;
            }
            return rec[key] === value;
          });
        });
      }

      // Sort by createdAt descending
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return records;
    };

    const promise = exec();
    promise.sort = () => promise;
    return promise;
  },

  findOne: async (query) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.findOne(query);
      } catch (e) {
        console.error('Mongo UserExpense findOne error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    return records.find(rec => {
      return Object.entries(query).every(([key, value]) => rec[key] === value);
    }) || null;
  },

  findById: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.findById(id);
      } catch (e) {
        console.error('Mongo UserExpense findById error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    return records.find(rec => rec._id === id.toString()) || null;
  },

  create: async (data) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.create(data);
      } catch (e) {
        console.error('Mongo UserExpense create error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    const newRecord = {
      _id: Date.now().toString() + Math.round(Math.random() * 1000),
      status: 'pending',
      transferContent: '',
      billImageUrl: '',
      paidAt: '',
      confirmedAt: '',
      confirmedBy: '',
      adminNote: '',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    saveLocalUserExpenses(records);
    return newRecord;
  },

  insertMany: async (dataArray) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.insertMany(dataArray);
      } catch (e) {
        console.error('Mongo UserExpense insertMany error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    const newRecords = dataArray.map(data => ({
      _id: Date.now().toString() + Math.round(Math.random() * 10000),
      status: 'pending',
      transferContent: '',
      billImageUrl: '',
      paidAt: '',
      confirmedAt: '',
      confirmedBy: '',
      adminNote: '',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    records.push(...newRecords);
    saveLocalUserExpenses(records);
    return newRecords;
  },

  findByIdAndUpdate: async (id, updateData, options) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.findByIdAndUpdate(id, updateData, { new: true, ...options });
      } catch (e) {
        console.error('Mongo UserExpense findByIdAndUpdate error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    const index = records.findIndex(rec => rec._id === id.toString());
    if (index !== -1) {
      const dataToUpdate = updateData.$set || updateData;
      records[index] = {
        ...records[index],
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      };
      saveLocalUserExpenses(records);
      return records[index];
    }
    return null;
  },

  findByIdAndDelete: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.findByIdAndDelete(id);
      } catch (e) {
        console.error('Mongo UserExpense delete error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    const index = records.findIndex(rec => rec._id === id.toString());
    if (index !== -1) {
      const deleted = records.splice(index, 1)[0];
      saveLocalUserExpenses(records);
      return deleted;
    }
    return null;
  },

  countDocuments: async (query = {}) => {
    if (global.isMongoConnected) {
      try {
        return await MongoUserExpense.countDocuments(query);
      } catch (e) {
        console.error('Mongo UserExpense countDocuments error, falling back:', e);
      }
    }
    const records = getLocalUserExpenses();
    if (!query || Object.keys(query).length === 0) return records.length;
    return records.filter(rec =>
      Object.entries(query).every(([key, value]) => rec[key] === value)
    ).length;
  }
};

export default UserExpenseWrapper;
