import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
  // State
  isDarkMode: true, // Always true (Dark Mode)
  useCustomCursor: localStorage.getItem('tkd_custom_cursor') !== 'false', // Default to true (Custom Cursor)
  showVideoBg: localStorage.getItem('tkd_show_video_bg') !== 'false', // Default to true (Show Video Bg)

  // Actions
  toggleTheme: () => {
    document.documentElement.classList.add('dark');
    set({ isDarkMode: true });
  },

  setTheme: (isDark) => {
    document.documentElement.classList.add('dark');
    set({ isDarkMode: true });
  },

  toggleCustomCursor: () => {
    const nextCursor = !get().useCustomCursor;
    localStorage.setItem('tkd_custom_cursor', String(nextCursor));
    set({ useCustomCursor: nextCursor });
  },

  setCustomCursor: (enable) => {
    localStorage.setItem('tkd_custom_cursor', String(enable));
    set({ useCustomCursor: enable });
  },

  toggleVideoBg: () => {
    const nextBg = !get().showVideoBg;
    localStorage.setItem('tkd_show_video_bg', String(nextBg));
    set({ showVideoBg: nextBg });
  },

  setVideoBg: (enable) => {
    localStorage.setItem('tkd_show_video_bg', String(enable));
    set({ showVideoBg: enable });
  },

  // Initialize from storage on app load
  initTheme: () => {
    const useCustomCursor = localStorage.getItem('tkd_custom_cursor') !== 'false';
    const showVideoBg = localStorage.getItem('tkd_show_video_bg') !== 'false';

    document.documentElement.classList.add('dark');

    set({
      isDarkMode: true,
      useCustomCursor,
      showVideoBg
    });
  }
}));

export default useThemeStore;
