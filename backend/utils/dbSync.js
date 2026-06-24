import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import UserExpense from '../models/UserExpense.js';
import Transaction from '../models/Transaction.js';
import Attendance from '../models/Attendance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

const getLocalData = (filename) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const syncLocalDataToMongo = async () => {
  if (!global.isMongoConnected) {
    console.log('📁 Local mode: Skipping MongoDB synchronization.');
    return;
  }

  console.log('🔄 Starting MongoDB synchronization from local JSON files...');

  try {
    const MongoUser = mongoose.model('User');
    const MongoExpense = mongoose.model('Expense');
    const MongoUserExpense = mongoose.model('UserExpense');
    const MongoTransaction = mongoose.model('Transaction');
    const MongoAttendance = mongoose.model('Attendance');

    // 1. Sync Users
    const localUsers = getLocalData('users.json');
    if (localUsers.length > 0) {
      let syncedUsersCount = 0;
      for (const u of localUsers) {
        const exists = await MongoUser.findOne({ email: u.email.toLowerCase() });
        if (!exists) {
          await MongoUser.create(u);
          syncedUsersCount++;
        }
      }
      if (syncedUsersCount > 0) {
        console.log(`✅ Synced ${syncedUsersCount} users from users.json to MongoDB.`);
      }
    }

    // 2. Sync Expenses
    const localExpenses = getLocalData('expenses.json');
    if (localExpenses.length > 0) {
      let syncedExpensesCount = 0;
      for (const exp of localExpenses) {
        const exists = await MongoExpense.findOne({ _id: exp._id });
        if (!exists) {
          await MongoExpense.create(exp);
          syncedExpensesCount++;
        }
      }
      if (syncedExpensesCount > 0) {
        console.log(`✅ Synced ${syncedExpensesCount} expenses from expenses.json to MongoDB.`);
      }
    }

    // 3. Sync UserExpenses
    const localUserExpenses = getLocalData('user_expenses.json');
    if (localUserExpenses.length > 0) {
      let syncedUEsCount = 0;
      for (const ue of localUserExpenses) {
        const exists = await MongoUserExpense.findOne({ _id: ue._id });
        if (!exists) {
          await MongoUserExpense.create(ue);
          syncedUEsCount++;
        }
      }
      if (syncedUEsCount > 0) {
        console.log(`✅ Synced ${syncedUEsCount} user_expenses from user_expenses.json to MongoDB.`);
      }
    }

    // 4. Sync Transactions
    const localTransactions = getLocalData('transactions.json');
    if (localTransactions.length > 0) {
      let syncedTxCount = 0;
      for (const tx of localTransactions) {
        const exists = await MongoTransaction.findOne({ _id: tx._id });
        if (!exists) {
          await MongoTransaction.create(tx);
          syncedTxCount++;
        }
      }
      if (syncedTxCount > 0) {
        console.log(`✅ Synced ${syncedTxCount} transactions from transactions.json to MongoDB.`);
      }
    }

    // 5. Sync Attendance
    const localAttendance = getLocalData('attendance.json');
    if (localAttendance.length > 0) {
      let syncedAttendanceCount = 0;
      for (const att of localAttendance) {
        if (!att._id) continue;
        const exists = await MongoAttendance.findOne({ _id: att._id });
        if (!exists) {
          await MongoAttendance.create(att);
          syncedAttendanceCount++;
        }
      }
      if (syncedAttendanceCount > 0) {
        console.log(`✅ Synced ${syncedAttendanceCount} attendance records to MongoDB.`);
      }
    }

    console.log('🎉 MongoDB synchronization completed successfully!');
  } catch (error) {
    console.error('❌ Error during MongoDB synchronization:', error);
  }
};
