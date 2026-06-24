import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - tự động gắn Authorization header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - auto logout khi 401
api.interceptors.response.use(
  (response) => {
    console.log('✅ Axios response interceptor:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Axios error interceptor:', error.config?.url, error.response?.status);
    
    // Only auto-logout on 401 if NOT on login/register pages
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';
      
      if (!isAuthPage) {
        console.log('🚪 Auto logout due to 401 — marking session expired');
        const { logout } = useAuthStore.getState();
        logout();
        // Đánh dấu phiên hết hạn để Login page hiển thị thông báo rõ ràng
        sessionStorage.setItem('tkd_session_expired', 'true');
        window.location.href = '/login';
      } else {
        console.log('⚠️ 401 on auth page, not redirecting');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL, BACKEND_URL };
