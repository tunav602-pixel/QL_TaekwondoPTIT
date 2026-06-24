import React, { useState } from 'react';
import { X, Coins, Wallet, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/axios';

const FreePaymentModal = ({ isOpen, onClose, onDepositCreated }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const quickAmounts = [20000, 50000, 100000, 200000, 500000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      toast.error('Số tiền tối thiểu phải là 1.000đ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/expenses/free-deposit', {
        amount: numAmount,
        description: description || 'Đóng góp tự do vào Quỹ CLB'
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Khởi tạo khoản đóng góp thành công!');
        onClose();
        if (onDepositCreated) {
          // Trực tiếp mở PaymentModal với UserExpense vừa tạo
          onDepositCreated(res.data.userExpense);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-white/10 transition-colors duration-500">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900/60 dark:via-indigo-900/50 dark:to-purple-900/60 text-white relative border-b dark:border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <Coins className="w-5.5 h-5.5" /> Nộp tiền / Đóng góp tự do
          </h3>
          <p className="text-xs text-blue-100/90 mt-1 font-medium">Nhập số tiền và nội dung để sinh mã QR chuyển khoản động.</p>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Số tiền nộp (VNĐ) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền (VD: 100000)"
                min="1000"
                className="w-full p-4 pl-5 border-2 border-gray-150 dark:border-white/15 bg-gray-50 dark:bg-white/[0.07] focus:bg-white dark:focus:bg-white/[0.1] rounded-2xl outline-none text-lg font-black text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500/80 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 dark:text-white/50">đ</span>
            </div>
          </div>

          {/* Quick Amount Tags */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map(val => (
              <button
                type="button"
                key={val}
                onClick={() => setAmount(val.toString())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  amount === val.toString()
                    ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500/30 dark:text-blue-300 dark:border-blue-500/40 shadow-md shadow-blue-500/20'
                    : 'bg-gray-50 dark:bg-white/[0.06] text-gray-500 dark:text-white/60 border-gray-150 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/35 hover:bg-blue-50/30'
                }`}
              >
                {val.toLocaleString('vi-VN')}đ
              </button>
            ))}
          </div>

          {/* Note Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Nội dung nộp phí / Ghi chú
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Đóng quỹ tháng 5, nộp tiền võ phục hè..."
              rows={2}
              className="w-full p-3 border-2 border-gray-150 dark:border-white/15 bg-gray-50 dark:bg-white/[0.07] focus:bg-white dark:focus:bg-white/[0.1] rounded-xl outline-none text-sm font-semibold text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500/80 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 transition-all resize-none"
            />
          </div>

          <div className="flex items-start gap-2 bg-blue-50/50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/25 rounded-xl p-3 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>Hệ thống sẽ tự động tạo mã hóa đơn và QR VietQR động. Bạn chỉ cần quét QR để chuyển khoản. Khi tiền về, quỹ CLB sẽ tự động cập nhật số dư!</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-600/25 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Tạo mã VietQR <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FreePaymentModal;
