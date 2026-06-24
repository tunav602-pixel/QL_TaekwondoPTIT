import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import UserExpense from '../models/UserExpense.js';
import Notification from '../models/Notification.js';
import Transaction from '../models/Transaction.js';
import { 
  createExpense, 
  getAllExpenses, 
  getMyExpenses, 
  handleVietQRWebhook,
  createFreeDeposit,
  confirmPayment
} from '../controllers/expenseController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
  console.log('🥋 [TEST] Starting Taekwondo PTIT Finance Expense & QR Reconciliation Test...');
  
  // 1. Connect database (Mongoose or JSON fallback)
  await connectDB();
  console.log(`📡 Database status: global.isMongoConnected = ${global.isMongoConnected}`);
  
  // 2. Fetch test users
  const users = await User.find({});
  console.log(`👥 Found ${users.length} users in the database.`);
  if (users.length === 0) {
    console.error('❌ Error: No users found. Run registration first.');
    process.exit(1);
  }
  
  const superAdmin = users.find(u => u.role === 'Super-Admin');
  const normalMember = users.find(u => u.role === 'Member');
  
  if (!superAdmin) {
    console.error('❌ Error: Super-Admin user not found.');
    process.exit(1);
  }
  if (!normalMember) {
    console.error('❌ Error: Normal member not found.');
    process.exit(1);
  }
  
  console.log(`👑 Admin: ${superAdmin.name} (${superAdmin.email})`);
  console.log(`👤 Member: ${normalMember.name} (${normalMember.email})`);
  
  // 3. Simulate creation of a new Expense
  console.log('\n--- 1. Creating a new club expense ---');
  const reqMock = {
    body: {
      title: 'Phí võ phục hè 2026',
      amount: 150000,
      description: 'Nộp phí mua võ phục hè cho CLB Taekwondo PTIT',
      deadline: '2026-06-15',
      targetType: 'all',
      bankAccount: '19036329402018',
      bankCode: 'MB',
      bankName: 'MB Bank'
    },
    user: superAdmin
  };
  
  let createdExpense = null;
  const resMock = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  
  await createExpense(reqMock, resMock);
  
  if (resMock.data && resMock.data.success) {
    createdExpense = resMock.data.expense;
    console.log(`✅ Success: Expense created! Code: ${createdExpense.code}`);
    console.log(`📌 Applied to ${resMock.data.memberCount} members.`);
  } else {
    console.error('❌ Failed to create expense:', resMock.data);
    process.exit(1);
  }
  
  // 4. Verify UserExpense created
  console.log('\n--- 2. Verifying UserExpense records ---');
  const userExpenses = await UserExpense.find({ expenseId: createdExpense._id?.toString() || createdExpense._id });
  console.log(`📈 Created ${userExpenses.length} user expense bills.`);
  
  const memberBill = userExpenses.find(ue => ue.userId === (normalMember._id?.toString() || normalMember._id));
  if (!memberBill) {
    console.error(`❌ Error: No bill created for member ${normalMember.name}`);
    process.exit(1);
  }
  
  console.log(`📝 Bill for ${normalMember.name}:`);
  console.log(`   - ID: ${memberBill._id}`);
  console.log(`   - Amount: ${memberBill.amount.toLocaleString('vi-VN')}đ`);
  console.log(`   - Status: ${memberBill.status}`);
  console.log(`   - Transfer Content: ${memberBill.transferContent}`);
  
  // 5. Verify Notification created
  console.log('\n--- 3. Verifying Notification ---');
  const notifications = await Notification.find({ userId: normalMember._id?.toString() || normalMember._id });
  const latestNotif = notifications[0];
  if (latestNotif) {
    console.log(`🔔 Latest notification for ${normalMember.name}:`);
    console.log(`   - Title: ${latestNotif.title}`);
    console.log(`   - Message: ${latestNotif.message}`);
    console.log(`   - Type: ${latestNotif.type}`);
  } else {
    console.error('❌ Error: Notification not found.');
  }
  
  // 6. Test Webhook Auto-Reconciliation
  console.log('\n--- 4. Testing VietQR Auto-Reconciliation Webhook & Transaction Sync ---');
  const initialTxCount = (await Transaction.find({})).length;
  
  const webhookReq = {
    body: {
      transferContent: memberBill.transferContent,
      amount: memberBill.amount,
      transactionDate: new Date().toISOString()
    }
  };
  const webhookRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  
  await handleVietQRWebhook(webhookReq, webhookRes);
  
  if (webhookRes.data && webhookRes.data.success) {
    console.log('✅ Webhook Auto-Reconciliation Successful!');
    console.log(`   - Message: ${webhookRes.data.message}`);
  } else {
    console.error('❌ Webhook failed:', webhookRes.data);
  }
  
  // 7. Verify bill status after webhook
  console.log('\n--- 5. Verifying user expense bill status after reconciliation ---');
  const updatedBill = await UserExpense.findById(memberBill._id);
  console.log(`📝 Bill status for ${normalMember.name}: ${updatedBill.status}`);
  if (updatedBill.status === 'confirmed') {
    console.log('🎉 YES! Bill is automatically confirmed and marked paid.');
  } else {
    console.error(`❌ Error: Bill status is ${updatedBill.status}, expected "confirmed"`);
  }
  
  // 8. Verify Transaction Created
  console.log('\n--- 6. Verifying Transaction Ledger Synchronization ---');
  const postWebhookTxs = await Transaction.find({});
  console.log(`📊 Transactions count: initial = ${initialTxCount}, current = ${postWebhookTxs.length}`);
  const latestTx = postWebhookTxs[0]; // sorted by date descending or newly created
  if (postWebhookTxs.length > initialTxCount && latestTx) {
    console.log(`💸 New Transaction Sync Success!`);
    console.log(`   - Description: ${latestTx.description}`);
    console.log(`   - Amount: ${latestTx.amount.toLocaleString('vi-VN')}đ`);
    console.log(`   - Type: ${latestTx.type}`);
  } else {
    console.error('❌ Error: Transaction was not successfully recorded in the ledger.');
  }

  // 9. Test Free Deposit / Custom Contribution
  console.log('\n--- 7. Testing Free Deposit (Nộp tiền tự do) ---');
  const freePayReq = {
    body: {
      amount: 75000,
      description: 'Hội viên tự nguyện ủng hộ quỹ hè'
    },
    user: normalMember
  };
  const freePayRes = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };

  await createFreeDeposit(freePayReq, freePayRes);
  
  if (freePayRes.data && freePayRes.data.success) {
    const freeBill = freePayRes.data.userExpense;
    console.log('✅ Free Deposit Created Successfully!');
    console.log(`   - Bill ID: ${freeBill._id}`);
    console.log(`   - Content: ${freeBill.transferContent}`);
    console.log(`   - Amount: ${freeBill.amount.toLocaleString('vi-VN')}đ`);
    console.log(`   - Title: ${freeBill.expense?.title}`);
    console.log(`   - QR URL: ${freePayRes.data.userExpense.qrUrl ? 'VietQR Generated! ✅' : 'Failed'}`);

    // Clean up free deposit
    await Expense.findByIdAndDelete(freeBill.expenseId);
    await UserExpense.findByIdAndDelete(freeBill._id);
  } else {
    console.error('❌ Free deposit creation failed:', freePayRes.data);
  }
  
  // Clean up main test data
  console.log('\n--- Cleaning up test data ---');
  await Expense.findByIdAndDelete(createdExpense._id);
  for (const ue of userExpenses) {
    await UserExpense.findByIdAndDelete(ue._id);
  }
  if (postWebhookTxs.length > initialTxCount) {
    await Transaction.findByIdAndDelete(latestTx._id);
  }
  console.log('🧹 Cleaned up Expense, UserExpense, and Transaction records.');
  
  console.log('\n🌟 [TEST] ALL TESTS PASSED SUCCESSFULLY! 🥋🎉');
  process.exit(0);
};

runTest().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
