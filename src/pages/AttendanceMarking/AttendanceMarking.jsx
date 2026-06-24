import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, ArrowLeft, Save, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { BACKEND_URL } from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Đi học', icon: CheckCircle2, color: 'emerald', emoji: '✅' },
  { value: 'excused', label: 'Nghỉ có phép', icon: AlertCircle, color: 'amber', emoji: '📋' },
  { value: 'absent', label: 'Nghỉ không phép', icon: XCircle, color: 'red', emoji: '❌' }
];

const AttendanceMarking = () => {
  const { isDarkMode } = useThemeStore();
  const [members, setMembers] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { userId: status }
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      fetchExistingAttendance();
    }
  }, [attendanceDate, members]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/attendance/all-stats');
      if (res.data.success) {
        setMembers(res.data.stats);
        // Initialize all as present
        const initialData = {};
        res.data.stats.forEach(m => {
          initialData[m.userId] = 'present';
        });
        setAttendanceData(initialData);
      }
    } catch (error) {
      console.error('Fetch members error:', error);
      toast.error('Không thể tải danh sách hội viên.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const res = await api.get(`/attendance?date=${attendanceDate}`);
      if (res.data.success && res.data.records.length > 0) {
        setExistingRecords(res.data.records);
        // Merge existing records into attendanceData
        const updatedData = { ...attendanceData };
        // First reset all to present
        members.forEach(m => {
          updatedData[m.userId] = 'present';
        });
        // Then apply existing records
        res.data.records.forEach(r => {
          updatedData[r.userId] = r.status;
        });
        setAttendanceData(updatedData);
      } else {
        setExistingRecords([]);
        // Reset all to present
        const resetData = {};
        members.forEach(m => {
          resetData[m.userId] = 'present';
        });
        setAttendanceData(resetData);
      }
    } catch (error) {
      console.error('Fetch existing attendance error:', error);
    }
  };

  const toggleStatus = (userId) => {
    const currentStatus = attendanceData[userId] || 'present';
    const statusOrder = ['present', 'excused', 'absent'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    setAttendanceData(prev => ({
      ...prev,
      [userId]: statusOrder[nextIndex]
    }));
  };

  const setStatus = (userId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [userId]: status
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = members.map(m => ({
        userId: m.userId,
        userName: m.name,
        maHoiVien: m.maHoiVien || '',
        status: attendanceData[m.userId] || 'present',
        note: ''
      }));

      const res = await api.post('/attendance/mark', {
        date: attendanceDate,
        records
      });

      if (res.data.success) {
        toast.success(`✅ ${res.data.message}`);
        fetchExistingAttendance();
      }
    } catch (error) {
      console.error('Save attendance error:', error);
      toast.error('Lỗi khi lưu điểm danh.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const counts = {
    present: Object.values(attendanceData).filter(s => s === 'present').length,
    excused: Object.values(attendanceData).filter(s => s === 'excused').length,
    absent: Object.values(attendanceData).filter(s => s === 'absent').length
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium text-sm mt-4">Đang tải dữ liệu...</p>
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
          <Link to="/members" className="p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">
              <CalendarCheck className="w-6 h-6 text-blue-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]" />
              Điểm Danh Buổi Tập
            </h1>
            <p className="text-sm text-blue-100/90 font-medium mt-0.5 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">Điểm danh chuyên cần hội viên CLB Taekwondo PTIT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50/50 shadow-sm transition-all theme-input"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/15 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu điểm danh
          </button>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`border rounded-2xl p-4 text-center transition-all duration-300 attendance-stat-present
            ${isDarkMode 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : ''}`}>
          <p className="text-3xl font-black">{counts.present}</p>
          <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>✅ Đi học</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`border rounded-2xl p-4 text-center transition-all duration-300 attendance-stat-excused
            ${isDarkMode 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : ''}`}>
          <p className="text-3xl font-black">{counts.excused}</p>
          <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>📋 Có phép</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`border rounded-2xl p-4 text-center transition-all duration-300 attendance-stat-absent
            ${isDarkMode 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : ''}`}>
          <p className="text-3xl font-black">{counts.absent}</p>
          <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>❌ Không phép</p>
        </motion.div>
      </div>

      {/* Existing records notice */}
      {existingRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`border rounded-xl p-3 flex items-center gap-2 text-sm font-medium
            ${isDarkMode 
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
              : 'bg-blue-50 border-blue-200 text-blue-700'}`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          Ngày {attendanceDate} đã có dữ liệu điểm danh ({existingRecords.length} hội viên). Dữ liệu sẽ được cập nhật khi lưu.
        </motion.div>
      )}

      {/* Members List */}
      <div className="rounded-2xl shadow-sm overflow-hidden theme-card">
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Danh sách hội viên ({members.length})
          </h3>
          <span className={`text-xs font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
            Click vào trạng thái để thay đổi
          </span>
        </div>
        <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
          {members.map((member, idx) => {
            const status = attendanceData[member.userId] || 'present';
            const config = getStatusConfig(status);
            
            return (
              <motion.div
                key={member.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.02 }}
                className={`flex items-center gap-4 p-4 transition-all duration-200 ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/50'}`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl.startsWith('http') ? member.avatarUrl : `${BACKEND_URL}${member.avatarUrl}`}
                      alt={member.name}
                      className={`w-10 h-10 rounded-full object-cover ring-2 ${isDarkMode ? 'ring-white/10' : 'ring-gray-100'}`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold ring-2 ${isDarkMode ? 'ring-white/10' : 'ring-gray-100'}`}>
                      {getInitials(member.name)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{member.name}</p>
                  <p className={`text-[11px] font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                    {member.maHoiVien || '—'} · {member.email}
                  </p>
                </div>

                {/* Status buttons */}
                <div className="flex gap-1.5 shrink-0">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(member.userId, opt.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 border
                        ${status === opt.value
                          ? opt.color === 'emerald' ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' : 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm')
                            : opt.color === 'amber' ? (isDarkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm' : 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm')
                            : (isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm' : 'bg-red-100 text-red-700 border-red-300 shadow-sm')
                          : (isDarkMode ? 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100')}`}
                    >
                      {opt.emoji}
                      <span className="hidden sm:inline ml-1">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating save button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 z-50 md:hidden"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AttendanceMarking;
