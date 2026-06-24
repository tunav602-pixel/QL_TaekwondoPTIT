import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, CreditCard, Shield, Edit2, Check, X, ShieldAlert, Award, Activity, Hash, Wallet, Receipt, QrCode, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import api, { BACKEND_URL } from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';
import PaymentModal from '../../components/PaymentModal/PaymentModal';

const ROLE_BADGES = {
  'Super-Admin': { bg: 'bg-red-50/80', text: 'text-red-700', border: 'border-red-200/50', label: 'Super Admin' },
  'Sub-Admin': { bg: 'bg-blue-50/80', text: 'text-blue-700', border: 'border-blue-200/50', label: 'Sub-Admin' },
  'Member': { bg: 'bg-gray-50/80', text: 'text-gray-700', border: 'border-gray-200/50', label: 'Thành viên' }
};

const SUB_ROLE_LABELS = {
  'Chủ nhiệm': 'Chủ Nhiệm',
  'Ban chuyên môn': 'Ban Chuyên Môn',
  'Ban tài chính': 'Ban Tài Chính',
  'Ban sự kiện': 'Ban Sự Kiện',
  'Ban nhân sự': 'Ban Nhân Sự',
  'Ban truyền thông': 'Ban Truyền Thông'
};

const Profile = () => {
  const { isDarkMode } = useThemeStore();
  const { id } = useParams(); // Lấy ID từ URL (nếu xem user khác)
  const navigate = useNavigate();
  const { user: currentUser, setUser: updateStoreUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [paidExpenses, setPaidExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    studentId: ''
  });

  // Kiểm tra quyền chỉnh sửa
  const isOwnProfile = !id || id === currentUser.id;

  useEffect(() => {
    fetchProfile();
    fetchAttendanceStats();
    if (isOwnProfile) fetchMyExpenses();
  }, [id]);

  const fetchAttendanceStats = async () => {
    try {
      const endpoint = id ? `/attendance/stats/${id}` : '/attendance/my';
      const res = await api.get(endpoint);
      if (res.data.success) {
        setAttendanceStats(res.data.stats);
      }
    } catch (error) {
      console.error('Attendance stats error:', error);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Nếu có ID -> fetch /api/users/:id, nếu không -> fetch /api/users/profile
      const endpoint = id ? `/users/${id}` : '/users/profile';
      const res = await api.get(endpoint);
      
      if (res.data.success) {
        const u = res.data.user;
        setProfileUser(u);
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          dob: u.dob || '',
          gender: u.gender || 'Nam',
          studentId: u.studentId || ''
        });
        setAvatarPreview(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải thông tin profile.');
      if (id) navigate('/profile'); // Về profile cá nhân nếu ID lỗi
    } finally {
      setLoading(false);
    }
  };

  const fetchMyExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await api.get('/expenses/my');
      if (res.data.success) {
        setPendingExpenses(res.data.pending || []);
        setPaidExpenses(res.data.paid || []);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    if (profileUser) {
      setFormData({
        name: profileUser.name || '',
        phone: profileUser.phone || '',
        dob: profileUser.dob || '',
        gender: profileUser.gender || 'Nam',
        studentId: profileUser.studentId || ''
      });
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditMode(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Họ tên không được để trống!');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('dob', formData.dob);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('studentId', formData.studentId);
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }

      // Update profile
      const updateEndpoint = id ? `/users/${id}` : '/users/profile';
      const profileRes = await api.put(updateEndpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Cập nhật thông tin thành công!');
      
      // Reload profile
      await fetchProfile();
      setIsEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      // Nếu tự sửa profile của mình, đồng bộ lại Zustand store ngay lập tức
      if (isOwnProfile && profileRes.data.user) {
        updateStoreUser(profileRes.data.user);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra trong quá trình lưu thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const badgeStyle = isDarkMode ? {
    'Super-Admin': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Super Admin' },
    'Sub-Admin': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Sub-Admin' },
    'Member': { bg: 'bg-white/5', text: 'text-white/70', border: 'border-white/10', label: 'Thành viên' }
  }[profileUser?.role || 'Member'] : (ROLE_BADGES[profileUser?.role] || ROLE_BADGES['Member']);
  
  const getRoleDisplayText = () => {
    if (profileUser?.role === 'Super-Admin') return 'Super Admin';
    if (profileUser?.role === 'Sub-Admin' && profileUser?.subRole) {
      return `Sub-Admin - ${SUB_ROLE_LABELS[profileUser.subRole] || profileUser.subRole}`;
    }
    if (profileUser?.role === 'Sub-Admin') return 'Sub-Admin';
    return 'Thành viên';
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium text-sm mt-4">Đang tải hồ sơ...</p>
      </div>
    );
  }

  const attendanceRate = attendanceStats?.attendanceRate || 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full"
    >
      {/* Title */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(15,23,42,0.85)]">Hồ Sơ Thành Viên</h1>
          <p className="text-sm text-blue-100/90 font-medium mt-1 drop-shadow-[0_1px_4px_rgba(15,23,42,0.6)]">Thông tin chi tiết và chức vụ của thành viên câu lạc bộ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Overview Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 flex flex-col items-center text-center relative overflow-hidden hover:shadow-md transition-all duration-300 theme-card"
          >
            {/* Background design */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 animate-gradientFlow" style={{ backgroundSize: '200% 200%' }}></div>

            {/* Avatar block */}
            <div className="mt-4 relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className={`w-24 h-24 rounded-full object-cover ring-4 shadow-md transition-all duration-300 ${isDarkMode ? 'ring-white/10' : 'ring-blue-50'} ${isEditMode ? 'hover:scale-105 cursor-pointer hover:ring-blue-300' : ''}`}
                />
              ) : profileUser?.avatarUrl ? (
                <img
                  src={profileUser.avatarUrl.startsWith('http') ? profileUser.avatarUrl : `${BACKEND_URL}${profileUser.avatarUrl}`}
                  alt={profileUser.name}
                  className={`w-24 h-24 rounded-full object-cover ring-4 shadow-md transition-all duration-300 ${isDarkMode ? 'ring-white/10' : 'ring-blue-50'} ${isEditMode ? 'hover:scale-105 cursor-pointer hover:ring-blue-300' : ''}`}
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md ring-4 transition-all duration-300 ${isDarkMode ? 'ring-white/10' : 'ring-blue-50'} ${isEditMode ? 'hover:scale-105 cursor-pointer hover:ring-blue-300' : ''}`}>
                  {getInitials(profileUser?.name)}
                </div>
              )}
              
              {/* Avatar upload button - Only in edit mode */}
              {isEditMode && isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 active:scale-90 flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </label>
              )}
            </div>

            {/* Info details */}
            <h2 className={`text-lg font-bold mt-4 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profileUser?.name}</h2>
            <p className={`text-xs mt-1 truncate max-w-full ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>{profileUser?.email}</p>

            {/* Mã Hội Viên Badge */}
            {profileUser?.maHoiVien && (
              <div className={`mt-3 px-3.5 py-1.5 rounded-xl flex items-center gap-2 border
                ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-black tracking-wider">{profileUser.maHoiVien}</span>
              </div>
            )}

            {/* Role Badge */}
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                <Award className="w-3.5 h-3.5" />
                {getRoleDisplayText()}
              </span>
            </div>

            {/* Additional statistics/details */}
            <div className={`w-full mt-5 pt-4 border-t grid grid-cols-2 gap-4 text-left ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Mã sinh viên</span>
                <span className={`text-xs font-bold mt-0.5 block ${isDarkMode ? 'text-white/80' : 'text-gray-800'}`}>{profileUser?.studentId || 'Chưa cập nhật'}</span>
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Giới tính</span>
                <span className={`text-xs font-bold mt-0.5 block ${isDarkMode ? 'text-white/80' : 'text-gray-800'}`}>{profileUser?.gender || 'Nam'}</span>
              </div>
            </div>
          </motion.div>

          {/* Attendance Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 theme-card"
          >
            <h3 className={`text-sm font-bold flex items-center gap-2 w-full mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <Activity className="w-4 h-4 text-blue-500" /> Chuyên cần quý hiện tại
            </h3>
            
            {/* Circular Progress */}
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="circular-progress-bg" style={{ stroke: isDarkMode ? "rgba(255,255,255,0.06)" : "#e2e8f0" }} />
                <circle
                  cx="50" cy="50" r="40"
                  className="circular-progress-fill"
                  style={{
                    stroke: attendanceRate >= 66.67 ? '#10b981' : attendanceRate >= 40 ? '#f59e0b' : '#ef4444',
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Math.round(attendanceRate)}%</span>
              </div>
            </div>

            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Đi học</span>
                <span className="font-bold text-emerald-600">{attendanceStats?.presentCount || 0} buổi</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Nghỉ có phép</span>
                <span className="font-bold text-amber-600">{attendanceStats?.excusedCount || 0} buổi</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Nghỉ không phép</span>
                <span className="font-bold text-red-600">{attendanceStats?.absentCount || 0} buổi</span>
              </div>
              <div className={`flex justify-between text-xs pt-2 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
                <span className={`font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Tổng buổi CLB</span>
                <span className={`font-bold ${isDarkMode ? 'text-white/85' : 'text-gray-800'}`}>{attendanceStats?.totalSessions || 0} buổi</span>
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                attendanceRate >= 66.67 
                  ? (isDarkMode ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'badge-eligible') 
                  : (isDarkMode ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'badge-ineligible')
              }`}>
                {attendanceRate >= 66.67 ? '✅ Đủ điều kiện' : '❌ Chưa đủ điều kiện'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - Detailed Information Form */}
        <div className="md:col-span-2">
          <div className="rounded-2xl shadow-sm p-6 sm:p-8 theme-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <User className="w-5 h-5 text-blue-600" /> Thông tin cá nhân
              </h3>
              
              {/* Edit triggers */}
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    isDarkMode 
                      ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' 
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100/70'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      isDarkMode ? 'text-white/60 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Lưu lại
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <User className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Họ và Tên
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className={`w-full p-3 rounded-xl outline-none text-sm font-semibold theme-input ${
                    !isEditMode 
                      ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600') 
                      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              {/* Email (Readonly always) */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <Mail className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={profileUser?.email || ''}
                  disabled
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold cursor-not-allowed theme-input opacity-50"
                />
              </div>

              {/* Mã hội viên - Luôn Read-only và không thể chỉnh sửa */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-indigo-400/80' : 'text-indigo-600'}`}>
                  <Hash className="w-3.5 h-3.5 text-indigo-500" /> Mã Hội Viên (TKD PTIT ID)
                  <span className="text-[9px] text-indigo-500 font-bold ml-1">(Không thể sửa)</span>
                </label>
                <input
                  type="text"
                  value={profileUser?.maHoiVien || 'TKD-PTIT-NEW'}
                  disabled
                  className={`w-full p-3 rounded-xl outline-none text-sm font-bold cursor-not-allowed border ${
                    isDarkMode 
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                      : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                  }`}
                />
              </div>

              {/* Vai trò (Role) - Luôn Read-only, không cho phép user tự đổi */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <Shield className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Vai trò
                  <span className="text-[9px] text-amber-500 font-bold ml-1">(Chỉ đọc)</span>
                </label>
                <input
                  type="text"
                  value={getRoleDisplayText()}
                  disabled
                  className="w-full p-3 rounded-xl outline-none text-sm font-semibold cursor-not-allowed theme-input opacity-50"
                />
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <Phone className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Số điện thoại
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="VD: 037xxxxxxx"
                  className={`w-full p-3 rounded-xl outline-none text-sm font-semibold theme-input ${
                    !isEditMode 
                      ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600') 
                      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <Calendar className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Ngày sinh
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className={`w-full p-3 rounded-xl outline-none text-sm font-semibold theme-input ${
                    !isEditMode 
                      ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600') 
                      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <User className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Giới tính
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  className={`w-full p-3 rounded-xl outline-none text-sm font-semibold theme-select ${
                    !isEditMode 
                      ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600') 
                      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Student ID */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  <CreditCard className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`} /> Mã sinh viên (PTIT ID)
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  disabled={!isEditMode}
                  placeholder="VD: B21DCCNxxx"
                  className={`w-full p-3 rounded-xl outline-none text-sm font-semibold theme-input ${
                    !isEditMode 
                      ? (isDarkMode ? 'opacity-50 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600') 
                      : 'focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* ===== EXPENSE TABS (Only on own profile) ===== */}
      {isOwnProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          {/* Tab Navigation */}
          <div className="rounded-2xl shadow-sm overflow-hidden theme-card">
            <div className={`flex border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3.5 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'info'
                    ? (isDarkMode ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/10' : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30')
                    : (isDarkMode ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')
                }`}
              >
                <User className="w-4 h-4" /> Thông tin
              </button>
              <button
                onClick={() => { setActiveTab('pending'); if (pendingExpenses.length === 0) fetchMyExpenses(); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 relative ${
                  activeTab === 'pending'
                    ? (isDarkMode ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/10' : 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/30')
                    : (isDarkMode ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')
                }`}
              >
                <Wallet className="w-4 h-4" /> Khoản nợ
                {pendingExpenses.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                    {pendingExpenses.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { setActiveTab('paid'); if (paidExpenses.length === 0) fetchMyExpenses(); }}
                className={`flex-1 py-3.5 text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'paid'
                    ? (isDarkMode ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/10' : 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30')
                    : (isDarkMode ? 'text-white/40 hover:text-white/70 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50')
                }`}
              >
                <Receipt className="w-4 h-4" /> Đã thanh toán
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {/* === PENDING EXPENSES TAB === */}
              {activeTab === 'pending' && (
                <div className="space-y-3">
                  {expensesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className={`w-8 h-8 border-3 rounded-full animate-spin ${isDarkMode ? 'border-amber-500/30 border-t-amber-400' : 'border-amber-200 border-t-amber-500'}`} />
                    </div>
                  ) : pendingExpenses.length === 0 ? (
                    <div className="text-center py-10">
                      <Wallet className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? 'text-white/10' : 'text-gray-200'}`} />
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Không có khoản nợ nào 🎉</p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/30' : 'text-gray-300'}`}>Bạn đã thanh toán đầy đủ!</p>
                    </div>
                  ) : (
                    pendingExpenses.map((ue) => (
                      <div
                        key={ue._id}
                        onClick={() => { setSelectedPayment(ue); setIsPaymentModalOpen(true); }}
                        className={`rounded-xl p-4 transition-all cursor-pointer group border ${
                          isDarkMode 
                            ? 'bg-white/[0.06] border-white/10 hover:bg-white/[0.09] hover:border-blue-500/30 hover:shadow-lg hover:shadow-black/30' 
                            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{ue.expense?.title || 'Khoản chi'}</h4>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                              {ue.expense?.createdByName ? `Bởi ${ue.expense.createdByName}` : ''}
                              {ue.expense?.deadline && ` • Hạn: ${new Date(ue.expense.deadline).toLocaleDateString('vi-VN')}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-base font-black ${isDarkMode ? 'text-red-450' : 'text-red-600'}`}>{(ue.amount || 0).toLocaleString('vi-VN')}đ</p>
                              {ue.status === 'pending' ? (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                  <Clock className="w-3 h-3" /> Chờ thanh toán
                                </span>
                              ) : ue.status === 'paid' ? (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  <Clock className="w-3 h-3" /> Chờ xác nhận
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                                  <AlertCircle className="w-3 h-3" /> Bị từ chối
                                </span>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-colors ${isDarkMode ? 'text-white/50 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* === PAID EXPENSES TAB === */}
              {activeTab === 'paid' && (
                <div className="space-y-3">
                  {expensesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className={`w-8 h-8 border-3 rounded-full animate-spin ${isDarkMode ? 'border-emerald-500/30 border-t-emerald-400' : 'border-emerald-200 border-t-emerald-500'}`} />
                    </div>
                  ) : paidExpenses.length === 0 ? (
                    <div className="text-center py-10">
                      <Receipt className={`w-10 h-10 mx-auto mb-3 ${isDarkMode ? 'text-white/10' : 'text-gray-200'}`} />
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Chưa có lịch sử thanh toán</p>
                    </div>
                  ) : (
                    paidExpenses.map((ue) => (
                      <div
                        key={ue._id}
                        className={`rounded-xl p-4 border transition-all ${
                          isDarkMode 
                            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-sm shadow-emerald-950/20' 
                            : 'bg-emerald-50 border-emerald-100 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{ue.expense?.title || 'Khoản chi'}</h4>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                              Thanh toán: {ue.paidAt ? new Date(ue.paidAt).toLocaleDateString('vi-VN') : '-'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-base font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{(ue.amount || 0).toLocaleString('vi-VN')}đ</p>
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 justify-end ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              <CheckCircle className="w-3 h-3" /> Đã xác nhận
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* === INFO TAB (default - empty, main content is above) === */}
              {activeTab === 'info' && (
                <div className="text-center py-6">
                  <User className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-white/10' : 'text-gray-200'}`} />
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Thông tin cá nhân được hiển thị ở phần trên</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedPayment(null); }}
        userExpense={selectedPayment}
        onPaymentSuccess={fetchMyExpenses}
      />
    </motion.div>
  );
};

export default Profile;
