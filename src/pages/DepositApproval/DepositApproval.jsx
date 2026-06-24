import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, Clock, Eye, Search, ShieldAlert, 
  Check, Ban, AlertCircle, RefreshCw, FileText, Calendar, Mail
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { BACKEND_URL } from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';

const DepositApproval = () => {
  const { isDarkMode } = useThemeStore();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('paid'); // Default to 'Chờ duyệt'
  const [selectedBill, setSelectedBill] = useState(null); // For lightbox modal
  
  // State for rejection modal
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses/approvals');
      if (res.data.success) {
        setApprovals(res.data.approvals || []);
      }
    } catch (error) {
      console.error('Fetch approvals error:', error);
      toast.error('Không thể tải danh sách giao dịch cần duyệt.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, userName, amount) => {
    if (!confirm(`Xác nhận duyệt giao dịch của ${userName} với số tiền ${amount.toLocaleString('vi-VN')}đ?`)) {
      return;
    }
    try {
      const res = await api.put(`/expenses/confirm/${id}`);
      if (res.data.success) {
        toast.success(`Đã duyệt giao dịch cho ${userName}!`);
        fetchApprovals();
      }
    } catch (error) {
      console.error('Confirm error:', error);
      toast.error('Lỗi xác nhận duyệt giao dịch.');
    }
  };

  const openRejectModal = (id) => {
    setRejectId(id);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối.');
      return;
    }

    setIsRejecting(true);
    try {
      const res = await api.put(`/expenses/reject/${rejectId}`, {
        adminNote: rejectReason
      });
      if (res.data.success) {
        toast.success('Đã từ chối giao dịch thành công.');
        setRejectId(null);
        fetchApprovals();
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Lỗi từ chối giao dịch.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Helper stats
  const stats = {
    pending: approvals.filter(a => a.status === 'paid').length,
    confirmed: approvals.filter(a => a.status === 'confirmed').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    unpaid: approvals.filter(a => a.status === 'pending').length,
  };

  // Filter & Search Logic
  const filteredApprovals = approvals.filter(app => {
    // Tab Filter
    if (activeTab !== 'all' && app.status !== activeTab) {
      return false;
    }

    // Search Query Filter
    if (searchQuery.trim() === '') return true;
    
    const query = searchQuery.toLowerCase();
    const userName = (app.userName || '').toLowerCase();
    const userEmail = (app.userEmail || '').toLowerCase();
    const content = (app.transferContent || '').toLowerCase();
    const title = (app.expense?.title || '').toLowerCase();

    return userName.includes(query) || 
           userEmail.includes(query) || 
           content.includes(query) || 
           title.includes(query);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Clock className="w-3 h-3 animate-pulse" /> Chờ duyệt
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" /> Từ chối
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
            <Clock className="w-3 h-3" /> Chưa nộp
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto w-full"
    >
      {/* Title Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">
            Duyệt Giao Dịch Chuyển Khoản
          </h1>
          <p className="text-sm text-blue-100/90 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">
            Duyệt minh chứng chuyển khoản của hội viên, cộng số dư quỹ tự động.
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Chờ Duyệt</p>
          <p className="text-2xl font-black mt-1 text-blue-400">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Đã Duyệt</p>
          <p className="text-2xl font-black mt-1 text-emerald-400">{stats.confirmed}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Từ Chối</p>
          <p className="text-2xl font-black mt-1 text-red-400">{stats.rejected}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-[#0f172a]/40 text-center">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Chưa Thanh Toán</p>
          <p className="text-2xl font-black mt-1 text-white/40">{stats.unpaid}</p>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 p-4 rounded-2xl border border-white/5 bg-[#0f172a]/30 backdrop-blur-md">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'paid', label: `Chờ duyệt (${stats.pending})` },
            { id: 'confirmed', label: 'Đã duyệt' },
            { id: 'rejected', label: 'Từ chối' },
            { id: 'pending', label: 'Chưa nộp' },
            { id: 'all', label: 'Tất cả' }
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

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Tìm theo hội viên, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="rounded-2xl p-16 text-center border border-white/5 bg-[#0f172a]/30">
          <ShieldAlert className="w-12 h-12 text-white/10 mx-auto mb-4 animate-pulse" />
          <p className="text-sm font-semibold text-white/40">Không tìm thấy yêu cầu duyệt nào</p>
          <p className="text-xs text-white/20 mt-1">Các giao dịch chuyển khoản sẽ hiển thị ở đây để đối soát</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredApprovals.map((app) => (
              <motion.div
                key={app._id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="rounded-2xl border border-white/5 bg-[#0f172a]/40 hover:border-white/10 hover:bg-[#0f172a]/60 transition-all p-5 flex flex-col md:flex-row gap-5 items-start md:items-center"
              >
                {/* Details Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-extrabold text-sm text-white">{app.userName}</h4>
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {app.userEmail}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 text-xs font-semibold text-white/60">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-white/20" />
                      <span>Khoản thu: <span className="text-white">{app.expense?.title || 'Quản lý thu'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/20" />
                      <span>CK lúc: <span className="text-white">
                        {app.paidAt ? new Date(app.paidAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                      </span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/70 border border-white/5">
                        Nội dung: {app.transferContent || 'Trống'}
                      </span>
                    </div>
                  </div>

                  {app.adminNote && (
                    <div className="text-[11px] p-2.5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-300/80 font-medium">
                      ⚠️ Lý do từ chối: {app.adminNote}
                    </div>
                  )}
                </div>

                {/* Amount and Actions Section */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-white/5 gap-3">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase">Số tiền</p>
                    <p className="text-lg font-black text-blue-400">
                      {(app.amount || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Bill Button */}
                    {app.billImageUrl ? (
                      <button
                        onClick={() => setSelectedBill(app.billImageUrl)}
                        className="flex items-center gap-1 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/80 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95"
                        title="Xem hóa đơn thanh toán"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem Bill
                      </button>
                    ) : (
                      app.status === 'paid' && (
                        <span className="text-[10px] text-white/30 font-bold border border-dashed border-white/10 px-2.5 py-1.5 rounded-lg">
                          Không có bill đính kèm
                        </span>
                      )
                    )}

                    {/* Approve / Reject Actions */}
                    {app.status === 'paid' && (
                      <>
                        <button
                          onClick={() => handleConfirm(app._id, app.userName, app.amount)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg cursor-pointer transition-all active:scale-95"
                          title="Duyệt giao dịch"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRejectModal(app._id)}
                          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2 rounded-lg cursor-pointer transition-all active:scale-95"
                          title="Từ chối giao dịch"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {/* Manual Override for Unpaid/Rejected */}
                    {(app.status === 'pending' || app.status === 'rejected') && (
                      <button
                        onClick={() => handleConfirm(app._id, app.userName, app.amount)}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                        title="Duyệt thủ công (nộp tiền mặt/chuyển khoản ngoài)"
                      >
                        <Check className="w-3.5 h-3.5" /> Duyệt thủ công
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectId && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectId(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#0f172a]/95 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl z-10 text-white"
            >
              <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" /> Từ Chối Giao Dịch
              </h3>
              <p className="text-xs text-white/60 mb-4 font-semibold">
                Vui lòng nhập lý do từ chối để gửi thông báo cho hội viên đóng phí lại.
              </p>

              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Ảnh hóa đơn mờ không thấy mã giao dịch, số tiền chuyển khoản không khớp..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/30 text-xs font-semibold outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
                  required
                />

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectId(null)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer text-white/60 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isRejecting}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepositApproval;
