import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Wallet, ChevronDown, List, 
  ArrowUpDown, Plus, Search, Trash2, X, AlertTriangle, Save,
  Calendar, Tag, Hash, Coins, User, Check, ChevronUp, ArrowUpRight, ArrowDownLeft,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import useTaskStore from '../../store/useTaskStore';
import useThemeStore from '../../store/useThemeStore';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import { toast } from 'react-toastify';
import FreePaymentModal from '../../components/FreePaymentModal/FreePaymentModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const CATEGORIES = [
  'Học phí tháng', 'Quỹ CLB', 'Mua Võ phục & Đai', 
  'Chi phí Sự kiện (Camp 26/3, Big Game)', 'Thuê sân bãi', 'Khác'
];

const CATEGORY_DETAILS = {
  'Học phí tháng': { emoji: '🎓', color: 'indigo' },
  'Quỹ CLB': { emoji: '🏆', color: 'amber' },
  'Mua Võ phục & Đai': { emoji: '🥋', color: 'teal' },
  'Chi phí Sự kiện (Camp 26/3, Big Game)': { emoji: '⛺', color: 'purple' },
  'Thuê sân bãi': { emoji: '🏟️', color: 'blue' },
  'Khác': { emoji: '⚙️', color: 'slate' }
};

const Finance = () => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';
  const [isFreePayOpen, setIsFreePayOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Floating Drawer State for adding transaction (Admin only)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    description: "",
    amount: "",
    type: "income",
    category: CATEGORIES[0],
    person: "",
    quantity: 1,
    unitPrice: ""
  });
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const { startPolling } = useTaskStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await api.post(`/transactions/export?year=${selectedYear}&month=${selectedMonth}`);
      if (res.data.success) {
        toast.success("Tác vụ xuất báo cáo đã khởi chạy ngầm! Xem tiến trình ở thanh Activity góc trên.");
        startPolling();
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xuất báo cáo.");
    } finally {
      setIsExporting(false);
    }
  };

  // Max visible month: auto-expand to current month, or manually added
  const [maxVisibleMonth, setMaxVisibleMonth] = useState(() => {
    if (selectedYear === currentDate.getFullYear()) {
      return currentDate.getMonth() + 1;
    }
    return 12;
  });

  // Dynamic months array based on maxVisibleMonth
  const MONTHS = useMemo(() => {
    return Array.from({ length: maxVisibleMonth }, (_, i) => ({
      value: i + 1,
      label: `Tháng ${i + 1}`,
      short: `T${i + 1}`
    }));
  }, [maxVisibleMonth]);

  // Auto-expand when system date changes (e.g., new month arrives)
  // Also runs a timer every 60s to detect real-time month transitions
  useEffect(() => {
    const checkAndExpand = () => {
      const now = new Date();
      if (selectedYear === now.getFullYear()) {
        const systemMonth = now.getMonth() + 1;
        if (systemMonth > maxVisibleMonth) {
          setMaxVisibleMonth(systemMonth);
        }
      }
    };

    checkAndExpand();
    const timer = setInterval(checkAndExpand, 60000); // Check every 60 seconds
    return () => clearInterval(timer);
  }, [selectedYear, maxVisibleMonth]);

  const handleAddMonth = () => {
    if (maxVisibleMonth < 12) {
      setMaxVisibleMonth(prev => prev + 1);
      setSelectedMonth(maxVisibleMonth + 1);
    }
  };

  // Available years
  const years = useMemo(() => {
    const current = currentDate.getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 2 + i);
  }, []);

  // Fetch monthly stats for the selected year
  useEffect(() => {
    fetchStats();
  }, [selectedYear]);

  // Fetch transactions for selected month
  useEffect(() => {
    fetchTransactions();
  }, [selectedYear, selectedMonth]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/transactions/stats?year=${selectedYear}`);
      if (res.data.success) {
        setMonthlyStats(res.data.monthlyData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const month = selectedMonth.toString().padStart(2, '0');
      const res = await api.get(`/transactions?year=${selectedYear}&month=${month}`);
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTx(false);
    }
  };

  // Current month data
  const currentMonthData = useMemo(() => {
    return monthlyStats.find(m => m.month === selectedMonth) || {
      income: 0, expense: 0, balance: 0, carryOverFromPrevMonth: 0, transactionCount: 0
    };
  }, [monthlyStats, selectedMonth]);

  // Filtered and searched transactions list
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Filter by transaction type (income/expense)
      const matchesType = filterType === 'all' || t.type === filterType;
      
      // 2. Filter by category
      const matchesCategory = selectedCategoryFilter === 'all' || t.category === selectedCategoryFilter;
      
      // 3. Filter by search query (case-insensitive match in description or person name)
      const matchesSearch = !searchQuery.trim() || 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.person?.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, filterType, selectedCategoryFilter, searchQuery]);

  // Chart data
  const chartData = [
    { name: 'Tổng Thu', value: currentMonthData.income, fill: '#10b981' },
    { name: 'Tổng Chi', value: currentMonthData.expense, fill: '#ef4444' },
    { name: 'Tồn Quỹ', value: currentMonthData.balance, fill: currentMonthData.balance >= 0 ? '#3b82f6' : '#f59e0b' }
  ];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Admin delete transaction handler
  const handleDeleteTransaction = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/transactions/${deleteId}`);
      if (res.data.success) {
        toast.success('Xóa giao dịch thành công! 🗑️');
        fetchStats();
        fetchTransactions();
      }
    } catch (error) {
      toast.error('Lỗi khi xóa giao dịch.');
    } finally {
      setDeleteId(null);
    }
  };

  // Drawer form inputs change handler
  const handleDrawerInputChange = (e) => {
    const { name, value } = e.target;
    setDrawerData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto calculate total amount if quantity and unitPrice change
      if (name === 'quantity' || name === 'unitPrice') {
        const qty = Number(name === 'quantity' ? value : prev.quantity) || 1;
        const price = Number(name === 'unitPrice' ? value : prev.unitPrice) || 0;
        updated.amount = qty * price;
      }
      
      return updated;
    });
  };

  // Submit new transaction from sliding Drawer
  const handleDrawerFormSubmit = async (e) => {
    e.preventDefault();
    if (!drawerData.description || !drawerData.amount || !drawerData.person) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsSubmittingTx(true);
    try {
      const res = await api.post('/transactions', {
        ...drawerData,
        amount: Number(drawerData.amount),
        quantity: Number(drawerData.quantity) || 1,
        unitPrice: Number(drawerData.unitPrice) || 0
      });

      if (res.data.success) {
        toast.success("Đã thêm giao dịch thành công! 🎉");
        setIsDrawerOpen(false);
        setIsCategoryDropdownOpen(false);
        // Clear drawer data
        setDrawerData({
          date: new Date().toLocaleDateString('en-CA'),
          description: "",
          amount: "",
          type: "income",
          category: CATEGORIES[0],
          person: "",
          quantity: 1,
          unitPrice: ""
        });
        // Refetch stats and transactions to update the UI instantly
        fetchStats();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm giao dịch.");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium text-sm mt-4">Đang tải dữ liệu tài chính...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen"
    >
      {/* 3D Stacked Layered page wrapper for premium UI/UX depth */}
      <motion.div
        animate={{
          scale: isDrawerOpen ? 0.96 : 1,
          filter: isDrawerOpen ? 'blur(3px) brightness(0.85)' : 'blur(0px) brightness(1)',
          borderRadius: isDrawerOpen ? '28px' : '0px',
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 220 }}
        className="w-full flex flex-col origin-center"
      >
        {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">Quản Lý Tài Chính CLB</h1>
            <p className="text-sm text-blue-100/90 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">Hệ thống tích hợp thống kê, biểu đồ thu chi và quản lý giao dịch</p>
          </div>
        </div>

        {/* Year Selector & Add Transaction button side by side */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-extrabold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isExporting ? 'Đang chuẩn bị...' : 'Xuất CSV'}</span>
            </motion.button>
          )}

          {isAdmin ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsDrawerOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm giao dịch
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsFreePayOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <Coins className="w-4 h-4" /> Nộp tiền / Đóng phí
            </motion.button>
          )}

          {/* Custom Year Selector Dropdown */}
          <div className="relative w-32 sm:w-36">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className={`flex items-center justify-between w-full rounded-xl px-4 py-2.5 text-sm font-extrabold focus:outline-none cursor-pointer shadow-sm transition-all duration-300 border
                ${isDarkMode 
                  ? 'bg-[#0f172a]/90 border-white/10 text-white focus:ring-blue-900/50 hover:border-white/20' 
                  : 'bg-white border-gray-200 text-gray-800 focus:ring-blue-50 hover:border-gray-300'}`}
            >
              <span>Năm {selectedYear}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isYearDropdownOpen && (
                <>
                  {/* Overlay background to close when clicked outside */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsYearDropdownOpen(false)}
                  />
                  
                  {/* Custom Floating Options Container - Stretching left-0 right-0 to match trigger button exactly */}
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute left-0 right-0 mt-2 backdrop-blur-2xl border rounded-2xl shadow-xl p-1.5 z-20 flex flex-col gap-0.5 transition-colors duration-300
                      ${isDarkMode 
                        ? 'bg-[#0f172a]/95 border-white/10 shadow-black/40' 
                        : 'bg-white/95 border-slate-200 shadow-slate-200/20'}`}
                  >
                    {years.map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between
                          ${selectedYear === y 
                            ? (isDarkMode ? 'bg-blue-500/20 text-blue-400 font-black' : 'bg-blue-50 text-blue-700 font-black') 
                            : (isDarkMode ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800')}`}
                      >
                        <span>Năm {y}</span>
                        {selectedYear === y && <Check className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Month Tabs — Dynamic with (+) button */}
      <div className={`rounded-2xl p-2 mb-6 overflow-x-auto theme-card`}>
        <div className="flex gap-1 min-w-max items-center">
          {MONTHS.map(m => (
            <motion.button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer relative
                ${selectedMonth === m.value
                  ? (isDarkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25')
                  : (isDarkMode ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')}`}
            >
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.short}</span>
            </motion.button>
          ))}
          
          {/* Nút (+) thêm tháng mới — chỉ hiện khi chưa đủ 12 tháng */}
          {maxVisibleMonth < 12 && isAdmin && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-300 text-blue-500 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer ml-1"
              title={`Thêm Tháng ${maxVisibleMonth + 1}`}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar — Filter */}
        <div className="lg:col-span-2">
          <div className={`rounded-2xl p-4 sticky top-24 space-y-5 theme-card`}>
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                <List className="w-3.5 h-3.5" /> Phân loại
              </h3>
              <div className="flex flex-row lg:flex-col gap-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1
                    ${filterType === 'all' 
                      ? (isDarkMode ? 'bg-blue-500/15 text-blue-400 border border-blue-500/35 font-bold shadow-sm' : 'bg-blue-50 text-blue-700 border border-blue-100 font-bold shadow-sm') 
                      : (isDarkMode ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50')}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 inline mr-1.5" />Tất cả
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1
                    ${filterType === 'income' 
                      ? (isDarkMode ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 font-bold shadow-sm' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold shadow-sm') 
                      : (isDarkMode ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50')}`}
                >
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />Khoản thu
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1
                    ${filterType === 'expense' 
                      ? (isDarkMode ? 'bg-red-500/15 text-red-400 border border-red-500/35 font-bold shadow-sm' : 'bg-red-50 text-red-700 border border-red-100 font-bold shadow-sm') 
                      : (isDarkMode ? 'text-white/60 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50')}`}
                >
                  <TrendingDown className="w-3.5 h-3.5 inline mr-1.5" />Khoản chi
                </button>
              </div>
            </div>

            <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`} />

            {/* Category selection */}
            <div>
              <h3 className={`text-xs font-extrabold uppercase tracking-wider mb-2.5 block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                Danh mục
              </h3>
              <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap lg:text-left cursor-pointer border
                    ${selectedCategoryFilter === 'all' 
                      ? (isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold shadow-sm' : 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm') 
                      : (isDarkMode ? 'text-white/50 hover:bg-white/5 bg-white/[0.03] border-white/5' : 'text-gray-500 hover:bg-gray-50 bg-gray-50/50 border-gray-150')}`}
                >
                  Tất cả danh mục
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap lg:text-left cursor-pointer truncate max-w-[130px] lg:max-w-none border
                      ${selectedCategoryFilter === cat 
                        ? (isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-bold shadow-sm' : 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm') 
                        : (isDarkMode ? 'text-white/50 hover:bg-white/5 bg-white/[0.03] border-white/5' : 'text-gray-500 hover:bg-gray-50 bg-gray-50/50 border-gray-150')}`}
                    title={cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-10 flex flex-col gap-6">

          {/* Stats Cards — staggered and reactive */}
          <ScrollReveal direction="up" duration={0.5} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 hover-scale hover:shadow-md transition-all duration-300 theme-card`}>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-white/5 text-white/70' : 'bg-gray-50 text-gray-500'}`}><Wallet className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dư từ tháng trước</p>
                <p className={`text-base font-black ${currentMonthData.carryOverFromPrevMonth >= 0 ? (isDarkMode ? 'text-white' : 'text-gray-800') : 'text-amber-500'}`}>
                  {formatMoney(currentMonthData.carryOverFromPrevMonth)}
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 hover-scale hover:shadow-md transition-all duration-300 theme-card ${isDarkMode ? 'border-emerald-500/10' : 'border-emerald-100'}`}>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng Thu</p>
                <p className="text-base font-black text-emerald-600">{formatMoney(currentMonthData.income)}</p>
              </div>
            </div>
            {/* Card 3 */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 hover-scale hover:shadow-md transition-all duration-300 theme-card ${isDarkMode ? 'border-red-500/10' : 'border-red-100'}`}>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}><TrendingDown className="w-6 h-6" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng Chi</p>
                <p className="text-base font-black text-red-600">{formatMoney(currentMonthData.expense)}</p>
              </div>
            </div>
            {/* Card 4 */}
            <div className={`p-5 rounded-2xl flex items-center gap-4 hover-scale hover:shadow-md transition-all duration-300 theme-card ${isDarkMode ? 'border-blue-500/10' : 'border-blue-100'}`}>
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Wallet className="w-6 h-6 animate-pulse" /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tồn Quỹ</p>
                <p className={`text-base font-black ${currentMonthData.balance >= 0 ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : 'text-amber-500'}`}>
                  {formatMoney(currentMonthData.balance)}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Bar Chart & Quick Search row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Biểu đồ */}
            <ScrollReveal direction="up" delay={0.1} className="lg:col-span-8 rounded-2xl p-6 hover:shadow-md transition-all duration-300 theme-card">
              <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <span>📊</span> Biểu đồ Thu — Chi — Tồn quỹ ({MONTHS[selectedMonth - 1]?.label} / {selectedYear})
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={45}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "#f1f5f9"} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: isDarkMode ? '#aaa' : '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: isDarkMode ? '#777' : '#94a3b8' }}
                      tickFormatter={(v) => {
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                        return v;
                      }}
                    />
                    <Tooltip
                      formatter={(v) => formatMoney(v)}
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                        color: isDarkMode ? '#ffffff' : '#1e293b',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ScrollReveal>

            {/* Quick summary table & info */}
            <ScrollReveal direction="up" delay={0.15} className={`lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300
              ${isDarkMode 
                ? 'bg-gradient-to-br from-blue-950/20 via-indigo-950/10 to-purple-950/15 border-blue-900/40 text-white shadow-black/40' 
                : 'bg-gradient-to-br from-blue-50/40 via-indigo-50/40 to-purple-50/40 border-blue-100 shadow-sm text-slate-800 shadow-slate-200/40'}`}>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>📝</span> Tổng kết nhanh
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={isDarkMode ? 'text-white/40 font-bold' : 'text-gray-400 font-bold'}>Thu trong tháng</span>
                    <span className="font-extrabold text-emerald-600">{formatMoney(currentMonthData.income)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
              <span className={isDarkMode ? 'text-white/40 font-bold' : 'text-gray-400 font-bold'}>Chi trong tháng</span>
                    <span className="font-extrabold text-red-600">{formatMoney(currentMonthData.expense)}</span>
                  </div>
                  <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-blue-100'}`} />
                  <div className="flex justify-between items-center text-xs">
                    <span className={isDarkMode ? 'text-white/40 font-bold' : 'text-gray-400 font-bold'}>Dư lũy kế tồn</span>
                    <span className={`font-black ${currentMonthData.balance >= 0 ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : 'text-amber-600'}`}>{formatMoney(currentMonthData.balance)}</span>
                  </div>
                </div>
              </div>

              <div className={`border rounded-xl p-3 text-[10px] leading-relaxed font-semibold mt-4
                ${isDarkMode 
                  ? 'backdrop-blur-sm bg-[#0f172a]/40 border-blue-900/40 text-white/50' 
                  : 'bg-white border-blue-200/30 text-gray-500 shadow-sm'}`}>
                💡 Hệ thống lưu {currentMonthData.transactionCount} giao dịch phát sinh trong tháng này.
                {currentMonthData.carryOverFromPrevMonth > 0 && ` Đã cộng gộp ${formatMoney(currentMonthData.carryOverFromPrevMonth)} tích lũy dư từ tháng trước.`}
              </div>
            </ScrollReveal>

          </div>

          {/* Transactions Table & Filters */}
          <ScrollReveal direction="up" delay={0.2} className="rounded-2xl transition-all duration-300 theme-card">
            {/* Table Header & Search Bar */}
            <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <div>
                <h3 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <span>📋</span> Lịch sử Giao Dịch — {MONTHS[selectedMonth - 1]?.label}
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border mt-1 inline-block
                  ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  {filteredTransactions.length} kết quả phù hợp
                </span>
              </div>

              {/* Integrated Search Input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nội dung, người duyệt..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all theme-input"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${isDarkMode ? 'bg-white/[0.02] text-white/40 border-b border-white/5' : 'bg-gray-50/50 text-gray-500 border-b border-gray-100'} text-[11px] uppercase tracking-wider`}>
                    <th className="py-3.5 px-6 font-bold">Ngày</th>
                    <th className="py-3.5 px-6 font-bold">Tên hàng / Nội dung</th>
                    <th className="py-3.5 px-6 font-bold">Danh mục</th>
                    <th className="py-3.5 px-6 font-bold text-right">Số tiền</th>
                    <th className="py-3.5 px-6 font-bold">Người TH</th>
                    {isAdmin && <th className="py-3.5 px-6 font-bold text-center">Xóa</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {loadingTx ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="py-10 text-center text-gray-450">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className={`py-10 text-center text-xs font-semibold ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                        Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((item) => (
                      <tr key={item._id || item.id} className={`border-b transition-all group ${isDarkMode ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100/50 hover:bg-slate-50/50'}`}>
                        <td className={`py-3 px-6 text-xs whitespace-nowrap ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>{formatDate(item.date)}</td>
                        <td className="py-3 px-6">
                          <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.description}</p>
                          {item.quantity && item.quantity > 1 && (
                            <p className={`text-[10px] font-semibold mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                              Số lượng: {item.quantity} × {formatMoney(item.unitPrice || (item.amount / item.quantity))}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-6">
                          {(() => {
                            const catDetail = CATEGORY_DETAILS[item.category] || { emoji: '📂', color: 'slate' };
                            const colorMap = isDarkMode ? {
                              indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                              amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                              teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                              purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                              blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                              slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            } : {
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
                        <td className={`py-3 px-6 text-sm font-bold text-right whitespace-nowrap ${item.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${item.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                        </td>
                        <td className={`py-3 px-6 text-xs whitespace-nowrap font-bold ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>{item.person}</td>
                        {/* Action buttons (Admin only) */}
                        {isAdmin && (
                          <td className="py-3 px-6 text-center">
                            <button
                              onClick={() => setDeleteId(item._id || item.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

        </div>
      </div>
      </motion.div>

      {/* Floating confirm delete modal inside page */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 bg-slate-950/20 z-50 flex items-center justify-center animate-fadeIn">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl border flex flex-col items-center text-center gap-5
                ${isDarkMode ? 'bg-[#0f172a] border-white/10 text-white shadow-black/50' : 'bg-white border-gray-100'}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center animate-pulse
                ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Xác nhận xóa</h3>
                <p className={`text-sm leading-relaxed px-2 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                  Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setDeleteId(null)} 
                  className={`flex-1 py-3 px-4 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm
                    ${isDarkMode ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDeleteTransaction} 
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-100 hover:shadow-xl hover:shadow-red-200 transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Slide-over Drawer for adding new transactions (Admin only) */}
      <AnimatePresence>
        {isDrawerOpen && isAdmin && (
          <>
            {/* Backdrop overlay (transparent to keep background fully bright and gorgeous) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-transparent z-50"
            />

            {/* Sliding Drawer Container with Premium Floating Glassmorphic Capsule */}
            <motion.div
              initial={{ x: '110%', scale: 0.95 }}
              animate={{ x: 0, scale: 1 }}
              exit={{ x: '110%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 30, stiffness: 220 }}
              className={`fixed right-4 top-4 bottom-4 w-[calc(100%-32px)] sm:w-full sm:max-w-md z-50 shadow-[0_20px_50px_rgba(15,23,42,0.22)] rounded-[28px] flex flex-col overflow-hidden border
                ${isDarkMode 
                  ? 'bg-[#0f172a]/95 backdrop-blur-2xl border-white/10 text-white shadow-black/50' 
                  : 'bg-white/92 backdrop-blur-2xl border-white/60 text-slate-800'}`}
            >
              {/* Drawer Header */}
              <div className={`p-6 border-b flex items-center justify-between
                ${isDarkMode 
                  ? 'border-white/5 bg-gradient-to-r from-blue-950/20 via-indigo-950/10 to-transparent' 
                  : 'border-gray-100/80 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-transparent'}`}>
                <div>
                  <h3 className={`text-base font-black tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <span className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Plus className="w-4 h-4" /></span>
                    Thêm Giao Dịch Mới
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Tự động cộng trừ ngân sách quỹ CLB</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleDrawerFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Transaction type segmented toggle */}
                <div className={`p-1.5 rounded-2xl flex relative select-none border
                  ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-slate-100/80 border-slate-200/50'}`}>
                  <button
                    type="button"
                    onClick={() => setDrawerData(prev => ({ ...prev, type: 'income' }))}
                    className={`relative z-10 w-1/2 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                      ${drawerData.type === 'income' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowUpRight className={`w-4 h-4 transition-transform duration-300 ${drawerData.type === 'income' ? 'scale-110' : 'opacity-60'}`} />
                    <span>Khoản Thu</span>
                    {drawerData.type === 'income' && (
                      <motion.div
                        layoutId="activeTabBackground"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 bg-white border border-emerald-100 rounded-xl shadow-sm z-[-1]"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerData(prev => ({ ...prev, type: 'expense' }))}
                    className={`relative z-10 w-1/2 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer
                      ${drawerData.type === 'expense' ? 'text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <ArrowDownLeft className={`w-4 h-4 transition-transform duration-300 ${drawerData.type === 'expense' ? 'scale-110' : 'opacity-60'}`} />
                    <span>Khoản Chi</span>
                    {drawerData.type === 'expense' && (
                      <motion.div
                        layoutId="activeTabBackground"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 bg-white border border-red-100 rounded-xl shadow-sm z-[-1]"
                      />
                    )}
                  </button>
                </div>

                {/* Date Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày giao dịch
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    value={drawerData.date} 
                    onChange={handleDrawerInputChange} 
                    className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50/50 focus:shadow-md transition-all duration-200 theme-input" 
                    required 
                  />
                </div>

                {/* Product/Item Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Tên hàng / Nội dung giao dịch
                  </label>
                  <input 
                    type="text" 
                    name="description" 
                    value={drawerData.description} 
                    onChange={handleDrawerInputChange} 
                    placeholder="VD: Mua nước khoáng, Đóng học phí..." 
                    className="w-full p-3.5 rounded-2xl text-xs font-bold placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-50/50 focus:shadow-md transition-all duration-200 theme-input" 
                    required 
                  />
                </div>

                {/* Quantity and Price grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> Số lượng
                    </label>
                    <input 
                      type="number" 
                      name="quantity" 
                      value={drawerData.quantity} 
                      onChange={handleDrawerInputChange} 
                      placeholder="1" 
                      min="1" 
                      className="w-full p-3.5 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-50/50 focus:shadow-md transition-all duration-200 theme-input" 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-400" /> Đơn giá (VNĐ)
                    </label>
                    <input 
                      type="number" 
                      name="unitPrice" 
                      value={drawerData.unitPrice} 
                      onChange={handleDrawerInputChange} 
                      placeholder="VD: 50000" 
                      min="0" 
                      className="w-full p-3.5 rounded-2xl text-xs font-bold placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-50/50 focus:shadow-md transition-all duration-200 theme-input" 
                      required 
                    />
                  </div>
                </div>

                {/* Category select using custom dropdown */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5 text-slate-400" /> Danh mục
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold outline-none transition-all duration-200 cursor-pointer text-left shadow-sm border
                        ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:border-white/20' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{CATEGORY_DETAILS[drawerData.category]?.emoji || '📂'}</span>
                        <span>{drawerData.category}</span>
                      </span>
                      {isCategoryDropdownOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    <AnimatePresence>
                      {isCategoryDropdownOpen && (
                        <>
                          {/* Backdrop click-away trigger */}
                          <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className={`absolute z-20 w-full mt-2 border rounded-2xl shadow-xl py-1.5 overflow-hidden backdrop-blur-xl
                              ${isDarkMode ? 'bg-[#0f172a]/95 border-white/10 shadow-black/40' : 'bg-white/95 border-gray-100 shadow-xl'}`}
                          >
                            {CATEGORIES.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setDrawerData(prev => ({ ...prev, category: cat }));
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-xs text-left transition-all duration-150 cursor-pointer
                                  ${drawerData.category === cat 
                                    ? (isDarkMode ? 'bg-blue-500/10 text-blue-400 font-extrabold' : 'bg-blue-50/50 text-blue-600 font-extrabold') 
                                    : (isDarkMode ? 'text-white/60 hover:bg-white/5' : 'text-gray-600 hover:bg-slate-50 font-bold')}`}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className="text-base">{CATEGORY_DETAILS[cat]?.emoji || '📂'}</span>
                                  <span>{cat}</span>
                                </span>
                                {drawerData.category === cat && <Check className="w-4 h-4 text-blue-500" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Dynamic Total Amount Preview Card */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden
                  ${drawerData.type === 'income' 
                    ? (isDarkMode 
                      ? 'bg-gradient-to-br from-emerald-950/20 via-teal-950/10 to-transparent border-emerald-900/50 shadow-sm shadow-emerald-955/5' 
                      : 'bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white border-emerald-100/80 shadow-sm shadow-emerald-500/5') 
                    : (isDarkMode 
                      ? 'bg-gradient-to-br from-rose-950/20 via-pink-950/10 to-transparent border-rose-900/50 shadow-sm shadow-rose-955/5' 
                      : 'bg-gradient-to-br from-rose-50/50 via-pink-50/20 to-white border-rose-100/80 shadow-sm shadow-rose-500/5')}`}>
                  
                  {/* Glowing ambient background blur */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-xl opacity-20 pointer-events-none -mr-8 -mt-8 transition-colors duration-300
                    ${drawerData.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} />

                  <div className="flex justify-between items-center z-10">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Tổng số tiền thanh toán</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1
                      ${drawerData.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {drawerData.type === 'income' ? 'Thu nhập' : 'Chi phí'}
                    </span>
                  </div>

                  <div className="mt-3.5 z-10">
                    <p className={`text-3xl font-black font-mono tracking-tight transition-colors duration-300
                      ${drawerData.type === 'income' ? 'text-emerald-600 drop-shadow-[0_2px_10px_rgba(16,185,129,0.1)]' : 'text-rose-600 drop-shadow-[0_2px_10px_rgba(244,63,94,0.1)]'}`}>
                      {formatMoney(drawerData.amount || 0)}
                    </p>
                    
                    {drawerData.quantity > 0 && drawerData.unitPrice > 0 ? (
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                        <span>💡 Phép tính:</span>
                        <span className="font-bold text-slate-500">{drawerData.quantity}</span>
                        <span>×</span>
                        <span className="font-bold text-slate-500">{formatMoney(drawerData.unitPrice)}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Vui lòng nhập Số lượng và Đơn giá để tính số tiền.
                      </p>
                    )}
                  </div>
                </div>

                {/* Person responsible */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Người thực hiện/Người duyệt
                  </label>
                  <input 
                    type="text" 
                    name="person" 
                    value={drawerData.person} 
                    onChange={handleDrawerInputChange} 
                    placeholder="VD: Nguyễn Tuấn Việt" 
                    className="w-full p-3.5 rounded-2xl text-xs font-bold placeholder-gray-400 outline-none focus:ring-4 focus:ring-blue-50/50 focus:shadow-md transition-all duration-200 theme-input" 
                    required 
                  />
                </div>

                {/* Drawer Save Button with shimmer sweep effect */}
                <motion.button 
                  type="submit" 
                  disabled={isSubmittingTx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:shadow-xl hover:shadow-indigo-500/25 text-white font-black py-4 rounded-2xl text-xs transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 mt-6 uppercase tracking-wider group"
                >
                  {/* Shimmer sweep effect on hover */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                  
                  {isSubmittingTx ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Save className="w-4 h-4" /> Lưu giao dịch</>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Free Payment / Custom Contribution Modal */}
      <FreePaymentModal
        isOpen={isFreePayOpen}
        onClose={() => setIsFreePayOpen(false)}
        onDepositCreated={(ue) => {
          setSelectedPayment(ue);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Payment / QR Display Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
          fetchStats();
          fetchTransactions();
        }}
        userExpense={selectedPayment}
        onPaymentSuccess={() => {
          fetchStats();
          fetchTransactions();
        }}
      />
    </motion.div>
  );
};

export default Finance;
