import { create } from 'zustand';
import api from '../lib/axios';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  /**
   * Fetch thông báo từ API
   */
  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/notifications');
      if (res.data.success) {
        set({
          notifications: res.data.notifications,
          unreadCount: res.data.unreadCount,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Fetch chỉ số unread count (nhẹ hơn)
   */
  fetchUnreadCount: async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        set({ unreadCount: res.data.unreadCount });
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  },

  /**
   * Đánh dấu một thông báo đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      set(state => ({
        notifications: state.notifications.map(n =>
          (n._id === notificationId) ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  },

  /**
   * Đánh dấu tất cả đã đọc
   */
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }
}));

export default useNotificationStore;
