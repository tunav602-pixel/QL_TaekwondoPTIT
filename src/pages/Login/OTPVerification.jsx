import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/useAuthStore';
import api from '../../lib/axios';
import useThemeStore from '../../store/useThemeStore';

const OTPVerification = ({ userId, email, otpCode: initialOtpCode, onBack }) => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [currentOtpCode, setCurrentOtpCode] = useState(initialOtpCode || '');
  const inputRefs = useRef([]);

  // Debug: Log props khi component mount
  useEffect(() => {
    console.log('OTPVerification mounted with:', { userId, email });
    if (!userId || !email) {
      console.error('Missing userId or email!');
      toast.error('Lỗi: Thiếu thông tin người dùng. Vui lòng đăng nhập lại.');
      onBack();
    }
  }, [userId, email, onBack]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Ô hiện tại có giá trị → xóa nó
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // Ô trống → lùi về ô trước và xóa ô đó
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      toast.error('Vui lòng nhập đầy đủ 6 số mã OTP!');
      return;
    }

    console.log('Submitting OTP:', { userId, otpCode }); // Debug log

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, otpCode });
      console.log('OTP verification response:', res.data); // Debug log
      
      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success('Xác thực OTP thành công! 🎉');
        navigate('/', { replace: true });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Mã OTP không chính xác. Vui lòng thử lại.';
      toast.error(msg);
      console.error('OTP verification error:', error); // Debug log
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    console.log('Resending OTP for userId:', userId); // Debug log
    
    setIsResending(true);
    try {
      const res = await api.post('/auth/resend-otp', { userId });
      console.log('Resend OTP response:', res.data); // Debug log
      
      if (res.data.success) {
        toast.success('Mã OTP mới đã được gửi đến email của bạn!');
        setCountdown(300); // Reset countdown
        setOtp(['', '', '', '', '', '']);
        if (res.data.otpCode) {
          setCurrentOtpCode(res.data.otpCode);
        }
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      toast.error(msg);
      console.error('Resend OTP error:', error); // Debug log
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={`w-full min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-[#121212]' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Background decorations */}
      <div className={`absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
        isDarkMode ? 'bg-blue-500/5' : 'bg-blue-200/30'
      }`} />
      <div className={`absolute bottom-10 left-10 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
        isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-200/30'
      }`} />

      <div className={`w-full max-w-md rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 animate-[fadeIn_0.5s_ease-out] transition-colors duration-500 ${
        isDarkMode 
          ? 'bg-[#1e1e1e] border border-white/[0.08] shadow-black/50' 
          : 'bg-white shadow-blue-200/50'
      }`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Xác Thực OTP</h1>
          <p className={`text-sm mt-2 text-center ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
            Mã OTP đã được gửi đến email <br />
            <span className="font-bold text-blue-500">{email}</span>
          </p>
        </div>

        {/* Dev OTP Banner */}
        {currentOtpCode && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left animate-slideDown shadow-sm">
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>🛠️ Trình Trợ Giúp Phát Triển</span>
            </p>
            <p className="text-amber-700 text-[11px] leading-relaxed">
              Hệ thống chưa cấu hình SMTP email trên local. Vui lòng sử dụng mã OTP dưới đây để đăng nhập:
            </p>
            <div className="mt-2.5 flex justify-center">
              <code className="bg-amber-100 border border-amber-300 text-amber-900 font-black text-lg px-4 py-1 rounded-xl tracking-widest font-mono select-all cursor-pointer hover:bg-amber-200 transition-colors" title="Nhấp đúp để chọn tất cả">
                {currentOtpCode}
              </code>
            </div>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all ${
                  isDarkMode
                    ? 'bg-white/[0.06] border-white/15 text-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 focus:bg-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 focus:bg-white'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Countdown Timer */}
          <div className="text-center">
            <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
              Mã OTP có hiệu lực trong:{' '}
              <span className={`font-bold ${countdown < 60 ? 'text-red-500' : 'text-blue-500'}`}>
                {formatTime(countdown)}
              </span>
            </p>
          </div>


          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || otp.join('').length !== 6}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Xác nhận OTP
              </>
            )}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <button
            onClick={handleResendOTP}
            disabled={isResending || countdown > 240}
            className={`text-sm font-semibold transition-colors flex items-center justify-center gap-2 mx-auto disabled:cursor-not-allowed ${isDarkMode ? 'text-blue-400 hover:text-blue-300 disabled:text-white/25' : 'text-blue-600 hover:text-blue-700 disabled:text-gray-400'}`}
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
          </button>
          {countdown > 240 && (
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>Bạn có thể gửi lại sau {formatTime(countdown - 240)}</p>
          )}
        </div>

        {/* Back Button */}
        <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-white/[0.07]' : 'border-gray-100'}`}>
          <button
            onClick={onBack}
            className={`w-full flex items-center justify-center gap-2 font-medium text-sm transition-colors ${isDarkMode ? 'text-white/40 hover:text-white/80' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </button>
        </div>

        {/* Security Note */}
        <div className={`flex items-center justify-center gap-2 mt-6 text-xs ${isDarkMode ? 'text-white/25' : 'text-gray-400'}`}>
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Bảo mật 2 lớp cho tài khoản Admin</span>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
