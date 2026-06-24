import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition/PageTransition';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard/Dashboard';
import AddTransaction from './pages/AddTransaction/AddTransaction';
import Transactions from './pages/Transactions/Transactions';
import Finance from './pages/Finance/Finance';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Profile from './pages/Profile/Profile';
import AdminRegister from './pages/AdminRegister/AdminRegister';
import MemberManagement from './pages/MemberManagement/MemberManagement';
import AttendanceMarking from './pages/AttendanceMarking/AttendanceMarking';
import ExpenseManagement from './pages/ExpenseManagement/ExpenseManagement';
import DepositApproval from './pages/DepositApproval/DepositApproval';
import TransactionHistory from './pages/TransactionHistory/TransactionHistory';
import useAuthStore from './store/useAuthStore';
import useThemeStore from './store/useThemeStore';
import CustomCursor from './components/CustomCursor/CustomCursor';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { isAuthenticated, isLoading, loadFromStorage, user } = useAuthStore();
  const { initTheme, isDarkMode, showVideoBg } = useThemeStore();
  const location = useLocation();

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('ptit_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check if user is Super Admin
  const isSuperAdmin = user?.email === 'tunav602@gmail.com' && user?.role === 'Super-Admin';
  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';

  // Hydrate auth state từ localStorage khi app khởi động
  useEffect(() => {
    loadFromStorage();
    initTheme();
  }, []);

  useEffect(() => {
    localStorage.setItem('ptit_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Hiển thị loading spinner khi đang check auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium text-sm">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center overflow-x-hidden relative transition-colors duration-500 w-full bg-transparent">
      
      {/* Global Base Background Layer — Dark: Charcoal Black, Light: Clean slate gradient */}
      <div 
        className={`fixed -inset-10 -z-60 transition-all duration-500 ${isDarkMode ? 'bg-[#121212]' : 'bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#f1f5f9]'}`}
      />

      {/* Custom Premium Follower Cursor */}
      <CustomCursor />

      {isDarkMode && showVideoBg && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-1/2 left-1/2 w-[100vh] h-[100vw] min-w-[100vh] min-h-[100vw] object-cover pointer-events-none -z-50 opacity-90 transition-opacity duration-500"
          style={{ transform: 'translate(-50%, -50%) rotate(-90deg)' }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      )}

      {/* Global Ambient Overlay — dark: subtle navy wash, light: clear */}
      <div className={`fixed inset-0 pointer-events-none -z-40 transition-all duration-500
        ${isDarkMode 
          ? 'bg-[#0d0d11]/30' 
          : 'bg-transparent'}`}
      />

      <ToastContainer position="top-right" autoClose={2000} />
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes - Đăng nhập / Đăng ký */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <PageTransition><Login /></PageTransition>} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/" replace /> : <PageTransition><Register /></PageTransition>} 
          />

          {/* Protected Routes - Yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                <Navbar />
                <PageTransition>
                  <main className="flex-1 pb-10 mt-2">
                    <Dashboard transactions={transactions} />
                  </main>
                </PageTransition>
              </div>
            } />
            
            {/* Consolidated redirects */}
            <Route path="/add" element={<Navigate to="/finance" replace />} />
            <Route path="/list" element={<Navigate to="/finance" replace />} />
            
            <Route path="/finance" element={
              <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                <Navbar />
                <PageTransition>
                  <main className="flex-1 pb-10">
                    <Finance />
                  </main>
                </PageTransition>
              </div>
            } />
            
            <Route path="/profile" element={
              <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                <Navbar />
                <PageTransition>
                  <main className="flex-1 pb-10">
                    <Profile />
                  </main>
                </PageTransition>
              </div>
            } />
            
            <Route path="/profile/:id" element={
              <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                <Navbar />
                <PageTransition>
                  <main className="flex-1 pb-10">
                    <Profile />
                  </main>
                </PageTransition>
              </div>
            } />
            
            {/* Member Management - Admin Only */}
            <Route path="/members" element={
              isAdmin ? (
                <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                  <Navbar />
                  <PageTransition>
                    <main className="flex-1 pb-10">
                      <MemberManagement />
                    </main>
                  </PageTransition>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Attendance Marking - Admin Only */}
            <Route path="/attendance" element={
              isAdmin ? (
                <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                  <Navbar />
                  <PageTransition>
                    <main className="flex-1 pb-10">
                      <AttendanceMarking />
                    </main>
                  </PageTransition>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />
            
            {/* Admin Register - Only for Super Admin */}
            <Route path="/admin-register" element={
              isSuperAdmin ? (
                <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                  <Navbar />
                  <PageTransition>
                    <main className="flex-1 pb-10">
                      <AdminRegister />
                    </main>
                  </PageTransition>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />

            {/* Expense Management - Admin Only */}
            <Route path="/expense-management" element={
              isAdmin ? (
                <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                  <Navbar />
                  <PageTransition>
                    <main className="flex-1 pb-10">
                      <ExpenseManagement />
                    </main>
                  </PageTransition>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />

            {/* Deposit Approval - Admin Only */}
            <Route path="/deposit-approval" element={
              isAdmin ? (
                <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                  <Navbar />
                  <PageTransition>
                    <main className="flex-1 pb-10">
                      <DepositApproval />
                    </main>
                  </PageTransition>
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            } />

            {/* Transaction History - Logged In Members */}
            <Route path="/transaction-history" element={
              <div className="w-full max-w-[1280px] px-4 md:px-8 flex flex-col flex-1 gap-8">
                <Navbar />
                <PageTransition>
                  <main className="flex-1 pb-10">
                    <TransactionHistory />
                  </main>
                </PageTransition>
              </div>
            } />
          </Route>

          {/* Fallback - redirect về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {/* Footer chỉ hiện khi đã đăng nhập */}
      {isAuthenticated && (
        <div className="w-full">
          <Footer />
        </div>
      )}
    </div>
  );
};

export default App;
