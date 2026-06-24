import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Trash2, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/axios';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';

const CATEGORY_DETAILS = {
  'Học phí tháng': { emoji: '🎓', color: 'indigo' },
  'Quỹ CLB': { emoji: '🏆', color: 'amber' },
  'Mua Võ phục & Đai': { emoji: '🥋', color: 'teal' },
  'Chi phí Sự kiện (Camp 26/3, Big Game)': { emoji: '⛺', color: 'purple' },
  'Thuê sân bãi': { emoji: '🏟️', color: 'blue' },
  'Khác': { emoji: '⚙️', color: 'slate' }
};

const Transactions = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  
  // RBAC: Chỉ Admin (Super-Admin, Sub-Admin) mới có quyền xóa giao dịch
  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';
  
  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Không thể tải danh sách giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        const res = await api.delete(`/transactions/${deleteId}`);
        if (res.data.success) {
          setTransactions(prev => prev.filter(t => (t._id || t.id) !== deleteId));
          toast.success("Đã xóa giao dịch thành công!");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi xóa giao dịch.');
      } finally {
        setDeleteId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm mt-4">Đang tải lịch sử giao dịch...</p>
      </div>
    );
  }

  return (
    <ScrollReveal direction="up" duration={0.5}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">📋 Lịch sử Giao Dịch</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="py-4 px-6 font-bold">Ngày</th>
                <th className="py-4 px-6 font-bold">Nội dung</th>
                <th className="py-4 px-6 font-bold">Danh mục</th>
                <th className="py-4 px-6 font-bold text-right">Số tiền</th>
                <th className="py-4 px-6 font-bold">Người TH</th>
                {/* Chỉ hiện cột Xóa cho Admin */}
                {isAdmin && <th className="py-4 px-6 font-bold text-center">Xóa</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-gray-400">Chưa có giao dịch nào</td>
                </tr>
              ) : (
                transactions.map((item, idx) => (
                  <motion.tr 
                    key={item._id || item.id} 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.35 }}
                    className="table-row-hover border-b border-gray-100/50 group"
                  >
                    <td className="py-3 px-6 text-sm text-gray-500 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="py-3 px-6">
                      <p className="text-sm font-semibold text-gray-800">{item.description}</p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          Số lượng: {item.quantity} × {formatMoney(item.unitPrice || (item.amount / item.quantity))}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      {(() => {
                        const catDetail = CATEGORY_DETAILS[item.category] || { emoji: '📂', color: 'slate' };
                        const colorMap = {
                          indigo: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                          amber: 'bg-amber-50 text-amber-700 border-amber-150',
                          teal: 'bg-teal-50 text-teal-700 border-teal-150',
                          purple: 'bg-purple-50 text-purple-700 border-purple-150',
                          blue: 'bg-blue-50 text-blue-700 border-blue-150',
                          slate: 'bg-slate-50 text-slate-700 border-slate-150'
                        };
                        const colorClass = colorMap[catDetail.color] || 'bg-gray-50 text-gray-600 border-gray-150';
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-bold whitespace-nowrap shadow-sm/5 transition-all duration-300 ${colorClass}`}>
                            <span>{catDetail.emoji}</span>
                            <span>{item.category}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className={`py-3 px-6 text-sm font-bold text-right whitespace-nowrap ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${item.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500 whitespace-nowrap font-medium">{item.person}</td>
                    {/* Chỉ hiện nút Xóa cho Admin */}
                    {isAdmin && (
                      <td className="py-3 px-6 text-center">
                        <button 
                          onClick={() => setDeleteId(item._id || item.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Centered Confirm Delete Modal */}
        {deleteId !== null && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 flex flex-col items-center text-center gap-5"
            >
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 leading-relaxed px-2">
                  Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setDeleteId(null)} 
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:shadow-xl hover:shadow-red-200 transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
};


export default Transactions;
