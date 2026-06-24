import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const notificationsFilePath = path.join(dataDir, 'notifications.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(notificationsFilePath)) {
    fs.writeFileSync(notificationsFilePath, JSON.stringify([]));
  }
};

const getLocalNotifications = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(notificationsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalNotifications = (notifications) => {
  initLocalStore();
  fs.writeFileSync(notificationsFilePath, JSON.stringify(notifications, null, 2), 'utf8');
};

// Mongoose Schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_expense',        // Khoản chi mới được tạo
      'payment_reminder',   // Nhắc nhở thanh toán sắp đến hạn
      'payment_confirmed',  // Thanh toán đã được xác nhận
      'payment_rejected',   // Thanh toán bị từ chối
      'expense_completed',  // Tất cả thành viên đã thanh toán
      'new_payment',        // Admin: thành viên mới thanh toán
      'system'              // Thông báo hệ thống chung
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Liên kết đến khoản chi (nếu có)
  expenseId: {
    type: String,
    default: ''
  },
  // Đã đọc chưa
  isRead: {
    type: Boolean,
    default: false
  },
  // Metadata bổ sung
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const MongoNotification = mongoose.model('Notification', notificationSchema);

// Hybrid wrapper
const NotificationWrapper = {
  find: (query = {}) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoNotification.find(query).sort({ createdAt: -1 });
        } catch (e) {
          console.error('Mongo Notification find error, falling back:', e);
        }
      }
      let records = getLocalNotifications();

      // Apply query filters
      if (query && typeof query === 'object' && Object.keys(query).length > 0) {
        records = records.filter(rec => {
          return Object.entries(query).every(([key, value]) => {
            if (typeof value === 'boolean') return rec[key] === value;
            return rec[key] === value;
          });
        });
      }

      // Sort by createdAt descending (most recent first)
      records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return records;
    };

    const promise = exec();
    promise.sort = () => promise;
    promise.limit = (n) => {
      // Override promise to limit results
      return promise.then(results => results.slice(0, n));
    };
    return promise;
  },

  findById: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.findById(id);
      } catch (e) {
        console.error('Mongo Notification findById error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    return records.find(rec => rec._id === id.toString()) || null;
  },

  create: async (data) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.create(data);
      } catch (e) {
        console.error('Mongo Notification create error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    const newRecord = {
      _id: Date.now().toString() + Math.round(Math.random() * 1000),
      isRead: false,
      expenseId: '',
      metadata: {},
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    saveLocalNotifications(records);
    return newRecord;
  },

  insertMany: async (dataArray) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.insertMany(dataArray);
      } catch (e) {
        console.error('Mongo Notification insertMany error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    const newRecords = dataArray.map(data => ({
      _id: Date.now().toString() + Math.round(Math.random() * 10000),
      isRead: false,
      expenseId: '',
      metadata: {},
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    records.push(...newRecords);
    saveLocalNotifications(records);
    return newRecords;
  },

  findByIdAndUpdate: async (id, updateData, options) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.findByIdAndUpdate(id, updateData, { new: true, ...options });
      } catch (e) {
        console.error('Mongo Notification findByIdAndUpdate error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    const index = records.findIndex(rec => rec._id === id.toString());
    if (index !== -1) {
      const dataToUpdate = updateData.$set || updateData;
      records[index] = {
        ...records[index],
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      };
      saveLocalNotifications(records);
      return records[index];
    }
    return null;
  },

  // Đánh dấu tất cả thông báo của user là đã đọc
  updateMany: async (query, updateData) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.updateMany(query, updateData);
      } catch (e) {
        console.error('Mongo Notification updateMany error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    const dataToUpdate = updateData.$set || updateData;
    let count = 0;
    
    records.forEach((rec, index) => {
      const matches = Object.entries(query).every(([key, value]) => rec[key] === value);
      if (matches) {
        records[index] = { ...records[index], ...dataToUpdate, updatedAt: new Date().toISOString() };
        count++;
      }
    });

    saveLocalNotifications(records);
    return { modifiedCount: count };
  },

  countDocuments: async (query = {}) => {
    if (global.isMongoConnected) {
      try {
        return await MongoNotification.countDocuments(query);
      } catch (e) {
        console.error('Mongo Notification countDocuments error, falling back:', e);
      }
    }
    const records = getLocalNotifications();
    if (!query || Object.keys(query).length === 0) return records.length;
    return records.filter(rec =>
      Object.entries(query).every(([key, value]) => {
        if (typeof value === 'boolean') return rec[key] === value;
        return rec[key] === value;
      })
    ).length;
  }
};

export default NotificationWrapper;
