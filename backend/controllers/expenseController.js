import crypto from 'crypto';
import Expense from '../models/Expense.js';
import UserExpense from '../models/UserExpense.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import appConfig from '../config/appConfig.js';
import { taskQueue } from '../utils/taskQueueManager.js';


/**
 * ===== VIETQR HELPER =====
 * Tạo URL VietQR động cho mỗi khoản thanh toán
 * API: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={CONTENT}
 */
const generateVietQRUrl = (bankCode, bankAccount, amount, transferContent) => {
  const template = appConfig.vietqr.template;
  const encodedContent = encodeURIComponent(transferContent);
  return `https://img.vietqr.io/image/${bankCode}-${bankAccount}-${template}.png?amount=${amount}&addInfo=${encodedContent}&accountName=CLB%20TAEKWONDO%20PTIT`;
};

/**
 * ===== WEBHOOK SECURITY =====
 * Xác thực VietQR webhook bằng HMAC-SHA256 signature.
 * Port từ MoneyPrinterTurbo controllers/base.py verify_token().
 * 
 * Khi VIETQR_WEBHOOK_SECRET được cấu hình trong .env:
 * - Webhook phải gửi kèm header: x-webhook-signature = HMAC-SHA256(body, secret)
 * - Nếu thiếu hoặc sai signature → reject 401
 * 
 * Khi chưa cấu hình (dev mode):
 * - Log warning nhưng vẫn xử lý (để test dễ dàng)
 */
const verifyWebhookSignature = (req) => {
  const webhookSecret = appConfig.vietqr.webhookSecret;
  
  // Dev mode: chưa cấu hình secret → cảnh báo nhưng cho qua
  if (!webhookSecret) {
    console.warn('⚠️ [Security] VIETQR_WEBHOOK_SECRET chưa được cấu hình! Webhook đang chạy KHÔNG có xác thực.');
    return true;
  }

  const signature = req.headers['x-webhook-signature'] || req.headers['x-api-key'] || '';
  if (!signature) {
    console.warn('⚠️ [Security] Webhook request thiếu signature header.');
    return false;
  }

  // Tính HMAC-SHA256 từ request body
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // Constant-time comparison để chống timing attack
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * @route POST /api/expenses
 * @desc Admin tạo khoản chi/thu mới
 * @access Admin only
 */
export const createExpense = async (req, res) => {
  try {
    const { title, amount, description, deadline, targetType, targetMembers, bankAccount, bankCode, bankName } = req.body;

    // Validate
    if (!title || !amount || !deadline || !bankAccount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: Tên khoản chi, Số tiền, Hạn chót, Số tài khoản ngân hàng.'
      });
    }

    if (amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền phải ít nhất 1.000đ.'
      });
    }

    // Lấy danh sách thành viên cần áp dụng
    let members = [];
    if (targetType === 'specific' && targetMembers && targetMembers.length > 0) {
      // Lấy thông tin các thành viên cụ thể
      const allUsers = await User.find({});
      members = allUsers.filter(u => targetMembers.includes(u._id?.toString() || u._id));
    } else {
      // Lấy tất cả thành viên (Member + Sub-Admin, trừ Super-Admin)
      const allUsers = await User.find({});
      members = allUsers.filter(u => u.role !== 'Super-Admin');
    }

    if (members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy thành viên nào để áp dụng khoản chi này.'
      });
    }

    // Tạo khoản chi chính
    const expense = await Expense.create({
      title,
      amount,
      description: description || '',
      deadline,
      targetType: targetType || 'all',
      targetMembers: targetType === 'specific' ? targetMembers : [],
      bankAccount,
      bankCode: bankCode || 'MB',
      bankName: bankName || '',
      createdBy: req.user._id?.toString() || req.user._id,
      createdByName: req.user.name || '',
      totalMembers: members.length
    });

    // Tạo UserExpense records cho từng thành viên
    const userExpenseRecords = members.map(member => {
      const memberId = member._id?.toString() || member._id;
      const transferContent = `${expense.code}_${memberId}`;
      return {
        expenseId: expense._id?.toString() || expense._id,
        userId: memberId,
        userName: member.name || '',
        userEmail: member.email || '',
        amount: amount,
        transferContent,
        status: 'pending'
      };
    });

    await UserExpense.insertMany(userExpenseRecords);

    // Tạo thông báo cho từng thành viên
    const notifications = members.map(member => ({
      userId: member._id?.toString() || member._id,
      type: 'new_expense',
      title: '💰 Khoản chi mới',
      message: `Bạn có khoản chi mới "${title}" - ${amount.toLocaleString('vi-VN')}đ. Hạn chót: ${new Date(deadline).toLocaleDateString('vi-VN')}.`,
      expenseId: expense._id?.toString() || expense._id,
      metadata: { amount, deadline, expenseTitle: title }
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Tạo khoản chi thành công! Đã gửi thông báo đến ${members.length} thành viên.`,
      expense,
      memberCount: members.length
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo khoản chi.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/expenses
 * @desc Lấy danh sách tất cả khoản chi (Admin)
 * @access Admin only
 */
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({});
    
    // Enrich each expense with payment stats
    const enrichedExpenses = await Promise.all(expenses.map(async (exp) => {
      const expId = exp._id?.toString() || exp._id;
      const userExpenses = await UserExpense.find({ expenseId: expId });
      const paidCount = userExpenses.filter(ue => ue.status === 'confirmed').length;
      const pendingCount = userExpenses.filter(ue => ue.status === 'pending').length;
      const waitingCount = userExpenses.filter(ue => ue.status === 'paid').length;
      
      return {
        ...exp,
        _id: expId,
        stats: {
          total: userExpenses.length,
          paid: paidCount,
          pending: pendingCount,
          waiting: waitingCount,
          progress: userExpenses.length > 0 ? Math.round((paidCount / userExpenses.length) * 100) : 0
        }
      };
    }));

    res.json({
      success: true,
      expenses: enrichedExpenses
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route GET /api/expenses/:id
 * @desc Chi tiết khoản chi + danh sách user expenses (Admin)
 * @access Admin only
 */
export const getExpenseDetail = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const expId = expense._id?.toString() || expense._id;
    const userExpenses = await UserExpense.find({ expenseId: expId });

    res.json({
      success: true,
      expense,
      userExpenses
    });
  } catch (error) {
    console.error('Get expense detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route GET /api/expenses/my
 * @desc Lấy khoản chi của thành viên đang đăng nhập
 * @access Authenticated users
 */
export const getMyExpenses = async (req, res) => {
  try {
    const userId = req.user._id?.toString() || req.user._id;
    const userExpenses = await UserExpense.find({ userId });

    // Enrich with expense details
    const enriched = await Promise.all(userExpenses.map(async (ue) => {
      const expense = await Expense.findById(ue.expenseId);
      return {
        ...ue,
        _id: ue._id?.toString() || ue._id,
        expense: expense ? {
          title: expense.title,
          description: expense.description,
          deadline: expense.deadline,
          bankAccount: expense.bankAccount,
          bankCode: expense.bankCode,
          bankName: expense.bankName,
          code: expense.code,
          status: expense.status,
          createdByName: expense.createdByName,
          createdAt: expense.createdAt
        } : null,
        qrUrl: expense ? generateVietQRUrl(
          expense.bankCode,
          expense.bankAccount,
          ue.amount,
          ue.transferContent
        ) : ''
      };
    }));

    // Phân loại
    const pending = enriched.filter(e => e.status === 'pending' || e.status === 'paid');
    const paid = enriched.filter(e => e.status === 'confirmed');

    res.json({
      success: true,
      pending,
      paid,
      all: enriched
    });
  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route PUT /api/expenses/pay/:userExpenseId
 * @desc User đánh dấu đã thanh toán + upload bill
 * @access Authenticated users
 */
export const markAsPaid = async (req, res) => {
  try {
    const userExpense = await UserExpense.findById(req.params.userExpenseId);
    if (!userExpense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const userId = req.user._id?.toString() || req.user._id;
    if (userExpense.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    if (userExpense.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Khoản chi này đã được xác nhận thanh toán.' });
    }

    // Upload bill image URL (nếu gửi qua body)
    const billImageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.billImageUrl || '');

    const updated = await UserExpense.findByIdAndUpdate(
      req.params.userExpenseId,
      {
        status: 'paid',
        paidAt: new Date().toISOString(),
        billImageUrl
      }
    );

    // Gửi thông báo cho Admin
    const expense = await Expense.findById(userExpense.expenseId);
    if (expense) {
      await Notification.create({
        userId: expense.createdBy,
        type: 'new_payment',
        title: '🔔 Thanh toán mới',
        message: `${req.user.name} đã thanh toán "${expense.title}" - ${userExpense.amount.toLocaleString('vi-VN')}đ. Chờ xác nhận.`,
        expenseId: expense._id?.toString() || expense._id,
        metadata: { userName: req.user.name, amount: userExpense.amount }
      });
    }

    res.json({
      success: true,
      message: 'Đã đánh dấu thanh toán! Chờ Admin xác nhận.',
      userExpense: updated
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route PUT /api/expenses/confirm/:userExpenseId
 * @desc Admin xác nhận thanh toán
 * @access Admin only
 */
export const confirmPayment = async (req, res) => {
  try {
    const userExpense = await UserExpense.findById(req.params.userExpenseId);
    if (!userExpense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi thanh toán.' });
    }

    const adminId = req.user._id?.toString() || req.user._id;
    const adminNote = req.body.adminNote || '';

    const updated = await UserExpense.findByIdAndUpdate(
      req.params.userExpenseId,
      {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: adminId,
        adminNote
      }
    );

    // Tự động thêm giao dịch (Transaction) nội bộ để ghi nhận số dư tài quỹ
    try {
      const expense = await Expense.findById(userExpense.expenseId);
      await Transaction.create({
        date: new Date().toLocaleDateString('en-CA'),
        description: `Thu: ${expense ? expense.title : 'Khoản nợ'} - Hội viên ${userExpense.userName}`,
        amount: Number(userExpense.amount),
        type: 'income',
        category: expense && expense.title.toLowerCase().includes('học phí') ? 'Học phí tháng' : 'Quỹ CLB',
        person: userExpense.userName || 'Hội viên',
        quantity: 1,
        unitPrice: Number(userExpense.amount),
        createdBy: adminId
      });
    } catch (txError) {
      console.error('Error creating transaction on confirmPayment:', txError);
    }

    // Gửi thông báo cho thành viên
    await Notification.create({
      userId: userExpense.userId,
      type: 'payment_confirmed',
      title: '✅ Thanh toán đã xác nhận',
      message: `Khoản thanh toán ${userExpense.amount.toLocaleString('vi-VN')}đ đã được Admin xác nhận.${adminNote ? ` Ghi chú: ${adminNote}` : ''}`,
      expenseId: userExpense.expenseId,
      metadata: { amount: userExpense.amount }
    });

    // Kiểm tra nếu tất cả thành viên đã thanh toán → chuyển expense sang completed
    const allUserExpenses = await UserExpense.find({ expenseId: userExpense.expenseId });
    const allConfirmed = allUserExpenses.every(ue => {
      const ueId = ue._id?.toString() || ue._id;
      return ueId === (req.params.userExpenseId) ? true : ue.status === 'confirmed';
    });

    if (allConfirmed) {
      await Expense.findByIdAndUpdate(userExpense.expenseId, {
        status: 'completed',
        totalPaid: allUserExpenses.length
      });
    } else {
      // Cập nhật totalPaid
      const paidCount = allUserExpenses.filter(ue => ue.status === 'confirmed').length + 1;
      await Expense.findByIdAndUpdate(userExpense.expenseId, { totalPaid: paidCount });
    }

    res.json({
      success: true,
      message: 'Đã xác nhận thanh toán thành công!',
      userExpense: updated
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route PUT /api/expenses/reject/:userExpenseId
 * @desc Admin từ chối thanh toán
 * @access Admin only
 */
export const rejectPayment = async (req, res) => {
  try {
    const userExpense = await UserExpense.findById(req.params.userExpenseId);
    if (!userExpense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi thanh toán.' });
    }

    const adminNote = req.body.adminNote || 'Thanh toán không hợp lệ. Vui lòng thử lại.';

    const updated = await UserExpense.findByIdAndUpdate(
      req.params.userExpenseId,
      {
        status: 'rejected',
        adminNote
      }
    );

    // Gửi thông báo cho thành viên
    await Notification.create({
      userId: userExpense.userId,
      type: 'payment_rejected',
      title: '❌ Thanh toán bị từ chối',
      message: `Khoản thanh toán ${userExpense.amount.toLocaleString('vi-VN')}đ đã bị từ chối. Lý do: ${adminNote}`,
      expenseId: userExpense.expenseId,
      metadata: { amount: userExpense.amount, reason: adminNote }
    });

    res.json({
      success: true,
      message: 'Đã từ chối thanh toán.',
      userExpense: updated
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route POST /api/expenses/webhook/vietqr
 * @desc Webhook nhận callback từ VietQR/ngân hàng khi có chuyển khoản
 * @access Public (xác thực qua API key)
 */
export const handleVietQRWebhook = async (req, res) => {
  try {
    // ===== Xác thực webhook signature =====
    // Giống MoneyPrinterTurbo verify_token() — chặn request giả mạo
    if (!verifyWebhookSignature(req)) {
      console.warn('🚫 [Security] VietQR webhook: Signature không hợp lệ!');
      return res.status(401).json({ success: false, message: 'Webhook signature không hợp lệ.' });
    }

    const { transferContent, amount, transactionDate } = req.body;

    if (!transferContent || !amount) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
    }

    console.log(`🔔 VietQR Webhook: transferContent="${transferContent}", amount=${amount}`);

    // Tìm UserExpense khớp với nội dung chuyển khoản
    const userExpense = await UserExpense.findOne({ transferContent: transferContent.trim() });

    if (!userExpense) {
      console.log(`⚠️ Webhook: Không tìm thấy UserExpense cho "${transferContent}"`);
      return res.json({ success: false, message: 'Không tìm thấy khoản chi khớp.' });
    }

    if (userExpense.status === 'confirmed') {
      console.log(`ℹ️ Webhook: UserExpense "${transferContent}" đã được xác nhận trước đó.`);
      return res.json({ success: true, message: 'Khoản chi đã được xác nhận trước đó.' });
    }

    // Kiểm tra số tiền
    if (Number(amount) < userExpense.amount) {
      console.log(`⚠️ Webhook: Số tiền chuyển (${amount}) < Số tiền yêu cầu (${userExpense.amount})`);
      return res.json({ success: false, message: 'Số tiền chuyển khoản không đủ.' });
    }

    // Tự động xác nhận
    await UserExpense.findByIdAndUpdate(
      userExpense._id?.toString() || userExpense._id,
      {
        status: 'confirmed',
        paidAt: transactionDate || new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'system_webhook',
        adminNote: 'Tự động xác nhận qua VietQR webhook.'
      }
    );

    // Tự động thêm giao dịch (Transaction) nội bộ để ghi nhận số dư tài quỹ
    try {
      const expense = await Expense.findById(userExpense.expenseId);
      await Transaction.create({
        date: new Date().toLocaleDateString('en-CA'),
        description: `Thu qua VietQR: ${expense ? expense.title : 'Khoản nợ'} - Hội viên ${userExpense.userName}`,
        amount: Number(userExpense.amount),
        type: 'income',
        category: expense && expense.title.toLowerCase().includes('học phí') ? 'Học phí tháng' : 'Quỹ CLB',
        person: userExpense.userName || 'Hội viên',
        quantity: 1,
        unitPrice: Number(userExpense.amount),
        createdBy: 'system_webhook'
      });
    } catch (txError) {
      console.error('Error creating transaction on webhook:', txError);
    }

    // Thông báo cho thành viên
    await Notification.create({
      userId: userExpense.userId,
      type: 'payment_confirmed',
      title: '✅ Tự động xác nhận thanh toán',
      message: `Khoản thanh toán ${userExpense.amount.toLocaleString('vi-VN')}đ đã được hệ thống tự động xác nhận qua VietQR.`,
      expenseId: userExpense.expenseId,
      metadata: { amount: userExpense.amount, auto: true }
    });

    // Cập nhật expense stats
    const allUserExpenses = await UserExpense.find({ expenseId: userExpense.expenseId });
    const paidCount = allUserExpenses.filter(ue => ue.status === 'confirmed').length + 1;
    const allPaid = paidCount >= allUserExpenses.length;

    await Expense.findByIdAndUpdate(userExpense.expenseId, {
      totalPaid: paidCount,
      ...(allPaid ? { status: 'completed' } : {})
    });

    console.log(`✅ Webhook: Đã tự động xác nhận thanh toán cho "${transferContent}"`);

    res.json({
      success: true,
      message: 'Đã tự động xác nhận thanh toán.',
      userExpenseId: userExpense._id
    });
  } catch (error) {
    console.error('VietQR webhook error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route DELETE /api/expenses/:id
 * @desc Admin xóa khoản chi
 * @access Admin only
 */
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const expId = expense._id?.toString() || expense._id;

    // Xóa tất cả UserExpense records
    const userExpenses = await UserExpense.find({ expenseId: expId });
    for (const ue of userExpenses) {
      await UserExpense.findByIdAndDelete(ue._id?.toString() || ue._id);
    }

    // Xóa expense
    await Expense.findByIdAndDelete(expId);

    res.json({
      success: true,
      message: 'Đã xóa khoản chi thành công.'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route GET /api/expenses/:id/qr/:userExpenseId
 * @desc Lấy mã VietQR cho một khoản thanh toán cụ thể
 * @access Authenticated users
 */
export const getQRCode = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi.' });
    }

    const userExpense = await UserExpense.findById(req.params.userExpenseId);
    if (!userExpense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi thanh toán.' });
    }

    const qrUrl = generateVietQRUrl(
      expense.bankCode,
      expense.bankAccount,
      userExpense.amount,
      userExpense.transferContent
    );

    res.json({
      success: true,
      qrUrl,
      transferContent: userExpense.transferContent,
      amount: userExpense.amount,
      bankAccount: expense.bankAccount,
      bankCode: expense.bankCode,
      bankName: expense.bankName
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

/**
 * @route POST /api/expenses/free-deposit
 * @desc Thành viên tự đóng góp/nộp tiền tự do
 * @access Authenticated users
 */
export const createFreeDeposit = async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số tiền hợp lệ (tối thiểu 1.000đ).'
      });
    }

    const userId = req.user._id?.toString() || req.user._id;
    const userName = req.user.name || 'Hội viên';
    const userEmail = req.user.email || '';

    // Tạo một Expense đặc biệt cho khoản đóng góp tự do này
    const expense = await Expense.create({
      title: `Đóng góp tự do - ${userName}`,
      amount: Number(amount),
      description: description || 'Đóng góp tự do vào Quỹ CLB',
      deadline: new Date().toLocaleDateString('en-CA'),
      targetType: 'specific',
      targetMembers: [userId],
      bankAccount: '19036329402018',
      bankCode: 'MB',
      bankName: 'MB Bank',
      createdBy: 'system',
      createdByName: 'Hệ thống',
      totalMembers: 1
    });

    const transferContent = `${expense.code}_${userId}`;

    // Tạo UserExpense
    const userExpense = await UserExpense.create({
      expenseId: expense._id?.toString() || expense._id,
      userId,
      userName,
      userEmail,
      amount: Number(amount),
      transferContent,
      status: 'pending'
    });

    const ueObj = typeof userExpense.toObject === 'function' ? userExpense.toObject() : userExpense;

    res.status(201).json({
      success: true,
      message: 'Tạo khoản đóng góp thành công! Quét QR để nộp tiền.',
      userExpense: {
        ...ueObj,
        expense: {
          title: expense.title,
          description: expense.description,
          deadline: expense.deadline,
          bankAccount: expense.bankAccount,
          bankCode: expense.bankCode,
          bankName: expense.bankName,
          code: expense.code
        },
        qrUrl: generateVietQRUrl(
          expense.bankCode,
          expense.bankAccount,
          userExpense.amount,
          userExpense.transferContent
        )
      }
    });
  } catch (error) {
    console.error('Create free deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi khởi tạo khoản đóng góp.',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/expenses/remind/:expenseId
 * @desc    Gửi thông báo nhắc nợ hàng loạt dưới nền (Admin only)
 * @access  Private (Admin)
 */
export const remindExpenseBulk = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khoản chi/thu.' });
    }

    // Lọc tất cả UserExpense chưa thanh toán
    const pendingExpenses = await UserExpense.find({
      expenseId,
      status: { $in: ['pending', 'rejected'] }
    });

    if (pendingExpenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả thành viên đã thanh toán khoản chi này, không cần gửi nhắc nhở!'
      });
    }

    const taskId = `remind-${expenseId}-${Date.now()}`;

    // Thêm vào taskQueue
    taskQueue.addTask(taskId, async (updateProgress) => {
      updateProgress(10);
      const total = pendingExpenses.length;
      
      for (let i = 0; i < total; i++) {
        const ue = pendingExpenses[i];
        
        // Tạo thông báo nhắc nhở
        await Notification.create({
          userId: ue.userId,
          type: 'expense_reminder',
          title: '⚠️ Nhắc nhở đóng phí',
          message: `Nhắc nhở: Bạn chưa đóng khoản phí "${expense.title}" - ${ue.amount.toLocaleString('vi-VN')}đ. Hạn chót: ${new Date(expense.deadline).toLocaleDateString('vi-VN')}. Vui lòng thanh toán!`,
          expenseId: expense._id,
          metadata: { amount: ue.amount, deadline: expense.deadline, expenseTitle: expense.title }
        });

        // Giả lập độ trễ nhỏ để Admin có thể xem được hiệu ứng tiến độ cập nhật
        await new Promise(resolve => setTimeout(resolve, 50));
        
        updateProgress(Math.round(10 + (i / total) * 90));
      }

      updateProgress(100);
      return { count: total, expenseTitle: expense.title };
    }, {
      type: 'bulk_reminders',
      title: `Gửi nhắc nợ hàng loạt: ${expense.title}`,
      createdBy: req.user?.name || 'Hệ thống'
    });

    res.status(202).json({
      success: true,
      message: `Đã kích hoạt tiến trình nhắc nợ hàng loạt cho ${pendingExpenses.length} thành viên.`,
      taskId
    });
  } catch (error) {
    console.error('remindExpenseBulk error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khởi chạy tác vụ nhắc nợ ngầm.',
      error: error.message
    });
  }
};

/**
 * @route GET /api/expenses/approvals
 * @desc Lấy tất cả các giao dịch user expense để duyệt (Admin)
 * @access Admin only
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const userExpenses = await UserExpense.find({});
    
    // Enrich with expense details
    const enriched = await Promise.all(userExpenses.map(async (ue) => {
      const expense = await Expense.findById(ue.expenseId);
      const ueObj = typeof ue.toObject === 'function' ? ue.toObject() : ue;
      
      return {
        ...ueObj,
        _id: ueObj._id?.toString() || ueObj._id,
        expense: expense ? {
          title: expense.title,
          description: expense.description,
          deadline: expense.deadline,
          bankAccount: expense.bankAccount,
          bankCode: expense.bankCode,
          bankName: expense.bankName,
          code: expense.code,
          status: expense.status,
          createdByName: expense.createdByName,
          createdAt: expense.createdAt
        } : null
      };
    }));

    // Sort by date (updatedAt, paidAt, or createdAt)
    enriched.sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || '';
      const dateB = b.updatedAt || b.createdAt || '';
      return new Date(dateB) - new Date(dateA);
    });

    res.json({
      success: true,
      approvals: enriched
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server.' });
  }
};

