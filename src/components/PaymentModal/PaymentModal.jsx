import React, { useState } from 'react';
import { X, QrCode, Upload, CheckCircle, Clock, AlertCircle, CreditCard, Copy, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../lib/axios';
import bankingQr from '../../assets/banking.jpg';

const PaymentModal = ({ isOpen, onClose, userExpense, onPaymentSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [copied, setCopied] = useState('');

  if (!isOpen || !userExpense) return null;

  const { expense, qrUrl, transferContent, amount } = userExpense;

  const handleBillChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không quá 5MB');
        return;
      }
      setBillFile(file);
      setBillPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (billFile) {
        formData.append('bill', billFile);
      }

      await api.put(`/expenses/pay/${userExpense._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Đã đánh dấu thanh toán! Chờ Admin xác nhận.');
      setBillFile(null);
      setBillPreview(null);
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
            <Clock className="w-3 h-3" /> Chờ thanh toán
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <CheckCircle className="w-3 h-3" /> Đã xác nhận
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/50">
            <AlertCircle className="w-3 h-3" /> Bị từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const isPending = userExpense.status === 'pending' || userExpense.status === 'rejected';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-white/10 animate-fadeIn text-gray-800 dark:text-white transition-colors duration-500">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900/60 dark:to-indigo-900/60 rounded-t-2xl flex items-center justify-between border-b dark:border-white/5">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Thanh toán QR
            </h2>
            <p className="text-blue-100 text-xs mt-0.5">{expense?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex justify-center">
            {getStatusBadge(userExpense.status)}
          </div>

          {/* QR Code */}
          {isPending && (
            <div className="flex justify-center py-2 bg-gray-50/50 dark:bg-white/[0.05] rounded-2xl border border-gray-150/50 dark:border-white/10 shadow-inner">
              <img
                src={bankingQr}
                alt="Banking QR Code"
                className="w-full max-w-[340px] h-auto object-contain rounded-2xl hover:scale-[1.01] transition-transform duration-300 shadow-sm"
              />
            </div>
          )}

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Số tiền</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {(amount || 0).toLocaleString('vi-VN')}đ
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-emerald-350 dark:text-emerald-600" />
            </div>

            {/* Bank Info */}
            {expense?.bankAccount && (
              <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4 space-y-2.5 border border-gray-100 dark:border-white/10 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Số tài khoản</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{expense.bankAccount}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(expense.bankAccount, 'account')}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copied === 'account' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Ngân hàng</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90 mt-0.5">{expense.bankName || expense.bankCode}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Nội dung CK</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-0.5 font-mono">{transferContent}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(transferContent, 'content')}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {copied === 'content' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Deadline */}
            {expense?.deadline && (
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-wider">Hạn chót</p>
                <p className="text-sm font-bold text-red-600 mt-0.5">
                  {new Date(expense.deadline).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          {/* Upload Bill */}
          {isPending && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider">Ảnh minh chứng (tùy chọn)</p>
              <label className="block w-full border-2 border-dashed border-gray-250 dark:border-white/15 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/10 transition-all">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleBillChange}
                  className="hidden"
                />
                {billPreview ? (
                  <img src={billPreview} alt="Bill preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Upload className="w-6 h-6 text-gray-300" />
                    <p className="text-xs text-gray-400 dark:text-white/40 font-medium">Nhấn để tải lên ảnh bill chuyển khoản</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Admin Note (if rejected) */}
          {userExpense.status === 'rejected' && userExpense.adminNote && (
            <div className="bg-red-50 dark:bg-red-500/15 border border-red-200/50 dark:border-red-500/25 rounded-xl p-4">
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Lý do từ chối</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{userExpense.adminNote}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isPending && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleSubmitPayment}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Xác nhận đã chuyển
                </>
              )}
            </button>
          </div>
        )}

        {userExpense.status === 'paid' && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
            <div className="bg-blue-50 dark:bg-blue-500/10 border dark:border-blue-500/20 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">⏳ Đang chờ Admin xác nhận thanh toán của bạn...</p>
            </div>
          </div>
        )}

        {userExpense.status === 'confirmed' && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border dark:border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">✅ Thanh toán đã được xác nhận thành công!</p>
              {userExpense.confirmedAt && (
                <p className="text-[10px] text-emerald-500 dark:text-emerald-400 mt-1">
                  Ngày xác nhận: {new Date(userExpense.confirmedAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
