import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn, Shield, Wallet, BookOpen, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/axios';
import logoImg from '../../assets/logoclb.png';
import OTPVerification from './OTPVerification';
import useThemeStore from '../../store/useThemeStore';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otpData, setOtpData] = useState({ userId: '', email: '' });

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kiểm tra cờ phiên hết hạn khi trang Login được mount
  useEffect(() => {
    const isExpired = sessionStorage.getItem('tkd_session_expired');
    if (isExpired) {
      sessionStorage.removeItem('tkd_session_expired');
      toast.warning('⏰ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.', {
        autoClose: 4000,
        icon: '🔐'
      });
    }
  }, []);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    console.log('🔐 Submitting login...', formData.email);
    
    try {
      console.log('📡 Sending request to /auth/login...');
      const res = await api.post('/auth/login', formData);
      console.log('✅ Response received:', res);
      console.log('📦 Response data:', res.data);
      console.log('🔍 Success:', res.data.success);
      console.log('🔍 RequireOTP:', res.data.requireOTP);
      
      if (res.data.success) {
        console.log('✅ Success is true');
        if (res.data.requireOTP) {
          console.log('🔐 OTP required - Admin login');
          console.log('Setting OTP data:', { userId: res.data.userId, email: res.data.email });
          
          // Use setTimeout to ensure state is updated before rendering
          setTimeout(() => {
            setOtpData({ userId: res.data.userId, email: res.data.email, otpCode: res.data.otpCode });
            setShowOTPScreen(true);
            toast.info('Vui lòng kiểm tra email để lấy mã OTP! 📧');
          }, 100);
        } else {
          console.log('👤 Regular member login');
          // Regular member login - Direct login
          login(res.data.user, res.data.token);
          toast.success('Đăng nhập thành công! 🥋');
          navigate('/', { replace: true });
        }
      } else {
        console.log('❌ Success is false');
        toast.error(res.data.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('❌ Login error caught:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      const msg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      toast.error(msg);
    } finally {
      console.log('🏁 Login process finished');
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOTPScreen(false);
    setOtpData({ userId: '', email: '' });
  };

  // If OTP screen is active, show OTP component
  if (showOTPScreen) {
    return <OTPVerification userId={otpData.userId} email={otpData.email} otpCode={otpData.otpCode} onBack={handleBackToLogin} />;
  }

  return (
    <div className={`w-full min-h-screen flex flex-col md:flex-row relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#121212]' : 'bg-[#f8fafc]'}`}>
      
      {/* LEFT SIDE - Brand Presentation (Only on desktop md and up) */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:flex md:w-[50%] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] relative p-16 flex-col justify-between text-white overflow-hidden select-none">
        
        {/* Glowing visual decorations */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        
        {/* Brand Header */}
        <div className="flex items-center gap-4 z-10 animate-[fadeIn_0.8s_ease-out]">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-lg">
            <img src={logoImg} alt="Taekwondo PTIT Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl tracking-wider leading-none">TAEKWONDO PTIT</h2>
            <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-1 block">CLB VÕ THUẬT HỌC VIỆN</span>
          </div>
        </div>

        {/* Brand Content Center */}
        <div className="my-auto z-10 max-w-xl animate-[fadeIn_1s_ease-out]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Hệ Thống Quản Lý Tài Chính Mới
          </span>
          <h1 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-6 tracking-tight">
            Minh bạch, chuyên nghiệp <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Quản lý tài chính CLB
            </span>
          </h1>
          <p className="text-gray-300 text-base leading-relaxed mb-10">
            Chào mừng bạn đến với cổng thông tin tài chính chính thức của Câu lạc bộ Taekwondo PTIT. Hãy đăng nhập để cập nhật học phí, xem lịch sử thu chi và theo dõi quỹ hoạt động.
          </p>

          {/* Key Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-5 rounded-2xl hover:bg-white/[0.06] transition-all hover:scale-105 duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Theo Dõi Quỹ</h3>
              <p className="text-xs text-gray-400 leading-snug">Theo dõi số dư quỹ, thu chi thời gian thực.</p>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-5 rounded-2xl hover:bg-white/[0.06] transition-all hover:scale-105 duration-300">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Đóng Học Phí</h3>
              <p className="text-xs text-gray-400 leading-snug">Cập nhật trạng thái đóng học phí của thành viên.</p>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-5 rounded-2xl hover:bg-white/[0.06] transition-all hover:scale-105 duration-300">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white mb-1">Giải Đấu & Sự Kiện</h3>
              <p className="text-xs text-gray-400 leading-snug">Quản lý ngân sách các hoạt động sự kiện, giải đấu.</p>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="z-10 flex items-center justify-between text-xs text-gray-400 pt-6 border-t border-white/10 animate-[fadeIn_1.2s_ease-out]">
          <span className="font-semibold text-blue-300">Taekwondo PTIT Club</span>
          <span>© 2026. Thiết kế cao cấp</span>
        </div>
      </motion.div>

      {/* RIGHT SIDE - Form Area (Full screen on mobile, 50% on desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-12 md:p-16 bg-white relative z-10 min-h-screen">
        
        {/* Soft background glow for modern look */}
        <div className="absolute top-10 right-10 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md flex flex-col justify-center animate-[fadeIn_0.5s_ease-out]">
          
          {/* Logo only visible on mobile */}
          <div className="flex md:hidden flex-col items-center mb-6">
            <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-100 mb-3 shadow-md">
              <img src={logoImg} alt="Taekwondo PTIT Logo" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-wide leading-none">TAEKWONDO PTIT</h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Quản lý Tài chính CLB</p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Đăng nhập</h1>
            <p className="text-gray-500 text-sm">Chào mừng quay trở lại! Điền thông tin đăng nhập của bạn.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email tài khoản</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="VD: nguyenvana@gmail.com"
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-sm font-medium
                    ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-0.5"><span>⚠️</span> {errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</label>
                <Link to="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-sm font-medium
                    ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-0.5"><span>⚠️</span> {errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  Đăng nhập ngay
                </>
              )}
            </button>
          </form>

          {/* Register Redirect Section */}
          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm font-medium">
              Chưa có tài khoản thành viên?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-extrabold transition-colors decoration-blue-600/30 hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </p>
          </div>

          {/* Security details */}
          <div className="flex items-center justify-center gap-2 mt-8 text-gray-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Xác thực an toàn bằng mã hóa JWT & bcrypt</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
