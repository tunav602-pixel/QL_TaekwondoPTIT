import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, Trash2, Eye, CheckCircle, XCircle, Clock, Users,
  CreditCard, Calendar, FileText, ChevronDown, ChevronUp, AlertCircle,
  Receipt, QrCode, TrendingUp, X, Check, Ban, Bell
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/axios';
import useTaskStore from '../../store/useTaskStore';
import useThemeStore from '../../store/useThemeStore';

// Danh sách ngân hàng phổ biến
const BANK_LIST = [
  { code: 'MB', name: 'MB Bank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VTB', name: 'VietinBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'LPB', name: 'LienVietPostBank' },
  { code: 'SEAB', name: 'SeABank' }
];

const ExpenseManagement = () => {
  const { isDarkMode } = useThemeStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [expenseDetail, setExpenseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    description: '',
    deadline: '',
    targetType: 'all',
    targetMembers: [],
    bankAccount: '',
    bankCode: 'MB',
    bankName: 'MB Bank'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchMembers();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      if (res.data.success) {
        setExpenses(res.data.expenses);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
      toast.error('Không thể tải danh sách khoản chi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/users/members');
      if (res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (error) {
      console.error('Fetch members error:', error);
    }
  };

  const fetchExpenseDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/expenses/${id}`);
      if (res.data.success) {
        setExpenseDetail(res.data);
      }
    } catch (error) {
      console.error('Fetch detail error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.deadline || !formData.bankAccount) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount)
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCreateForm(false);
        setFormData({
          title: '', amount: '', description: '', deadline: '',
          targetType: 'all', targetMembers: [],
          bankAccount: '', bankCode: 'MB', bankName: 'MB Bank'
        });
        fetchExpenses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khoản chi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (userExpenseId) => {
    try {
      const res = await api.put(`/expenses/confirm/${userExpenseId}`);
      if (res.data.success) {
        toast.success('Đã xác nhận thanh toán!');
        if (expandedExpense) fetchExpenseDetail(expandedExpense);
        fetchExpenses();
      }
    } catch (error) {
      toast.error('Lỗi xác nhận thanh toán.');
    }
  };

  const handleRejectPayment = async (userExpenseId) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;

    try {
      const res = await api.put(`/expenses/reject/${userExpenseId}`, { adminNote: reason || 'Không hợp lệ' });
      if (res.data.success) {
        toast.success('Đã từ chối thanh toán.');
        if (expandedExpense) fetchExpenseDetail(expandedExpense);
        fetchExpenses();
      }
    } catch (error) {
      toast.error('Lỗi từ chối thanh toán.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa khoản chi này? Tất cả dữ liệu liên quan sẽ bị xóa.')) return;

    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa khoản chi.');
        setExpandedExpense(null);
        setExpenseDetail(null);
        fetchExpenses();
      }
    } catch (error) {
      toast.error('Lỗi xóa khoản chi.');
    }
  };

  const handleSendReminders = async (expenseId) => {
    try {
      const res = await api.post(`/expenses/remind/${expenseId}`);
      if (res.data.success) {
        toast.success("Tác vụ nhắc nợ hàng loạt đã khởi chạy ngầm! Kiểm tra tiến trình ở icon tác vụ (Activity) góc trên.");
        useTaskStore.getState().startPolling();
      }
    } catch (error) {
      console.error('Send reminders error:', error);
      toast.error(error.response?.data?.message || 'Lỗi khởi chạy nhắc nợ hàng loạt.');
    }
  };

  const handleBankChange = (bankCode) => {
    const bank = BANK_LIST.find(b => b.code === bankCode);
    setFormData({
      ...formData,
      bankCode,
      bankName: bank?.name || ''
    });
  };

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      targetMembers: prev.targetMembers.includes(memberId)
        ? prev.targetMembers.filter(id => id !== memberId)
        : [...prev.targetMembers, memberId]
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Đang thu';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto w-full"
    >
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">
            Quản lý Phí & Khoản Thu
          </h1>
          <p className="text-sm text-blue-100/90 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">
            Tạo khoản chi, theo dõi thanh toán và đối soát tự động qua VietQR.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? 'Đóng form' : 'Tạo khoản chi'}
        </button>
      </div>

      {/* ===== CREATE FORM ===== */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 theme-card"
        >
          <h3 className={`text-lg font-bold flex items-center gap-2 mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Plus className="w-5 h-5 text-blue-500" /> Tạo khoản chi / thu mới
          </h3>

          <form onSubmit={handleCreateExpense} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Tên khoản chi *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Phí quỹ tháng 6"
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-input"
                  required
                />
              </div>

              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Số tiền (VNĐ) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="VD: 50000"
                  min="1000"
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-input"
                  required
                />
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Hạn chót *
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-input"
                  required
                />
              </div>

              {/* Bank Code */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Ngân hàng *
                </label>
                <select
                  value={formData.bankCode}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-select"
                >
                  {BANK_LIST.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>
                  ))}
                </select>
              </div>

              {/* Bank Account */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Số tài khoản ngân hàng *
                </label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="VD: 0123456789"
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-input"
                  required
                />
              </div>

              {/* Target Type */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Áp dụng cho
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 theme-select"
                >
                  <option value="all">Tất cả thành viên</option>
                  <option value="specific">Chỉ định cụ thể</option>
                </select>
              </div>
            </div>

            {/* Target Members List */}
            {formData.targetType === 'specific' && (
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Chọn thành viên
                </label>
                <div className={`max-h-40 overflow-y-auto border rounded-xl p-3 space-y-1.5
                  ${isDarkMode ? 'bg-[#0f172a]/30 border-white/10 text-white' : 'border-gray-200 bg-white'}`}>
                  {members.length === 0 ? (
                    <p className="text-xs text-gray-400">Không tìm thấy thành viên nào.</p>
                  ) : (
                    members.map(m => (
                      <label
                        key={m._id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-sm transition-colors
                          ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.targetMembers.includes(m._id)}
                          onChange={() => handleMemberToggle(m._id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`font-medium ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>{m.name}</span>
                        <span className="text-gray-400 text-xs">({m.email})</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[10px] text-gray-400">
                  Đã chọn: {formData.targetMembers.length} thành viên
                </p>
              </div>
            )}

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả chi tiết về khoản chi..."
                rows={3}
                className="w-full p-3 rounded-xl outline-none text-sm font-semibold focus:ring-4 focus:ring-blue-50/50 resize-none theme-input"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className={`px-5 py-2.5 border rounded-xl text-sm font-semibold transition-colors cursor-pointer
                  ${isDarkMode ? 'border-white/10 text-white/60 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-4 h-4" /> Tạo & Gửi thông báo
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ===== STATS SUMMARY & FILTER TABS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* All */}
        <div 
          onClick={() => setActiveFilter('all')}
          className={`p-4 text-center rounded-xl transition-all duration-300 theme-card tab-card-btn tab-card-all ${
            activeFilter === 'all' ? 'active' : ''
          }`}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng khoản chi</p>
          <p className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{expenses.length}</p>
        </div>

        {/* Active (Đang thu) */}
        <div 
          onClick={() => setActiveFilter('active')}
          className={`p-4 text-center rounded-xl transition-all duration-300 theme-card tab-card-btn tab-card-active ${
            activeFilter === 'active' ? 'active' : ''
          }`}
        >
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Đang thu</p>
          <p className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            {expenses.filter(e => e.status === 'active').length}
          </p>
        </div>

        {/* Completed (Hoàn thành) */}
        <div 
          onClick={() => setActiveFilter('completed')}
          className={`p-4 text-center rounded-xl transition-all duration-300 theme-card tab-card-btn tab-card-completed ${
            activeFilter === 'completed' ? 'active' : ''
          }`}
        >
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Hoàn thành</p>
          <p className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {expenses.filter(e => e.status === 'completed').length}
          </p>
        </div>

        {/* Cancelled (Đã hủy) */}
        <div 
          onClick={() => setActiveFilter('cancelled')}
          className={`p-4 text-center rounded-xl transition-all duration-300 theme-card tab-card-btn tab-card-cancelled ${
            activeFilter === 'cancelled' ? 'active' : ''
          }`}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đã hủy</p>
          <p className={`text-2xl font-black mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
            {expenses.filter(e => e.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* ===== EXPENSES LIST ===== */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl p-12 text-center theme-card">
            <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Chưa có khoản chi nào</p>
            <p className="text-xs text-gray-300 mt-1">Nhấn "Tạo khoản chi" để bắt đầu</p>
          </div>
        ) : expenses.filter(e => activeFilter === 'all' || e.status === activeFilter).length === 0 ? (
          <div className="rounded-2xl p-12 text-center theme-card animate-fadeIn">
            <Wallet className="w-12 h-12 text-blue-400/50 mx-auto mb-4 animate-float" />
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
              Không tìm thấy khoản chi nào khớp với bộ lọc
            </p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng chọn trạng thái khác</p>
          </div>
        ) : (
          expenses
            .filter(e => activeFilter === 'all' || e.status === activeFilter)
            .map((expense) => {
            const expId = expense._id;
            const isExpanded = expandedExpense === expId;

            return (
              <motion.div
                key={expId}
                layout
                className="rounded-2xl overflow-hidden hover:shadow-md transition-all theme-card"
              >
                {/* Expense Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedExpense(null);
                      setExpenseDetail(null);
                    } else {
                      setExpandedExpense(expId);
                      fetchExpenseDetail(expId);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{expense.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(expense.status)}`}>
                          {getStatusLabel(expense.status)}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                        {expense.description && `${expense.description} • `}
                        Hạn: {expense.deadline ? new Date(expense.deadline).toLocaleDateString('vi-VN') : '-'}
                        {expense.code && ` • Mã: ${expense.code}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Progress */}
                      <div className="text-right hidden sm:block">
                        <p className={`text-lg font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                          {(expense.amount || 0).toLocaleString('vi-VN')}đ
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                              style={{ width: `${expense.stats?.progress || 0}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                            {expense.stats?.paid || 0}/{expense.stats?.total || 0}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-300" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}
                  >
                    {detailLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      </div>
                    ) : expenseDetail ? (
                      <div className="p-5">
                        {/* Actions */}
                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={() => handleSendReminders(expId)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border shadow-sm
                              ${isDarkMode 
                                ? 'text-amber-400 border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20' 
                                : 'text-amber-600 border-amber-100/80 hover:bg-amber-50'}`}
                          >
                            <Bell className="w-3.5 h-3.5" /> Nhắc nợ hàng loạt
                          </button>

                          <button
                            onClick={() => handleDeleteExpense(expId)}
                            className="text-xs font-semibold text-red-500 hover:bg-red-550/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </div>

                        {/* User Expenses Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className={`border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                                <th className={`text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Thành viên</th>
                                <th className={`text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Số tiền</th>
                                <th className={`text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Trạng thái</th>
                                <th className={`text-left py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Nội dung CK</th>
                                <th className={`text-right py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Hành động</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(expenseDetail.userExpenses || []).map((ue) => (
                                <tr key={ue._id} className={`border-b transition-colors ${isDarkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-50 hover:bg-gray-50/50'}`}>
                                  <td className="py-3 px-3">
                                    <p className={`font-semibold text-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{ue.userName}</p>
                                    <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{ue.userEmail}</p>
                                  </td>
                                  <td className={`py-3 px-3 text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-gray-800'}`}>
                                    {(ue.amount || 0).toLocaleString('vi-VN')}đ
                                  </td>
                                  <td className="py-3 px-3">
                                    {ue.status === 'pending' && (
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                        <Clock className="w-3 h-3" /> Chờ thanh toán
                                      </span>
                                    )}
                                    {ue.status === 'paid' && (
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                        <Clock className="w-3 h-3" /> Chờ xác nhận
                                      </span>
                                    )}
                                    {ue.status === 'confirmed' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                        <CheckCircle className="w-3 h-3" /> Đã xác nhận
                                      </span>
                                    )}
                                    {ue.status === 'rejected' && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500">
                                        <AlertCircle className="w-3 h-3" /> Từ chối
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    <code className={`text-[10px] px-2 py-0.5 rounded font-mono ${isDarkMode ? 'bg-white/5 text-white/70' : 'bg-gray-50 text-gray-600'}`}>
                                      {ue.transferContent}
                                    </code>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {ue.status === 'paid' ? (
                                      <div className="flex items-center gap-1.5 justify-end">
                                        <button
                                          onClick={() => handleConfirmPayment(ue._id)}
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1
                                            ${isDarkMode ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                        >
                                          <Check className="w-3 h-3" /> Xác nhận
                                        </button>
                                        <button
                                          onClick={() => handleRejectPayment(ue._id)}
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1
                                            ${isDarkMode ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        >
                                          <Ban className="w-3 h-3" /> Từ chối
                                        </button>
                                      </div>
                                    ) : (ue.status === 'pending' || ue.status === 'rejected') ? (
                                      <div className="flex items-center justify-end">
                                        <button
                                          onClick={() => {
                                            if (confirm(`Xác nhận nộp tiền mặt/chuyển khoản thủ công cho ${ue.userName} - số tiền ${ue.amount.toLocaleString('vi-VN')}đ?`)) {
                                              handleConfirmPayment(ue._id);
                                            }
                                          }}
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1
                                            ${isDarkMode ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                        >
                                          <Check className="w-3.5 h-3.5" /> Duyệt thủ công
                                        </button>
                                      </div>
                                    ) : ue.status === 'confirmed' ? (
                                      <p className="text-[10px] text-gray-400 font-bold">
                                        {ue.paidAt ? new Date(ue.paidAt).toLocaleDateString('vi-VN') : 'Đã duyệt'}
                                      </p>
                                    ) : (
                                      <span className="text-[10px] text-gray-300">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default ExpenseManagement;
