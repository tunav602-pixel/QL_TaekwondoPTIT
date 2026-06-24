import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Award, Shield, ArrowLeft, Eye, CheckCircle2, XCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { BACKEND_URL } from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';

const MemberManagement = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/all-stats');
      if (res.data.success) {
        setMembers(res.data.stats);
      }
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error('Không thể tải danh sách hội viên.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = !search || 
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.maHoiVien?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === 'eligible') return matchesSearch && m.attendanceRate >= 66.67;
    if (filterStatus === 'ineligible') return matchesSearch && m.attendanceRate < 66.67;
    return matchesSearch;
  });

  const getStatusBadge = (rate) => {
    if (rate >= 66.67) {
      return (
        <span className="badge-eligible inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold">
          <CheckCircle2 className="w-3 h-3" /> Đủ ĐK
        </span>
      );
    }
    return (
      <span className="badge-ineligible inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold">
        <XCircle className="w-3 h-3" /> Chưa đạt
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium text-sm mt-4">Đang tải danh sách hội viên...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">
              <Users className="w-6 h-6 text-blue-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
              Quản Lý Hội Viên
            </h1>
            <p className="text-sm text-blue-100/90 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">Danh sách hội viên và tỉ lệ chuyên cần CLB</p>
          </div>
        </div>
        <Link
          to="/attendance"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/10 transition-all hover:scale-105 active:scale-95"
        >
          <BarChart3 className="w-4 h-4" />
          Điểm danh buổi tập
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="theme-card p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider">Tổng hội viên</p>
            <p className="text-xl font-black theme-text-primary">{members.length}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="theme-card border-emerald-500/20 dark:border-emerald-500/20 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider">Đủ điều kiện</p>
            <p className="text-xl font-black text-emerald-500 dark:text-emerald-400">{members.filter(m => m.attendanceRate >= 66.67).length}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="theme-card border-red-500/20 dark:border-red-500/20 p-4 flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl"><XCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] theme-text-secondary font-bold uppercase tracking-wider">Chưa đạt</p>
            <p className="text-xl font-black text-red-500 dark:text-red-400">{members.filter(m => m.attendanceRate < 66.67).length}</p>
          </div>
        </motion.div>
      </div>

      {/* Search + Filters */}
      <div className="theme-container p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã hội viên, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all font-medium theme-input focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'eligible', 'ineligible'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 border
                ${status === 'all' ? 'member-filter-all' : status === 'eligible' ? 'member-filter-eligible' : 'member-filter-ineligible'}
                ${filterStatus === status ? 'active' : ''}
                ${isDarkMode
                  ? (filterStatus === status
                    ? (status === 'eligible' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : status === 'ineligible' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/25')
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white')
                  : ''}`}
            >
              {status === 'all' ? 'Tất cả' : status === 'eligible' ? 'Đủ ĐK' : 'Chưa đạt'}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="theme-container overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`text-xs uppercase tracking-wider border-b transition-colors
                ${isDarkMode 
                  ? 'bg-white/[0.02] text-white/40 border-white/[0.06]' 
                  : 'bg-slate-50/50 text-slate-500 border-slate-100'}`}>
                <th className="py-3.5 px-6 font-bold">Hội viên</th>
                <th className="py-3.5 px-6 font-bold">Mã HV</th>
                <th className="py-3.5 px-6 font-bold">Vai trò</th>
                <th className="py-3.5 px-6 font-bold text-center">Đi học</th>
                <th className="py-3.5 px-6 font-bold text-center">Chuyên cần</th>
                <th className="py-3.5 px-6 font-bold text-center">Trạng thái</th>
                <th className="py-3.5 px-6 font-bold text-center">Xem</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-10 text-center text-sm ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>
                    Không tìm thấy hội viên nào
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m, idx) => (
                  <motion.tr
                    key={m.userId}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.03 }}
                    className={`group transition-colors ${isDarkMode ? 'hover:bg-blue-500/5' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl.startsWith('http') ? m.avatarUrl : `${BACKEND_URL}${m.avatarUrl}`}
                            alt={m.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-100">
                            {getInitials(m.name)}
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{m.name}</p>
                          <p className={`text-[11px] transition-colors ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${isDarkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                        {m.maHoiVien || '—'}
                      </span>
                    </td>
                    <td className={`py-3 px-6 text-xs font-medium ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>{m.role}</td>
                    <td className="py-3 px-6 text-center">
                      <span className={`text-sm font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{m.presentCount}/{m.totalSessions}</span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-16 h-1.5 rounded-full overflow-hidden transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              m.attendanceRate >= 66.67 ? 'bg-emerald-500' : m.attendanceRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(m.attendanceRate, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${
                          m.attendanceRate >= 66.67 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          {Math.round(m.attendanceRate)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">{getStatusBadge(m.attendanceRate)}</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => navigate(`/profile/${m.userId}`)}
                        className={`p-2 rounded-lg transition-all cursor-pointer hover:scale-110
                          ${isDarkMode ? 'text-white/40 hover:text-blue-400 hover:bg-white/5' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MemberManagement;
