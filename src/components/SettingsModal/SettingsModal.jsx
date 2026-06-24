import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, MousePointer, ShieldAlert } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    isDarkMode, 
    useCustomCursor, 
    toggleCustomCursor, 
    showVideoBg, 
    toggleVideoBg 
  } = useThemeStore();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border p-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 z-10
              ${isDarkMode 
                ? 'bg-[#0f172a]/95 border-white/10 text-white shadow-black/50' 
                : 'bg-white/75 border-white/60 text-gray-800 shadow-2xl shadow-blue-500/5'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-gray-200/10">
              <div>
                <h3 className="text-lg font-black tracking-tight">Cài Đặt Hệ Thống</h3>
                <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-400'} font-medium mt-0.5`}>
                  Tùy chỉnh giao diện và hiệu ứng ứng dụng
                </p>
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95
                  ${isDarkMode 
                    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6 overflow-y-auto flex-1 pr-1 dark-scrollbar py-1">


              {/* Custom Cursor Toggle */}
              <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300
                ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex gap-3 items-center">
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <MousePointer className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Con trỏ chuột Premium</h4>
                    <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-400'} font-medium mt-0.5`}>
                      Chấm và vòng tròn hào quang bám đuổi
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleCustomCursor}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none
                    ${useCustomCursor ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/10'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${useCustomCursor ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              {/* Dynamic Background Toggle */}
              <div className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors duration-300
                ${isDarkMode ? 'bg-white/3 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex gap-3 items-center">
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-white/5 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    {showVideoBg ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black">Nền động Live Wallpaper</h4>
                    <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-400'} font-medium mt-0.5`}>
                      Hoạt họa video trôi phía sau giao diện
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleVideoBg}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none
                    ${showVideoBg ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/10'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${showVideoBg ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>

            {/* Info Footer */}
            <div className={`mt-6 pt-4 border-t border-gray-200/10 text-center text-[10px] font-bold tracking-wide uppercase flex items-center justify-center gap-1.5
              ${isDarkMode ? 'text-white/30' : 'text-gray-400'}`}>
              <ShieldAlert className="w-3.5 h-3.5 text-blue-500/60" /> TAEKWONDO PTIT FINANCE v1.0.0
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SettingsModal;
