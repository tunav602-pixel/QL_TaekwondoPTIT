import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * ProtectedRoute - Bảo vệ các route yêu cầu đăng nhập
 * Nếu chưa đăng nhập → redirect về /login
 * Nếu đang loading → hiển thị spinner
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
