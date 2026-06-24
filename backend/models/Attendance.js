import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
const attendanceFilePath = path.join(dataDir, 'attendance.json');

// Ensure data directory and file exist
const initLocalStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(attendanceFilePath)) {
    fs.writeFileSync(attendanceFilePath, JSON.stringify([]));
  }
};

const getLocalAttendance = () => {
  initLocalStore();
  try {
    const data = fs.readFileSync(attendanceFilePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalAttendance = (records) => {
  initLocalStore();
  fs.writeFileSync(attendanceFilePath, JSON.stringify(records, null, 2), 'utf8');
};

// Mongoose Schema
const attendanceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'ID hội viên là bắt buộc']
  },
  userName: {
    type: String,
    default: ''
  },
  maHoiVien: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: [true, 'Ngày điểm danh là bắt buộc']
  },
  status: {
    type: String,
    required: true,
    enum: ['present', 'excused', 'absent'],
    default: 'present'
  },
  note: {
    type: String,
    default: ''
  },
  markedBy: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Composite index: one attendance record per user per date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const MongoAttendance = mongoose.model('Attendance', attendanceSchema);

// Hybrid wrapper — same pattern as User/Transaction models
const AttendanceWrapper = {
  find: (query = {}) => {
    const exec = async () => {
      if (global.isMongoConnected) {
        try {
          return await MongoAttendance.find(query).sort({ date: -1 });
        } catch (e) {
          console.error('Mongo Attendance find error, falling back:', e);
        }
      }
      let records = getLocalAttendance();

      // Apply query filters
      if (query && typeof query === 'object') {
        records = records.filter(r => {
          return Object.entries(query).every(([key, value]) => {
            if (value && typeof value === 'object' && value.$gte && value.$lte) {
              return r[key] >= value.$gte && r[key] <= value.$lte;
            }
            if (value && typeof value === 'object' && value.$regex) {
              return new RegExp(value.$regex).test(r[key]);
            }
            return r[key] === value;
          });
        });
      }

      records.sort((a, b) => b.date.localeCompare(a.date));
      return records;
    };

    const promise = exec();
    promise.sort = () => promise;
    return promise;
  },

  findOne: async (query) => {
    if (global.isMongoConnected) {
      try {
        return await MongoAttendance.findOne(query);
      } catch (e) {
        console.error('Mongo Attendance findOne error, falling back:', e);
      }
    }
    const records = getLocalAttendance();
    return records.find(r => {
      return Object.entries(query).every(([key, value]) => r[key] === value);
    }) || null;
  },

  create: async (data) => {
    if (global.isMongoConnected) {
      try {
        return await MongoAttendance.create(data);
      } catch (e) {
        console.error('Mongo Attendance create error, falling back:', e);
      }
    }
    const records = getLocalAttendance();
    const newRecord = {
      _id: Date.now().toString() + Math.round(Math.random() * 1000),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    records.push(newRecord);
    saveLocalAttendance(records);
    return newRecord;
  },

  /**
   * Bulk upsert attendance records (for batch marking)
   * @param {Array} attendanceList - Array of { userId, userName, maHoiVien, date, status, note, markedBy }
   */
  bulkUpsert: async (attendanceList) => {
    if (global.isMongoConnected) {
      try {
        const operations = attendanceList.map(item => ({
          updateOne: {
            filter: { userId: item.userId, date: item.date },
            update: { $set: item },
            upsert: true
          }
        }));
        return await MongoAttendance.bulkWrite(operations);
      } catch (e) {
        console.error('Mongo Attendance bulkUpsert error, falling back:', e);
      }
    }

    // Local JSON fallback
    const records = getLocalAttendance();
    const results = [];

    for (const item of attendanceList) {
      const existingIndex = records.findIndex(
        r => r.userId === item.userId && r.date === item.date
      );

      if (existingIndex !== -1) {
        // Update existing
        records[existingIndex] = {
          ...records[existingIndex],
          ...item,
          updatedAt: new Date().toISOString()
        };
        results.push(records[existingIndex]);
      } else {
        // Insert new
        const newRecord = {
          _id: Date.now().toString() + Math.round(Math.random() * 10000),
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        records.push(newRecord);
        results.push(newRecord);
      }
    }

    saveLocalAttendance(records);
    return results;
  },

  findByIdAndUpdate: async (id, updateData, options) => {
    if (global.isMongoConnected) {
      try {
        return await MongoAttendance.findByIdAndUpdate(id, updateData, { new: true, ...options });
      } catch (e) {
        console.error('Mongo Attendance findByIdAndUpdate error, falling back:', e);
      }
    }
    const records = getLocalAttendance();
    const index = records.findIndex(r => r._id === id.toString());
    if (index !== -1) {
      const dataToUpdate = updateData.$set || updateData;
      records[index] = {
        ...records[index],
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      };
      saveLocalAttendance(records);
      return records[index];
    }
    return null;
  },

  findByIdAndDelete: async (id) => {
    if (global.isMongoConnected) {
      try {
        return await MongoAttendance.findByIdAndDelete(id);
      } catch (e) {
        console.error('Mongo Attendance delete error, falling back:', e);
      }
    }
    const records = getLocalAttendance();
    const index = records.findIndex(r => r._id === id.toString());
    if (index !== -1) {
      const deleted = records.splice(index, 1)[0];
      saveLocalAttendance(records);
      return deleted;
    }
    return null;
  },

  countDocuments: async (query = {}) => {
    if (global.isMongoConnected) {
      try {
        return await MongoAttendance.countDocuments(query);
      } catch (e) {
        console.error('Mongo Attendance countDocuments error, falling back:', e);
      }
    }
    const records = getLocalAttendance();
    if (!query || Object.keys(query).length === 0) return records.length;
    return records.filter(r =>
      Object.entries(query).every(([key, value]) => r[key] === value)
    ).length;
  }
};

export default AttendanceWrapper;
