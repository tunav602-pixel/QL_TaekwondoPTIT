import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, Users, CalendarCheck, Clock, Activity, BarChart3, ArrowRight, Sparkles, Coins, Zap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import ScrollReveal, { ScrollRevealGroup, ScrollRevealItem } from '../../components/ScrollReveal/ScrollReveal';
import FreePaymentModal from '../../components/FreePaymentModal/FreePaymentModal';
import PaymentModal from '../../components/PaymentModal/PaymentModal';

const CATEGORY_DETAILS = {
  'Học phí tháng': { emoji: '🎓', color: 'indigo' },
  'Quỹ CLB': { emoji: '🏆', color: 'amber' },
  'Mua Võ phục & Đai': { emoji: '🥋', color: 'teal' },
  'Chi phí Sự kiện (Camp 26/3, Big Game)': { emoji: '⛺', color: 'purple' },
  'Thuê sân bãi': { emoji: '🏟️', color: 'blue' },
  'Khác': { emoji: '⚙️', color: 'slate' }
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [transactions, setTransactions] = useState([]);
  const [overallBalance, setOverallBalance] = useState(0);
  const [isFreePayOpen, setIsFreePayOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [nextSessions, setNextSessions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    Promise.all([
      fetchCurrentMonthData(),
      fetchAttendanceStats(),
      fetchNextSessions(),
      fetchMonthlyChart()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchCurrentMonthData = async () => {
    try {
      const month = currentMonth.toString().padStart(2, '0');
      const res = await api.get(`/transactions?year=${currentYear}&month=${month}`);
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setRecentTransactions(res.data.transactions.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const res = await api.get('/attendance/my');
      if (res.data.success) {
        setAttendanceStats(res.data.stats);
      }
    } catch (error) {
      console.error('Attendance stats error:', error);
    }
  };

  const fetchNextSessions = async () => {
    try {
      const res = await api.get('/attendance/next-sessions?count=3');
      if (res.data.success) {
        setNextSessions(res.data.sessions);
      }
    } catch (error) {
      console.error('Next sessions error:', error);
    }
  };

  const fetchMonthlyChart = async () => {
    try {
      const res = await api.get(`/transactions/stats?year=${currentYear}`);
      if (res.data.success) {
        const data = res.data.monthlyData || [];
        const last6 = data.filter(m => m.month <= currentMonth).slice(-6);
        setMonthlyData(last6);
        
        // Lấy số dư tồn quỹ lũy kế của tháng hiện tại
        const currentMonthData = data.find(m => m.month === currentMonth);
        if (currentMonthData) {
          setOverallBalance(currentMonthData.balance);
        }
      }
    } catch (error) {
      console.error('Monthly chart error:', error);
    }
  };

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expense += Number(t.amount);
    });
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const monthNamesFull = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  const chartData = monthlyData.map(m => ({
    name: monthNames[m.month - 1],
    income: m.income || 0,
    expense: m.expense || 0
  }));

  const attendanceRate = attendanceStats?.attendanceRate || 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // Calculate relative time for sessions
  const getRelativeDay = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    return `Còn ${diff} ngày`;
  };

  // Custom dark tooltip for chart
  const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={`p-3 !rounded-xl text-xs border backdrop-blur-md shadow-lg transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#0f172a]/95 border-white/10 text-white shadow-black/30' 
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/20'
      }`}>
        <p className={`font-bold mb-1.5 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className={isDarkMode ? 'text-white/60' : 'text-slate-500'}>{p.name}:</span>
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{formatMoney(p.value)}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Hero */}
        <div className="h-[280px] rounded-[28px] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e3a8a]/60 to-[#312e81]/40 animate-pulse" />
          <div className="hero-orb hero-orb-1 opacity-30" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="dark-glass-card p-5 h-[120px] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dark-glass-container h-[300px] animate-pulse" />
          <div className="dark-glass-container h-[300px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO WELCOME SECTION — nguyenxuantai.com inspired ===== */}
      <ScrollReveal direction="up" duration={0.6}>
        <div 
          className={`relative overflow-hidden rounded-[28px] p-8 md:p-10 min-h-[280px] border border-gray-200/50 dark:border-white/5 transition-all duration-500 ${!isDarkMode ? 'bg-gradient-to-br from-[#e0f2fe] via-[#fdf4f5] to-[#e0e7ff] shadow-sm' : 'backdrop-blur-2xl'}`}
          style={isDarkMode ? { 
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,58,138,0.85), rgba(49,46,129,0.8))' 
          } : undefined}
        >
          {/* Floating Orbs — nguyenxuantai pattern */}
          <div className={`hero-orb hero-orb-1 ${isDarkMode ? 'opacity-80' : 'opacity-25'}`} />
          <div className={`hero-orb hero-orb-2 ${isDarkMode ? 'opacity-80' : 'opacity-25'}`} />
          <div className={`hero-orb hero-orb-3 ${isDarkMode ? 'opacity-80' : 'opacity-25'}`} />

          {/* Shimmer overlay */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left: Welcome text + stats */}
            <div className="flex-1">
              {/* Badge pill */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`accent-badge mb-5 border ${isDarkMode ? 'border-blue-400/20 bg-blue-500/10 text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-600'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {getGreeting()}, {user?.name?.split(' ').pop() || 'bạn'} 👋
              </motion.div>

              {/* Hero Title — 2-line style */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-[2.8rem] font-black tracking-tight leading-[1.1] mb-3"
              >
                <span className={isDarkMode ? 'text-white' : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent'}>TỔNG QUAN</span>
                <span className={`block transition-all duration-300 ${
                  isDarkMode 
                    ? 'text-blue-400' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                }`} style={{ textShadow: isDarkMode ? '0 0 40px rgba(59, 130, 246, 0.4)' : 'none' }}>
                  QUỸ CLB
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-sm mb-7 font-medium transition-colors ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}
              >
                {monthNamesFull[currentMonth - 1]} / {currentYear} — Taekwondo PTIT Club
              </motion.p>

              {/* Hero Stats Row — nguyenxuantai .hero-stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex gap-7 flex-wrap"
              >
                <div>
                  <div className="stat-number">{formatMoney(stats.income).replace('₫', '')}<span className="accent">₫</span></div>
                  <div className="stat-label">Tổng thu tháng</div>
                </div>
                <div>
                  <div className="stat-number">{formatMoney(stats.expense).replace('₫', '')}<span className="accent">₫</span></div>
                  <div className="stat-label">Tổng chi tháng</div>
                </div>
                <div>
                  <div className="stat-number">{formatMoney(overallBalance).replace('₫', '')}<span className="accent">₫</span></div>
                  <div className="stat-label">Tồn quỹ CLB</div>
                </div>
                <div>
                  <div className="stat-number">{Math.round(attendanceRate)}<span className="accent">%</span></div>
                  <div className="stat-label">Chuyên cần</div>
                </div>
              </motion.div>
            </div>

            {/* Right: Attendance Ring — glass badge style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="glass-info-badge flex items-center gap-4 pr-6"
            >
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"} strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    style={{
                      stroke: attendanceRate >= 66.67 ? '#34d399' : attendanceRate >= 40 ? '#fbbf24' : '#f87171',
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      transition: 'stroke-dashoffset 1.5s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-black text-sm transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{Math.round(attendanceRate)}%</span>
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Chuyên cần</p>
                <p className={`font-bold text-sm mt-0.5 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {attendanceStats?.presentCount || 0}/{attendanceStats?.totalSessions || 0} buổi
                </p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  attendanceRate >= 66.67 
                    ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50') 
                    : (isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-600 border border-red-200/50')
                }`}>
                  {attendanceRate >= 66.67 ? '✓ Đủ điều kiện' : '✗ Chưa đủ'}
                </span>
              </div>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 flex gap-3 mt-8 flex-wrap"
          >
            <Link
              to="/finance"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-blue-500/25"
            >
              <Wallet className="w-4 h-4" />
              Quản lý tài chính
            </Link>
            {isAdmin && (
              <Link
                to="/finance"
                className={`inline-flex items-center gap-2 px-5 py-2.5 border text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5
                  ${isDarkMode 
                    ? 'border-white/15 hover:border-white/30 text-white/80 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100'}`}
              >
                <Zap className="w-4 h-4" />
                Thêm giao dịch
              </Link>
            )}
          </motion.div>
        </div>
      </ScrollReveal>
      {/* ===== STAT CARDS — Premium Framer Motion spring-animated glass cards ===== */}
      <ScrollRevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
        {/* Income */}
        <ScrollRevealItem>
          <Link to="/finance" className="block group">
            <motion.div 
              whileHover={{ 
                y: -6, 
                scale: 1.025,
                boxShadow: isDarkMode 
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(16, 185, 129, 0.2)' 
                  : '0 20px 48px -12px rgba(16, 185, 129, 0.18), 0 0 20px 2px rgba(16, 185, 129, 0.15)'
              }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="theme-card p-5 h-full light-glow-income cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-300 ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider relative z-10 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Tổng Thu</p>
              <p className="text-xl font-black text-emerald-500 dark:text-emerald-400 mt-1 relative z-10">{formatMoney(stats.income)}</p>
              <div className={`mt-3 h-1 rounded-full overflow-hidden relative z-10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: stats.income > 0 ? '100%' : '0%' }}
                  transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}
                />
              </div>
            </motion.div>
          </Link>
        </ScrollRevealItem>

        {/* Expense */}
        <ScrollRevealItem>
          <Link to="/finance" className="block group">
            <motion.div 
              whileHover={{ 
                y: -6, 
                scale: 1.025,
                boxShadow: isDarkMode 
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(239, 68, 68, 0.2)' 
                  : '0 20px 48px -12px rgba(239, 68, 68, 0.18), 0 0 20px 2px rgba(239, 68, 68, 0.15)'
              }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="theme-card p-5 h-full light-glow-expense cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="p-2.5 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-red-500/20">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-300 ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider relative z-10 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Tổng Chi</p>
              <p className="text-xl font-black text-red-500 dark:text-red-400 mt-1 relative z-10">{formatMoney(stats.expense)}</p>
              <div className={`mt-3 h-1 rounded-full overflow-hidden relative z-10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: stats.income > 0 ? `${Math.min((stats.expense / stats.income) * 100, 100)}%` : '0%' }}
                  transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}
                />
              </div>
            </motion.div>
          </Link>
        </ScrollRevealItem>

        {/* Balance */}
        <ScrollRevealItem>
          <Link to="/finance" className="block group">
            <motion.div 
              whileHover={{ 
                y: -6, 
                scale: 1.025,
                boxShadow: isDarkMode 
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(59, 130, 246, 0.2)' 
                  : '0 20px 48px -12px rgba(59, 130, 246, 0.18), 0 0 20px 2px rgba(59, 130, 246, 0.15)'
              }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="theme-card p-5 h-full light-glow-balance cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-300 ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider relative z-10 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Tồn quỹ CLB</p>
              <p className={`text-xl font-black mt-1 relative z-10 ${overallBalance >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>{formatMoney(overallBalance)}</p>
              <div className={`mt-3 h-1 rounded-full overflow-hidden relative z-10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: overallBalance > 0 ? '100%' : '5%' }}
                  transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${overallBalance >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                  style={{ boxShadow: overallBalance >= 0 ? '0 0 8px rgba(59, 130, 246, 0.4)' : '0 0 8px rgba(245, 158, 11, 0.4)' }}
                />
              </div>
            </motion.div>
          </Link>
        </ScrollRevealItem>

        {/* Attendance Rate */}
        <ScrollRevealItem>
          <Link to="/profile" className="block group">
            <motion.div 
              whileHover={{ 
                y: -6, 
                scale: 1.025,
                boxShadow: isDarkMode 
                  ? '0 20px 48px -12px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(99, 102, 241, 0.2)' 
                  : '0 20px 48px -12px rgba(99, 102, 241, 0.18), 0 0 20px 2px rgba(99, 102, 241, 0.15)'
              }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="theme-card p-5 h-full light-glow-attendance cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-300 ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`} />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider relative z-10 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Chuyên cần</p>
              <p className={`text-xl font-black mt-1 relative z-10 ${attendanceRate >= 66.67 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {Math.round(attendanceRate)}%
              </p>
              <div className={`mt-3 h-1 rounded-full overflow-hidden relative z-10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(attendanceRate, 100)}%` }}
                  transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${attendanceRate >= 66.67 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                  style={{ boxShadow: attendanceRate >= 66.67 ? '0 0 8px rgba(52, 211, 153, 0.4)' : '0 0 8px rgba(239, 68, 68, 0.4)' }}
                />
              </div>
            </motion.div>
          </Link>
        </ScrollRevealItem>
      </ScrollRevealGroup>

      {/* ===== MAIN CONTENT GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - 6 month comparison */}
        <ScrollReveal direction="up" delay={0.1} className="lg:col-span-2">
          <div className="theme-container p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-kicker">Thống kê</p>
                <h3 className={`text-base font-bold flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  Biểu đồ Thu — Chi ({currentYear})
                </h3>
              </div>
              <Link to="/finance" className="text-xs font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition-colors group">
                Chi tiết <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="h-[240px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.15}/>
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fontWeight: 600, fill: isDarkMode ? 'rgba(255,255,255,0.4)' : '#64748b' }} 
                      axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }} 
                      tickLine={false} 
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: isDarkMode ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => {
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                        return v;
                      }}
                    />
                    <Tooltip content={<DarkTooltip />} cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} name="Thu" animationDuration={800} />
                    <Bar dataKey="expense" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} name="Chi" animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`h-full flex items-center justify-center text-sm ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                  Chưa có dữ liệu giao dịch
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
        {/* Quick Actions + Upcoming Sessions */}
        <ScrollReveal direction="up" delay={0.2}>
          <div className="space-y-6">
            {/* Quick Actions — flow-node style */}
            <div className="theme-container p-5">
              <div className="flex items-center gap-2 mb-4">
                <p className="section-kicker !mb-0">Truy cập</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/finance" className="flow-node">
                  <Wallet className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-[11px]">Tài chính</span>
                </Link>
                <Link to="/finance" className="flow-node">
                  <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[11px]">Lịch sử</span>
                </Link>
                {isAdmin ? (
                  <>
                    <Link to="/members" className="flow-node">
                      <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[11px]">Hội viên</span>
                    </Link>
                    <Link to="/attendance" className="flow-node">
                      <CalendarCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      <span className="text-[11px]">Điểm danh</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsFreePayOpen(true)}
                      className="flow-node w-full text-left"
                    >
                      <Coins className="w-5 h-5 text-amber-500 dark:text-amber-400 mx-auto" />
                      <span className="text-[11px] mx-auto">Nộp tiền / Phí</span>
                    </button>
                    <Link to="/profile" className="flow-node">
                      <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[11px]">Khoản nợ</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Upcoming Sessions — Timeline style */}
            <div className="theme-container p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className={`w-4 h-4 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <p className="section-kicker !mb-0">Buổi tập sắp tới</p>
              </div>
              <div className="space-y-0">
                {nextSessions.map((session, idx) => (
                  <motion.div
                    key={session.date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="timeline-item"
                  >
                    <div className={`timeline-dot ${
                      idx === 0 ? '!bg-blue-500/20 !border-blue-400 ring-2 ring-blue-400/20 ring-offset-1 dark:ring-offset-transparent ring-offset-white' : ''
                    }`}>
                      <span className="text-xs">{session.dayName?.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between py-1">
                      <div>
                        <p className={`text-xs font-bold transition-colors ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>{session.dayName}</p>
                        <p className={`text-[11px] transition-colors ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>{session.date}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        idx === 0 
                          ? (isDarkMode ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100') 
                          : (isDarkMode ? 'bg-white/5 text-white/40 border border-white/8' : 'bg-slate-100 text-slate-500 border border-slate-200/50')
                      }`}>
                        {getRelativeDay(session.date)}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {nextSessions.length === 0 && (
                  <p className={`text-xs text-center py-3 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Đang tải...</p>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ===== RECENT TRANSACTIONS — dark glass table ===== */}
      <ScrollReveal direction="up" delay={0.15}>
        <div className="theme-container overflow-hidden">
          <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-150'}`}>
            <div>
              <p className="section-kicker">Giao dịch</p>
              <h3 className={`text-base font-bold flex items-center gap-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                📋 Giao dịch gần đây
              </h3>
            </div>
            <Link to="/finance" className="text-xs font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 transition-colors group">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="overflow-x-auto dark-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className={`text-xs uppercase tracking-wider border-b transition-colors
                  ${isDarkMode 
                    ? 'bg-white/[0.02] text-white/40 border-white/[0.06]' 
                    : 'bg-slate-50/50 text-slate-500 border-slate-100'}`}>
                  <th className="py-3 px-6 font-bold">Ngày</th>
                  <th className="py-3 px-6 font-bold">Nội dung</th>
                  <th className="py-3 px-6 font-bold">Danh mục</th>
                  <th className="py-3 px-6 font-bold text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center text-sm ${isDarkMode ? 'text-white/30' : 'text-slate-450'}`}>
                      Chưa có giao dịch nào trong tháng này
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((item, idx) => (
                    <motion.tr
                      key={item._id || item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + idx * 0.05 }}
                      className={`group transition-colors ${isDarkMode ? 'hover:bg-blue-500/5' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className={`py-3.5 px-6 text-sm whitespace-nowrap transition-colors ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>{formatDate(item.date)}</td>
                      <td className="py-3.5 px-6">
                        <p className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-white/80 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'}`}>{item.description}</p>
                        {item.quantity && item.quantity > 1 && (
                          <p className={`text-[10px] font-medium mt-0.5 transition-colors ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                            Số lượng: {item.quantity} × {formatMoney(item.unitPrice || (item.amount / item.quantity))}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        {(() => {
                          const catDetail = CATEGORY_DETAILS[item.category] || { emoji: '📂', color: 'slate' };
                          const darkColorMap = {
                            indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
                            amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                            teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
                            purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
                            blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
                            slate: 'bg-white/5 text-white/50 border-white/10'
                          };
                          const lightColorMap = {
                            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                            amber: 'bg-amber-50 text-amber-600 border-amber-100',
                            teal: 'bg-teal-50 text-teal-600 border-teal-100',
                            purple: 'bg-purple-50 text-purple-600 border-purple-100',
                            blue: 'bg-blue-50 text-blue-600 border-blue-100',
                            slate: 'bg-slate-100 text-slate-600 border-slate-200'
                          };
                          const colorClass = isDarkMode 
                            ? (darkColorMap[catDetail.color] || 'bg-white/5 text-white/50 border-white/10')
                            : (lightColorMap[catDetail.color] || 'bg-slate-100 text-slate-600 border-slate-200');
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[10px] font-bold whitespace-nowrap ${colorClass}`}>
                              <span>{catDetail.emoji}</span>
                              <span>{item.category}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className={`py-3.5 px-6 text-sm font-bold text-right whitespace-nowrap ${item.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${item.type === 'income' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'}`} style={{ boxShadow: item.type === 'income' ? '0 0 6px rgba(52,211,153,0.5)' : '0 0 6px rgba(248,113,113,0.5)' }} />
                        {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount)}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
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
          fetchCurrentMonthData();
          fetchMonthlyChart();
        }}
        userExpense={selectedPayment}
        onPaymentSuccess={() => {
          fetchCurrentMonthData();
          fetchMonthlyChart();
        }}
      />
    </div>
  );
};

export default Dashboard;
