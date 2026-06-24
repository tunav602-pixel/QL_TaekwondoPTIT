import Transaction from '../models/Transaction.js';
import fs from 'fs';
import path from 'path';
import { taskQueue } from '../utils/taskQueueManager.js';


/**
 * @route   GET /api/transactions
 * @desc    Lấy danh sách giao dịch — hỗ trợ lọc theo year, month
 * @access  Private
 */
export const getAllTransactions = async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = {};

    if (year && month) {
      // Filter by specific month: date starts with "YYYY-MM"
      const monthStr = month.toString().padStart(2, '0');
      query.date = { $regex: `^${year}-${monthStr}` };
    } else if (year) {
      // Filter by year only
      query.date = { $regex: `^${year}` };
    }

    const transactions = await Transaction.find(query);
    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('getAllTransactions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   POST /api/transactions
 * @desc    Thêm giao dịch mới (Admin only)
 * @access  Private (Admin)
 */
export const addTransaction = async (req, res) => {
  try {
    const { date, description, amount, type, category, person } = req.body;

    if (!date || !description || !amount || !type || !category || !person) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin giao dịch.'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại giao dịch không hợp lệ (income/expense).'
      });
    }

    const transaction = await Transaction.create({
      date,
      description,
      amount: Number(amount),
      type,
      category,
      person,
      quantity: Number(req.body.quantity) || 1,
      unitPrice: Number(req.body.unitPrice) || 0,
      createdBy: req.user._id?.toString() || req.user.id || ''
    });

    res.status(201).json({
      success: true,
      message: 'Đã thêm giao dịch thành công!',
      transaction
    });
  } catch (error) {
    console.error('addTransaction error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Xóa giao dịch (Admin only)
 * @access  Private (Admin)
 */
export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch.'
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa giao dịch thành công!'
    });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   GET /api/transactions/stats
 * @desc    Thống kê thu chi theo năm — trả về 12 tháng với logic cộng dồn lũy tiến
 * @access  Private
 * 
 * Logic cộng dồn:
 *   Tồn quỹ tháng N = Tồn quỹ tháng (N-1) + Thu tháng N - Chi tháng N
 */
export const getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear().toString();

    // Lấy tất cả giao dịch trong năm
    const allTransactions = await Transaction.find({
      date: { $regex: `^${targetYear}` }
    });

    // Tính toán cho từng tháng
    const monthlyData = [];
    let carryOver = 0; // Số dư cộng dồn từ tháng trước

    // Lấy tồn quỹ từ năm trước (nếu có)
    const previousYear = (parseInt(targetYear) - 1).toString();
    const prevYearTransactions = await Transaction.find({
      date: { $regex: `^${previousYear}` }
    });

    // Tính tổng tồn quỹ năm trước
    let prevYearBalance = 0;
    prevYearTransactions.forEach(t => {
      if (t.type === 'income') prevYearBalance += Number(t.amount);
      if (t.type === 'expense') prevYearBalance -= Number(t.amount);
    });
    carryOver = prevYearBalance;

    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const prefix = `${targetYear}-${monthStr}`;

      // Lọc giao dịch của tháng này
      const monthTransactions = allTransactions.filter(t =>
        t.date && t.date.startsWith(prefix)
      );

      let income = 0;
      let expense = 0;
      monthTransactions.forEach(t => {
        if (t.type === 'income') income += Number(t.amount);
        if (t.type === 'expense') expense += Number(t.amount);
      });

      const balance = carryOver + income - expense;

      monthlyData.push({
        month,
        monthLabel: `Tháng ${month}`,
        income,
        expense,
        carryOverFromPrevMonth: carryOver,
        balance,
        transactionCount: monthTransactions.length
      });

      // Cập nhật carry over cho tháng tiếp theo
      carryOver = balance;
    }

    // Tổng cả năm
    const yearTotals = {
      totalIncome: monthlyData.reduce((sum, m) => sum + m.income, 0),
      totalExpense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
      finalBalance: carryOver,
      prevYearCarryOver: prevYearBalance
    };

    res.json({
      success: true,
      year: targetYear,
      monthlyData,
      yearTotals
    });
  } catch (error) {
    console.error('getMonthlyStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

/**
 * @route   POST /api/transactions/migrate
 * @desc    Migrate giao dịch từ localStorage lên server (chạy 1 lần)
 * @access  Private
 */
export const migrateFromLocalStorage = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để migrate.'
      });
    }

    // Kiểm tra nếu đã có dữ liệu trên server → không migrate lại
    const existingCount = await Transaction.countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: 'Server đã có dữ liệu. Bỏ qua migration.',
        migrated: 0
      });
    }

    // Map dữ liệu từ format localStorage sang model
    const migrateData = transactions.map(t => ({
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      person: t.person,
      createdBy: req.user._id?.toString() || req.user.id || ''
    }));

    const inserted = await Transaction.insertMany(migrateData);

    res.status(201).json({
      success: true,
      message: `Đã migrate ${inserted.length} giao dịch thành công!`,
      migrated: inserted.length
    });
  } catch (error) {
    console.error('migrateFromLocalStorage error:', error);
    res.status(500).json({ success: false, message: 'Lỗi migrate dữ liệu.' });
  }
};

/**
 * @route   POST /api/transactions/export
 * @desc    Xuất báo cáo giao dịch ra CSV dưới nền (Admin only)
 * @access  Private (Admin)
 */
export const exportTransactions = async (req, res) => {
  try {
    const { year, month } = req.query;
    const taskId = `export-tx-${Date.now()}`;
    const userRole = req.user?.role;

    if (userRole !== 'Super-Admin' && userRole !== 'Sub-Admin') {
      return res.status(403).json({ success: false, message: 'Chỉ Admin mới có quyền xuất báo cáo.' });
    }

    // Khởi động task nền
    taskQueue.addTask(taskId, async (updateProgress) => {
      // Tiến trình 10%: Truy vấn DB
      updateProgress(10);
      let query = {};
      if (year && month) {
        const monthStr = month.toString().padStart(2, '0');
        query.date = { $regex: `^${year}-${monthStr}` };
      } else if (year) {
        query.date = { $regex: `^${year}` };
      }
      
      const transactions = await Transaction.find(query).sort({ date: -1 });
      
      // Tiến trình 40%: Chuẩn bị dữ liệu CSV
      updateProgress(40);
      
      // BOM để mở bằng Excel không lỗi hiển thị tiếng Việt
      let csvContent = '\uFEFF'; 
      csvContent += 'Ngày,Nội dung,Danh mục,Loại,Số tiền (VNĐ),Số lượng,Đơn giá (VNĐ),Người thực hiện\n';
      
      const total = transactions.length;
      if (total > 0) {
        for (let i = 0; i < total; i++) {
          const t = transactions[i];
          const dateFormatted = t.date || '';
          const description = `"${(t.description || '').replace(/"/g, '""')}"`;
          const category = `"${(t.category || '').replace(/"/g, '""')}"`;
          const typeLabel = t.type === 'income' ? 'Thu' : 'Chi';
          const amount = t.amount || 0;
          const quantity = t.quantity || 1;
          const unitPrice = t.unitPrice || 0;
          const person = `"${(t.person || '').replace(/"/g, '""')}"`;
          
          csvContent += `${dateFormatted},${description},${category},${typeLabel},${amount},${quantity},${unitPrice},${person}\n`;
          
          // Tiến trình tăng dần từ 40% đến 80%
          if (i % 5 === 0 || i === total - 1) {
            updateProgress(Math.round(40 + (i / total) * 40));
          }
          
          // Giả lập xử lý nhanh để có hiệu ứng progress bar
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } else {
        updateProgress(80);
      }
      
      // Tiến trình 85%: Lưu file
      updateProgress(85);
      const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filename = `bao-cao-tai-chinh-${year || 'all'}-${month || 'all'}-${Date.now()}.csv`;
      const filePath = path.join(reportsDir, filename);
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      // Tiến trình 100%: Hoàn thành
      updateProgress(100);
      
      // Trả về kết quả là đường dẫn tải file tĩnh
      const downloadUrl = `/uploads/reports/${filename}`;
      return { downloadUrl, filename, count: total };
    }, {
      type: 'export_transactions',
      title: `Xuất báo cáo tài chính ${month ? `Tháng ${month}/` : ''}${year || 'tất cả'}`,
      createdBy: req.user?.name || 'Hệ thống'
    });

    res.status(202).json({
      success: true,
      message: 'Tác vụ xuất báo cáo đã được khởi chạy ngầm.',
      taskId
    });
  } catch (error) {
    console.error('exportTransactions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khởi chạy tác vụ xuất báo cáo.' });
  }
};

