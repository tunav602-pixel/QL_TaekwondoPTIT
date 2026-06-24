import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const transactionsFilePath = path.join(dataDir, 'transactions.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(transactionsFilePath)) {
    fs.writeFileSync(transactionsFilePath, JSON.stringify([]));
  }
};

const getLocalTransactions = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(transactionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalTransactions = (transactions) => {
  initLocalStore();
  fs.writeFileSync(transactionsFilePath, JSON.stringify(transactions, null, 2), 'utf8');
};

// Mongoose Schema
const transactionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: [true, 'Vui lòng chọn ngày giao dịch']
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung giao dịch'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [0, 'Số tiền phải lớn hơn 0']
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true
  },
  person: {
    type: String,
    required: [true, 'Vui lòng nhập người thực hiện']
  },
  quantity: {
    type: Number,
    default: 1
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const MongoTransaction = mongoose.model('Transaction', transactionSchema);

// Hybrid wrapper — same pattern as User model
const TransactionWrapper = {
  find: (query = {}) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoTransaction.find(query).sort({ date: -1 });
        } catch (e) {
          console.error('Mongo Transaction find error, falling back:', e);
        }
      }
      let transactions = getLocalTransactions();

      // Apply query filters
      if (query && typeof query === 'object') {
        transactions = transactions.filter(t => {
          return Object.entries(query).every(([key, value]) => {
            // Support regex-like date filtering
            if (value && typeof value === 'object' && value.$regex) {
              return new RegExp(value.$regex).test(t[key]);
            }
            return t[key] === value;
          });
        });
      }

      // Sort by date descending
      transactions.sort((a, b) => b.date.localeCompare(a.date));
      return transactions;
    };

    const promise = exec();
    promise.sort = () => promise;
    return promise;
  },

  findById: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoTransaction.findById(id);
      } catch (e) {
        console.error('Mongo Transaction findById error, falling back:', e);
      }
    }
    const transactions = getLocalTransactions();
    return transactions.find(t => t._id === id.toString()) || null;
  },

  create: async (data) => {
    if (global.isMongoConnected) {
      try {
        return await MongoTransaction.create(data);
      } catch (e) {
        console.error('Mongo Transaction create error, falling back:', e);
      }
    }
    const transactions = getLocalTransactions();
    const newTransaction = {
      _id: Date.now().toString() + Math.round(Math.random() * 1000),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    transactions.push(newTransaction);
    saveLocalTransactions(transactions);
    return newTransaction;
  },

  insertMany: async (dataArray) => {
    if (global.isMongoConnected) {
      try {
        return await MongoTransaction.insertMany(dataArray);
      } catch (e) {
        console.error('Mongo Transaction insertMany error, falling back:', e);
      }
    }
    const transactions = getLocalTransactions();
    const newTransactions = dataArray.map(data => ({
      _id: Date.now().toString() + Math.round(Math.random() * 10000),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    }));
    transactions.push(...newTransactions);
    saveLocalTransactions(transactions);
    return newTransactions;
  },

  findByIdAndDelete: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoTransaction.findByIdAndDelete(id);
      } catch (e) {
        console.error('Mongo Transaction delete error, falling back:', e);
      }
    }
    const transactions = getLocalTransactions();
    const index = transactions.findIndex(t => t._id === id.toString());
    if (index !== -1) {
      const deleted = transactions.splice(index, 1)[0];
      saveLocalTransactions(transactions);
      return deleted;
    }
    return null;
  },

  countDocuments: async (query = {}) => {
    if (global.isMongoConnected) {
      try {
        return await MongoTransaction.countDocuments(query);
      } catch (e) {
        console.error('Mongo Transaction countDocuments error, falling back:', e);
      }
    }
    const transactions = getLocalTransactions();
    if (!query || Object.keys(query).length === 0) return transactions.length;
    return transactions.filter(t =>
      Object.entries(query).every(([key, value]) => t[key] === value)
    ).length;
  }
};

export default TransactionWrapper;
