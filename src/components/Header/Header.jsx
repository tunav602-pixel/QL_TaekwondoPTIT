import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import bgImage from '../../assets/anhime.jpg';
import useAuthStore from '../../store/useAuthStore';

const Header = () => {
  const { user } = useAuthStore();
  const ref = useRef(null);
  
  // Locally hosted high-quality video asset (Demon Slayer Aesthetic Animated Background)
  const liveVideoUrl = "/hero-video.mp4";

  // RBAC: Chỉ Admin mới có nút thêm giao dịch
  const isAdmin = user?.role === 'Super-Admin' || user?.role === 'Sub-Admin';

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.6, 0.75]);

  return (
    <div ref={ref} className="relative h-[300px] sm:h-[400px] rounded-[30px] overflow-hidden shadow-xl flex items-center group">
      {/* Background Image with Parallax Effect */}
      <motion.div 
        className="absolute inset-0 transition-transform duration-[2500ms] ease-out group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${bgImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          y: bgY
        }}
      />
      
      {/* Animated Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-900/55 to-indigo-900/60 transition-opacity duration-700 group-hover:from-blue-950/70"
        style={{ opacity: overlayOpacity }}
      />
      
      {/* Shimmer accent */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      </div>
      
      <div className="relative z-10 px-12 sm:px-24 w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.h2 
            className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Quản lý Tài chính <br />
            <motion.span 
              className="text-yellow-400 drop-shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
            >
              CLB Taekwondo PTIT
            </motion.span>
          </motion.h2>
          <motion.p 
            className="text-white/90 text-sm sm:text-base mb-8 max-w-lg leading-relaxed font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Hệ thống minh bạch và chuyên nghiệp. Theo dõi tổng thu, tổng chi, quỹ câu lạc bộ, học phí và các chi phí giải đấu một cách dễ dàng.
          </motion.p>
          {/* Chỉ hiện nút "Thêm Giao Dịch Ngay" cho Admin */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
            >
              <Link to="/add">
                <button className="relative overflow-hidden bg-white text-blue-700 font-extrabold px-6 py-3.5 rounded-full text-sm hover:shadow-xl hover:shadow-black/25 active:scale-95 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group/btn">
                  <span className="relative z-10">Thêm Giao Dịch Ngay</span>
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  </div>
                </button>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};


export default Header;
