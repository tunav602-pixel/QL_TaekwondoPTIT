import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, UserPlus, User, ImagePlus, Shield, CheckCircle, Trophy, BookOpen, Wallet, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logoclb.png';

import { BACKEND_URL } from '../../lib/axios';

const API_BASE = BACKEND_URL;

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    maHoiVien: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }
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
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('password', formData.password);
      if (formData.maHoiVien.trim()) {
        fd.append('maHoiVien', formData.maHoiVien.trim());
      }
      if (avatarFile) {
        fd.append('avatar', avatarFile);
      }

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: fd
      });

      const data = await res.json();

      if (data.success) {
        const user = { ...data.user };
        if (user.avatarUrl && !user.avatarUrl.startsWith('http')) {
          user.avatarUrl = `${API_BASE}${user.avatarUrl}`;
        }
        login(user, data.token);
        toast.success('Đăng ký tài khoản thành công! 🎉');
        navigate('/', { replace: true });
      } else {
        toast.error(data.message || 'Đăng ký thất bại.');
      }
    } catch {
      toast.error('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { level: 0, text: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { level: score, text: 'Yếu', color: 'bg-red-400' };
    if (score <= 3) return { level: score, text: 'Trung bình', color: 'bg-yellow-400' };
    return { level: score, text: 'Mạnh', color: 'bg-emerald-400' };
  };

  const pwStrength = getPasswordStrength();

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-[#f8fafc]">
      
      {/* LEFT SIDE - Brand Presentation (Only on desktop md and up) */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="hidden md:flex md:w-[50%] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] relative p-16 flex-col justify-between text-white overflow-hidden select-none">
        
        {/* Glowing visual decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        
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
        <div className="my-auto z-10 max-w-lg animate-[fadeIn_1s_ease-out]">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Tạo Tài Khoản Thành Viên
          </span>
          <h1 className="text-3xl lg:text-4xl font-black leading-tight text-white mb-6 tracking-tight">
            Gia nhập mái nhà chung <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Taekwondo PTIT Club
            </span>
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Đăng ký tài khoản cá nhân để cập nhật học phí tập luyện hàng tháng, gửi yêu cầu chi tiêu sự kiện, đăng ký tham gia thi đấu và theo dõi quỹ câu lạc bộ một cách minh bạch nhất.
          </p>

          {/* Quick info badges */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5 bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Quản lý đóng quỹ</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Minh bạch hóa mọi hoạt động tài chính thu chi.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-white">Đăng ký mua đai & võ phục</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Đặt đai, áo đấu nhanh chóng qua hệ thống nội bộ.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="z-10 flex items-center justify-between text-xs text-gray-400 pt-6 border-t border-white/10 animate-[fadeIn_1.2s_ease-out]">
          <span className="font-semibold text-blue-300">Taekwondo PTIT Club</span>
          <span>© 2026. Thiết kế cao cấp</span>
        </div>
      </motion.div>

      {/* RIGHT SIDE - Form Area */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="w-full md:w-[50%] flex items-center justify-center p-6 sm:p-12 md:p-12 bg-white relative z-10 min-h-screen">
        
        {/* Soft background glow */}
        <div className="absolute top-10 left-10 w-48 h-48 bg-blue-100/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-100/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md flex flex-col justify-center animate-[fadeIn_0.5s_ease-out] py-6">
          
          {/* Mobile Logo */}
          <div className="flex md:hidden flex-col items-center mb-6">
            <div className="bg-blue-50 p-2 rounded-2xl border border-blue-100 mb-2 shadow-md">
              <img src={logoImg} alt="Taekwondo PTIT Logo" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-wide">TAEKWONDO PTIT</h2>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Quản lý Tài chính CLB</p>
          </div>

          {/* Form Header */}
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Tạo tài khoản</h1>
            <p className="text-gray-500 text-xs">Đăng ký thông tin thành viên tập luyện của bạn.</p>
          </div>

          {/* Register Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-all group overflow-hidden bg-gray-50 flex items-center justify-center"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 p-2 text-center">
                    <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[9px] text-gray-400 font-bold group-hover:text-blue-500">Avatar</span>
                  </div>
                )}
                {avatarPreview && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <ImagePlus className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onAvatarChange}
                className="hidden"
              />
              <span className="text-[10px] text-gray-400 mt-1 font-semibold">Tải ảnh đại diện cá nhân</span>
            </div>

            {/* Name Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">Họ và tên thành viên</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="VD: Nguyễn Tuấn Việt"
                  className={`w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-xs font-semibold
                    ${errors.name ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] font-bold mt-0.5">⚠️ {errors.name}</p>}
            </div>

            {/* Mã Hội Viên Field (Optional) */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                Mã hội viên
                <span className="text-[9px] text-gray-400 font-semibold normal-case ml-1">(Tùy chọn)</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="maHoiVien"
                  value={formData.maHoiVien}
                  onChange={onChange}
                  placeholder="Để trống → Hệ thống tự tạo (TKD-PTIT-XXXX)"
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-xs font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50"
                />
              </div>
              <p className="text-[9px] text-gray-400 font-medium">Nếu bạn chưa có mã, hệ thống sẽ tự động tạo mã TKD-PTIT-XXXX.</p>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">Email liên hệ</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="VD: tunav602@gmail.com"
                  className={`w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-xs font-semibold
                    ${errors.email ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-0.5">⚠️ {errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full pl-11 pr-11 py-2.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-xs font-semibold
                    ${errors.password ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {formData.password && (
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength.level ? pwStrength.color : 'bg-gray-200'}`}></div>
                    ))}
                  </div>
                  <span className={`text-[9px] font-bold ${pwStrength.level <= 2 ? 'text-red-500' : pwStrength.level <= 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                    {pwStrength.text}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-[10px] font-bold mt-0.5">⚠️ {errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-700 uppercase tracking-wider">Nhập lại mật khẩu</label>
              <div className="relative">
                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={onChange}
                  placeholder="Xác nhận lại mật khẩu"
                  className={`w-full pl-11 pr-11 py-2.5 bg-gray-50/50 border rounded-xl text-gray-900 placeholder-gray-400 outline-none transition-all text-xs font-semibold
                    ${errors.confirmPassword ? 'border-red-400 focus:ring-4 focus:ring-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 hover:bg-gray-50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold mt-0.5">⚠️ {errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-md shadow-blue-600/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Đăng ký tài khoản
                </>
              )}
            </button>
          </form>

          {/* Login Link section */}
          <div className="mt-6 text-center border-t border-gray-100 pt-5">
            <p className="text-gray-500 text-xs font-medium">
              Đã đăng ký tài khoản thành viên?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-extrabold transition-colors underline decoration-blue-600/30">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-[10px]">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Mật khẩu được mã hóa an toàn 12 rounds bcrypt</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;
