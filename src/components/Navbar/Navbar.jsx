import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, UserCircle, ChevronDown, Menu, X, Users, CalendarCheck, Bell, CheckCheck, CreditCard } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { BACKEND_URL } from '../../lib/axios';
import useNotificationStore from '../../store/useNotificationStore';
import useTaskStore from '../../store/useTaskStore';
import useThemeStore from '../../store/useThemeStore';
import SettingsModal from '../SettingsModal/SettingsModal';
import logoImg from '../../assets/logoclb.png';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { hasActiveTasks, fetchTasks } = useTaskStore();
  const { isDarkMode } = useThemeStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check if user is Super Admin
  const isSuperAdmin = user?.email === 'tunav602@gmail.com' && user?.role === 'Super-Admin';
  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';

  // Scroll detection for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Poll notifications unread count mỗi 30 giây
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Kiểm tra tác vụ nền khi Admin đăng nhập
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchTasks();
    }
  }, [isAuthenticated, isAdmin]);

  // Close dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsDropdownOpen(false), 200);
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  // Lấy chữ cái đầu tên cho avatar fallback
  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  // Nav link style — nguyenxuantai.com inspired
  const navLinkClass = ({isActive}) => {
    const base = 'text-[13px] font-semibold transition-all duration-300 cursor-pointer relative group px-2.5 py-1.5 rounded-lg whitespace-nowrap';
    if (isActive) {
      return `${base} text-blue-500 dark:text-blue-400 bg-blue-500/10`;
    }
    return `${base} ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'} hover:scale-[1.05]`;
  };

  // Animated underline element
  const NavUnderline = ({ isActive }) => (
    <span className={`absolute -bottom-0.5 left-2 right-2 h-[2px] bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300 ${isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'}`} />
  );

  return (
    <div className={`sticky top-0 z-50 py-4 flex justify-between items-center transition-all duration-500 rounded-2xl px-6 border backdrop-blur-xl ${
      isDarkMode 
        ? (isScrolled 
          ? 'bg-[#0f172a]/92 border-white/10 shadow-lg shadow-black/20 mt-3' 
          : 'bg-white/[0.03] border-white/5')
        : (isScrolled 
          ? 'bg-white/96 border-slate-200/80 shadow-lg shadow-slate-200/20 mt-3' 
          : 'bg-white/85 border-white/60 shadow-sm')
    }`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className={`backdrop-blur-sm p-1.5 rounded-xl group-hover:scale-105 duration-300 group-hover:shadow-lg transition-all border ${
          isDarkMode 
            ? 'bg-white/10 border-white/10 group-hover:bg-white/15 group-hover:border-white/20 group-hover:shadow-blue-500/10' 
            : 'bg-white/80 border-slate-200 group-hover:bg-white/100 group-hover:border-slate-300 group-hover:shadow-blue-500/5'
        }`}>
          <img src={logoImg} alt="Taekwondo PTIT Logo" className="w-9 h-9 object-contain" />
        </div>
        <div className="flex flex-col">
          <span className={`font-bold text-xl leading-none tracking-tight transition-all duration-300 ${
            isDarkMode ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]' : 'text-slate-800'
          }`}>
            TAEKWONDO PTIT
          </span>
          <span className={`font-semibold text-[10px] uppercase tracking-widest mt-1 transition-all duration-300 ${
            isDarkMode ? 'text-blue-400/80' : 'text-blue-600'
          }`}>
            Quản lý Tài chính CLB
          </span>
        </div>
      </Link>
      
      {/* Menu - Desktop — flex-1 centered to respect other elements */}
      {isAuthenticated && (
        <div className="hidden md:flex items-center gap-1.5 justify-center flex-1 mx-4 max-w-full">
          <NavLink to="/" end className={(props) => navLinkClass(props)}>
            {({isActive}) => (<>Tổng quan<NavUnderline isActive={isActive} /></>)}
          </NavLink>

          <NavLink to="/finance" className={(props) => navLinkClass(props)}>
            {({isActive}) => (<>Tài chính<NavUnderline isActive={isActive} /></>)}
          </NavLink>

          {/* Admin-only: Hội viên & Điểm danh & Khoản thu */}
          {isAdmin && (
            <>
              <NavLink to="/members" className={(props) => navLinkClass(props)}>
                {({isActive}) => (<>Hội viên<NavUnderline isActive={isActive} /></>)}
              </NavLink>
              
              <NavLink to="/expense-management" className={(props) => navLinkClass(props)}>
                {({isActive}) => (<>Khoản thu<NavUnderline isActive={isActive} /></>)}
              </NavLink>

              <NavLink to="/deposit-approval" className={(props) => navLinkClass(props)}>
                {({isActive}) => (<>Duyệt giao dịch<NavUnderline isActive={isActive} /></>)}
              </NavLink>
            </>
          )}
          
          {/* Show "Đăng ký Admin" only for Super Admin */}
          {isSuperAdmin && (
            <NavLink to="/admin-register" className={({isActive}) => {
              const base = 'text-[13px] font-semibold transition-all duration-300 cursor-pointer relative group px-2.5 py-1.5 rounded-lg whitespace-nowrap';
              return isActive 
                ? `${base} text-red-500 dark:text-red-400 bg-red-500/10` 
                : `${base} ${isDarkMode ? 'text-white/50 hover:text-red-400' : 'text-slate-500 hover:text-red-600'} hover:scale-[1.05]`;
            }}>
              {({isActive}) => (<>Đăng ký Admin<NavUnderline isActive={isActive} /></>)}
            </NavLink>
          )}
        </div>
      )}

      {/* Right side - Notification Bell + Admin Dropdown hoặc Login Button */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user ? (
          <>
            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  if (!isNotifOpen) fetchNotifications();
                }}
                className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer 
                  ${isDarkMode 
                    ? 'text-white/40 hover:text-white hover:bg-white/[0.06]' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              <div className={`absolute right-0 top-full mt-2 w-80 sm:w-96 transition-all duration-200 origin-top-right ${
                isNotifOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}>
                <div className={`overflow-hidden max-h-[420px] flex flex-col !rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300
                  ${isDarkMode 
                    ? 'bg-[#0f172a]/95 border-white/10 text-white shadow-black/45' 
                    : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/40'}`}>
                  {/* Header */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between
                    ${isDarkMode ? 'bg-blue-500/5 border-white/10 text-white' : 'bg-blue-50/30 border-slate-100 text-slate-800'}`}>
                    <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>🔔 Thông báo</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                        className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
                      </button>
                    )}
                  </div>
                  {/* List */}
                  <div className="overflow-y-auto flex-1 dark-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <Bell className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-white/10' : 'text-slate-200'}`} />
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Chưa có thông báo nào</p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) markAsRead(notif._id);
                          }}
                          className={`px-4 py-3 border-b transition-colors cursor-pointer
                            ${isDarkMode 
                              ? 'border-white/[0.04] hover:bg-white/[0.04] text-white/80' 
                              : 'border-slate-100 hover:bg-slate-50 text-slate-700'} 
                            ${!notif.isRead ? (isDarkMode ? 'bg-blue-500/5' : 'bg-blue-50/40') : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              !notif.isRead ? 'bg-blue-500 dark:bg-blue-400' : 'bg-transparent'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white/80' : 'text-slate-800'}`}>{notif.title}</p>
                              <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>{notif.message}</p>
                              <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-white/20' : 'text-slate-400/60'}`}>
                                {new Date(notif.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl transition-colors text-white/60 hover:text-white hover:bg-white/[0.06]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>            {/* Admin Dropdown */}
            {isAuthenticated && user && (
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Trigger Button */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2.5 border px-4 py-2 rounded-full cursor-pointer transition-all duration-200 font-medium
                    ${isDropdownOpen 
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-500 dark:text-blue-400 shadow-md shadow-blue-500/10' 
                      : (isDarkMode 
                        ? 'border-white/15 hover:border-white/30 hover:bg-white/[0.06] text-white/70 hover:text-white'
                        : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 hover:text-slate-800')}`}
                >
                  {/* Avatar */}
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BACKEND_URL}${user.avatarUrl}`}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm">{user.name?.split(' ').pop()}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-2 w-72 transition-all duration-200 origin-top-right z-50
                    ${isDropdownOpen 
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                >
                  <div className={`overflow-hidden !rounded-2xl border backdrop-blur-2xl shadow-xl transition-all duration-300
                    ${isDarkMode 
                      ? 'bg-[#0f172a]/95 border-white/10 text-white shadow-black/40' 
                      : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/40'}`}>
                    {/* Header - User info */}
                    <Link 
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className={`block px-5 py-4 border-b transition-all
                        ${isDarkMode 
                          ? 'bg-blue-500/5 border-white/10 hover:bg-blue-500/10' 
                          : 'bg-blue-50/30 border-slate-100 hover:bg-blue-50/60'}`}
                    >
                      <div className="flex items-center gap-3.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${BACKEND_URL}${user.avatarUrl}`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover ring-3 ring-white/10 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold ring-3 ring-white/10 shadow-md">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user.name}</h4>
                          <p className="text-blue-500 dark:text-blue-400 text-xs font-semibold mt-0.5 animate-pulse">
                            {user.role === 'Super-Admin' ? 'Super Admin' : user.role === 'Sub-Admin' ? `Sub-Admin - ${user.subRole}` : 'Thành viên'}
                          </p>
                          <p className={`text-[11px] truncate mt-0.5 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>{user.email}</p>
                        </div>
                      </div>
                    </Link>

                    {/* Menu items */}
                    <div className="py-2 px-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group
                          ${isDarkMode ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                      >
                        <UserCircle className="w-4.5 h-4.5 text-white/30 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium">Thông tin tài khoản</span>
                      </Link>
                      <Link
                        to="/transaction-history"
                        onClick={() => setIsDropdownOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group
                          ${isDarkMode ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                      >
                        <CreditCard className="w-4.5 h-4.5 text-white/30 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium">Lịch sử giao dịch</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group cursor-pointer text-left
                          ${isDarkMode ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                      >
                        <Settings className="w-4.5 h-4.5 text-white/30 group-hover:text-blue-400 transition-colors" />
                        <span className="text-sm font-medium">Cài đặt hệ thống</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className={`mx-4 h-px ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-100'}`}></div>

                    {/* Logout */}
                    <div className="py-2 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors group cursor-pointer"
                      >
                        <LogOut className="w-4.5 h-4.5 text-red-400/60 group-hover:text-red-400 transition-colors" />
                        <span className="text-sm font-semibold">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <Link
            to="/login"
            className={`px-6 py-2 rounded-full cursor-pointer transition-all duration-300 font-medium flex items-center gap-2 border
              ${isDarkMode 
                ? 'border-white/20 hover:border-blue-400/50 text-white/70 hover:text-white hover:bg-white/[0.06]' 
                : 'border-slate-300 hover:border-blue-500/50 text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'}`}
          >
            <User className="w-4 h-4" /> Đăng nhập
          </Link>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isAuthenticated && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[76px] z-[99] md:hidden animate-fadeIn transition-all duration-300 overflow-y-auto" 
          style={{ 
            background: isDarkMode ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)', 
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)'
          }}
        >
          <div className="flex flex-col p-6 gap-2 pb-16">
            <NavLink
              to="/"
              end
              onClick={() => setIsMobileMenuOpen(false)}
              className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors ${
                isActive 
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                  : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              Tổng quan
            </NavLink>

            <NavLink
              to="/finance"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors ${
                isActive 
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                  : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              Quản lý Tài chính
            </NavLink>

            <NavLink
              to="/transaction-history"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2 ${
                isActive 
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                  : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              <CreditCard className="w-5 h-5" /> Lịch sử giao dịch
            </NavLink>

            {/* Admin-only: Hội viên & Điểm danh & Khoản thu */}
            {isAdmin && (
              <>
                <NavLink
                  to="/members"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                      : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                  }`}
                >
                  <Users className="w-5 h-5" /> Quản lý Hội viên
                </NavLink>
                <NavLink
                  to="/attendance"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                      : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                  }`}
                >
                  <CalendarCheck className="w-5 h-5" /> Điểm danh buổi tập
                </NavLink>
                <NavLink
                  to="/expense-management"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                      : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                  }`}
                >
                  <CreditCard className="w-5 h-5" /> Quản lý Khoản thu
                </NavLink>
                <NavLink
                  to="/deposit-approval"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors flex items-center gap-2 ${
                    isActive 
                      ? 'text-blue-500 dark:text-blue-400 bg-blue-500/10' 
                      : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
                  }`}
                >
                  <CheckCheck className="w-5 h-5" /> Duyệt giao dịch
                </NavLink>
              </>
            )}
            
            {/* Show "Đăng ký Admin" only for Super Admin */}
            {isSuperAdmin && (
              <NavLink
                to="/admin-register"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({isActive}) => `text-lg font-medium py-3 px-4 rounded-xl transition-colors ${
                  isActive 
                    ? 'text-red-400 bg-red-500/10' 
                    : (isDarkMode ? 'text-white/60 hover:text-white hover:bg-white/[0.04]' : 'text-slate-600 hover:text-red-500 hover:bg-red-500/5')
                }`}
              >
                Đăng ký Admin
              </NavLink>
            )}
            
            <div className={`h-px my-2 ${isDarkMode ? 'bg-white/[0.06]' : 'bg-slate-200'}`}></div>
            <button
              onClick={handleLogout}
              className="text-lg font-semibold py-3 px-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-left flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Navbar;
