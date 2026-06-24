import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const expensesFilePath = path.join(dataDir, 'expenses.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(expensesFilePath)) {
    fs.writeFileSync(expensesFilePath, JSON.stringify([]));
  }
};

const getLocalExpenses = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(expensesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalExpenses = (expenses) => {
  initLocalStore();
  fs.writeFileSync(expensesFilePath, JSON.stringify(expenses, null, 2), 'utf8');
};

// Mongoose Schema
const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên khoản chi'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [1000, 'Số tiền phải ít nhất 1.000đ']
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  deadline: {
    type: String,
    required: [true, 'Vui lòng chọn hạn chót']
  },
  // 'all' = tất cả thành viên, hoặc array các userId cụ thể
  targetType: {
    type: String,
    default: 'all',
    enum: ['all', 'specific']
  },
  targetMembers: [{
    type: String // userId
  }],
  // Thông tin ngân hàng để tạo VietQR
  bankAccount: {
    type: String,
    required: [true, 'Vui lòng nhập số tài khoản ngân hàng']
  },
  bankCode: {
    type: String,
    required: [true, 'Vui lòng chọn ngân hàng'],
    default: 'MB' // Mặc định MB Bank
  },
  bankName: {
    type: String,
    default: ''
  },
  // Tình trạng chung
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'completed', 'cancelled']
  },
  createdBy: {
    type: String,
    required: true
  },
  createdByName: {
    type: String,
    default: ''
  },
  // Thống kê nhanh (được cập nhật mỗi khi có thanh toán)
  totalPaid: {
    type: Number,
    default: 0
  },
  totalMembers: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const MongoExpense = mongoose.model('Expense', expenseSchema);

/**
 * Tạo mã khoản chi dạng KC-{timestamp}-{random}
 */
const generateExpenseCode = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `KC-${ts}-${rand}`;
};

// Hybrid wrapper — same pattern as Transaction model
const ExpenseWrapper = {
  find: (query = {}) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoExpense.find(query).sort({ createdAt: -1 });
        } catch (e) {
          console.error('Mongo Expense find error, falling back:', e);
        }
      }
      let expenses = getLocalExpenses();

      // Apply query filters
      if (query && typeof query === 'object' && Object.keys(query).length > 0) {
        expenses = expenses.filter(exp => {
          return Object.entries(query).every(([key, value]) => {
            if (value && typeof value === 'object' && value.$in) {
              return value.$in.includes(exp[key]);
            }
            if (value && typeof value === 'object' && value.$ne) {
              return exp[key] !== value.$ne;
            }
            return exp[key] === value;
          });
        });
      }

      // Sort by createdAt descending
      expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return expenses;
    };

    const promise = exec();
    promise.sort = () => promise;
    return promise;
  },

  findById: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoExpense.findById(id);
      } catch (e) {
        console.error('Mongo Expense findById error, falling back:', e);
      }
    }
    const expenses = getLocalExpenses();
    return expenses.find(exp => exp._id === id.toString()) || null;
  },

  create: async (data) => {
    if (global.isMongoConnected) {
      try {
        return await MongoExpense.create({ ...data, code: generateExpenseCode() });
      } catch (e) {
        console.error('Mongo Expense create error, falling back:', e);
      }
    }
    const expenses = getLocalExpenses();
    const newExpense = {
      _id: Date.now().toString() + Math.round(Math.random() * 1000),
      code: generateExpenseCode(),
      totalPaid: 0,
      totalMembers: 0,
      status: 'active',
      targetType: 'all',
      targetMembers: [],
      bankCode: 'MB',
      bankName: '',
      description: '',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expenses.push(newExpense);
    saveLocalExpenses(expenses);
    return newExpense;
  },

  findByIdAndUpdate: async (id, updateData, options) => {
    if (global.isMongoConnected) {
      try {
        return await MongoExpense.findByIdAndUpdate(id, updateData, { new: true, ...options });
      } catch (e) {
        console.error('Mongo Expense findByIdAndUpdate error, falling back:', e);
      }
    }
    const expenses = getLocalExpenses();
    const index = expenses.findIndex(exp => exp._id === id.toString());
    if (index !== -1) {
      const dataToUpdate = updateData.$set || updateData;
      expenses[index] = {
        ...expenses[index],
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      };
      saveLocalExpenses(expenses);
      return expenses[index];
    }
    return null;
  },

  findByIdAndDelete: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoExpense.findByIdAndDelete(id);
      } catch (e) {
        console.error('Mongo Expense delete error, falling back:', e);
      }
    }
    const expenses = getLocalExpenses();
    const index = expenses.findIndex(exp => exp._id === id.toString());
    if (index !== -1) {
      const deleted = expenses.splice(index, 1)[0];
      saveLocalExpenses(expenses);
      return deleted;
    }
    return null;
  },

  countDocuments: async (query = {}) => {
    if (global.isMongoConnected) {
      try {
        return await MongoExpense.countDocuments(query);
      } catch (e) {
        console.error('Mongo Expense countDocuments error, falling back:', e);
      }
    }
    const expenses = getLocalExpenses();
    if (!query || Object.keys(query).length === 0) return expenses.length;
    return expenses.filter(exp =>
      Object.entries(query).every(([key, value]) => exp[key] === value)
    ).length;
  }
};

export default ExpenseWrapper;
