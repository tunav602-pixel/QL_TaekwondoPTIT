import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions

  /**
   * Đăng nhập - lưu user data và token vào store + localStorage
   */
  login: (userData, token) => {
    localStorage.setItem('tkd_token', token);
    localStorage.setItem('tkd_user', JSON.stringify(userData));
    set({
      user: userData,
      token: token,
      isAuthenticated: true,
      isLoading: false
    });
  },

  /**
   * Đăng xuất - xóa toàn bộ state + localStorage
   */
  logout: () => {
    localStorage.removeItem('tkd_token');
    localStorage.removeItem('tkd_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  /**
   * Cập nhật thông tin user
   */
  setUser: (userData) => {
    const updatedUser = {
      ...get().user,
      ...userData
    };
    localStorage.setItem('tkd_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  /**
   * Hydrate state từ localStorage khi app khởi động
   */
  loadFromStorage: () => {
    try {
      const token = localStorage.getItem('tkd_token');
      const userStr = localStorage.getItem('tkd_user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      localStorage.removeItem('tkd_token');
      localStorage.removeItem('tkd_user');
      set({ isLoading: false });
    }
  }
}));

export default useAuthStore;
