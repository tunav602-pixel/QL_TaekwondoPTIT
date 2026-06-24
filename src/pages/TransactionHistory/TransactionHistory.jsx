import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Clock, CheckCircle, XCircle, AlertCircle, 
  Search, RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldAlert,
  Wallet, Eye, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { BACKEND_URL } from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';
import PaymentModal from '../../components/PaymentModal/PaymentModal';

const TransactionHistory = () => {
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // States for payment
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null); // For bill lightbox

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/my');
      if (res.data.success) {
        setTransactions(res.data.all || []);
      }
    } catch (error) {
      console.error('Fetch transaction history error:', error);
      toast.error('Không thể tải lịch sử giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations
  const stats = transactions.reduce((acc, curr) => {
    acc.totalCount += 1;
    if (curr.status === 'confirmed') {
      acc.totalPaid += Number(curr.amount || 0);
    } else if (curr.status === 'paid') {
      acc.totalPending += Number(curr.amount || 0);
    } else if (curr.status === 'pending' || curr.status === 'rejected') {
      acc.totalUnpaid += Number(curr.amount || 0);
    }
    return acc;
  }, { totalCount: 0, totalPaid: 0, totalPending: 0, totalUnpaid: 0 });

  // Filter & Search Logic
  const filteredTransactions = transactions.filter(t => {
    // Filter Tab
    if (activeTab === 'paid') {
      if (t.status !== 'confirmed') return false;
    } else if (activeTab === 'pending_approval') {
      if (t.status !== 'paid') return false;
    } else if (activeTab === 'unpaid') {
      if (t.status !== 'pending' && t.status !== 'rejected') return false;
    }

    // Search Query
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    const title = (t.expense?.title || '').toLowerCase();
    const content = (t.transferContent || '').toLowerCase();
    
    return title.includes(query) || content.includes(query);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': // Đang chờ duyệt
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'confirmed': // Thành công
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'rejected': // Từ chối
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'pending': // Chưa thanh toán
      default:
        return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Đang chờ duyệt';
      case 'confirmed': return 'Thành công';
      case 'rejected': return 'Từ chối';
      case 'pending':
      default:
        return 'Chưa thanh toán';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <Clock className="w-3.5 h-3.5 animate-pulse" />;
      case 'confirmed': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
      case 'pending':
      default:
        return <Clock className="w-3.5 h-3.5 text-white/20" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full"
    >
      {/* Header Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">
            Lịch Sử Giao Dịch
          </h1>
          <p className="text-sm text-blue-100/90 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">
            Theo dõi tất cả khoản phí cá nhân, hóa đơn và trạng thái đóng quỹ của bạn.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Đã Đóng</p>
          <p className="text-xl font-black mt-1 text-emerald-400">
            {stats.totalPaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Chờ Duyệt</p>
          <p className="text-xl font-black mt-1 text-amber-400">
            {stats.totalPending.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Chưa Đóng</p>
          <p className="text-xl font-black mt-1 text-red-400">
            {stats.totalUnpaid.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Giao Dịch</p>
          <p className="text-xl font-black mt-1 text-white/80">{stats.totalCount}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 p-4 rounded-2xl border border-white/5 bg-[#0f172a]/30 backdrop-blur-md">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'paid', label: 'Đã đóng' },
            { id: 'pending_approval', label: 'Chờ duyệt' },
            { id: 'unpaid', label: 'Chưa đóng' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-[1.03]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Tìm theo khoản thu, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-2xl p-16 text-center border border-white/5 bg-[#0f172a]/30">
          <Wallet className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-sm font-semibold text-white/40">Không tìm thấy giao dịch nào</p>
          <p className="text-xs text-white/20 mt-1">Khi bạn đóng phí hoặc có khoản thu mới, thông tin sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((tx) => {
              const hasBill = !!tx.billImageUrl;
              const dateVal = tx.paidAt || tx.createdAt || '';
              const isUnpaid = tx.status === 'pending' || tx.status === 'rejected';

              return (
                <motion.div
                  key={tx._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="rounded-xl border border-white/5 bg-[#0f172a]/35 hover:bg-[#0f172a]/55 hover:border-white/10 transition-all p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                      tx.status === 'confirmed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' 
                        : tx.status === 'paid'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/10'
                          : tx.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/10'
                            : 'bg-white/5 text-white/40 border-white/5'
                    }`}>
                      {tx.status === 'confirmed' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-white">{tx.expense?.title || 'Đóng phí'}</h4>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          {getStatusLabel(tx.status)}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 font-semibold">
                        Mã nội dung: <span className="font-mono text-white/60">{tx.transferContent || tx._id}</span>
                        {dateVal && ` • Ngày: ${new Date(dateVal).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
                      </p>

                      {tx.status === 'rejected' && tx.adminNote && (
                        <div className="text-[10px] p-2 rounded-lg border border-red-500/15 bg-red-500/5 text-red-300 font-semibold">
                          ⚠️ Lý do từ chối: {tx.adminNote}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 gap-2 flex-shrink-0">
                    <span className="text-sm font-black text-white">
                      {(tx.amount || 0).toLocaleString('vi-VN')}đ
                    </span>

                    <div className="flex items-center gap-2">
                      {/* View bill if uploaded */}
                      {hasBill && (
                        <button
                          onClick={() => setSelectedBill(tx.billImageUrl)}
                          className="flex items-center gap-1 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/80 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                        >
                          <Eye className="w-3 h-3" /> Xem Bill
                        </button>
                      )}

                      {/* Pay button if unpaid/rejected */}
                      {isUnpaid && (
                        <button
                          onClick={() => {
                            setSelectedExpense(tx);
                            setIsPaymentOpen(true);
                          }}
                          className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm shadow-blue-500/10"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Thanh toán
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Bill Lightbox Modal */}
      <AnimatePresence>
        {selectedBill && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBill(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-zoom-out"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl z-10 bg-[#0f172a]"
            >
              <img
                src={selectedBill.startsWith('http') ? selectedBill : `${BACKEND_URL}${selectedBill}`}
                alt="Payment Bill"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="p-3 border-t border-white/5 bg-[#0a0f1d] flex justify-between items-center">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Hóa Đơn Minh Chứng</span>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="bg-white/5 hover:bg-white/10 text-white/80 px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal Integration */}
      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedExpense(null);
        }}
        userExpense={selectedExpense}
        onPaymentSuccess={() => {
          fetchTransactions();
          toast.success("Cập nhật trạng thái giao dịch!");
        }}
      />
    </motion.div>
  );
};

export default TransactionHistory;
