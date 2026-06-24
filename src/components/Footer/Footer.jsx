import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import logoImg from '../../assets/logoclb.png';
import ScrollReveal, { ScrollRevealGroup, ScrollRevealItem } from '../ScrollReveal/ScrollReveal';
import useThemeStore from '../../store/useThemeStore';

const Footer = () => {
  const { isDarkMode } = useThemeStore();
  return (
    <footer 
      className={`relative overflow-hidden mt-16 pt-20 pb-10 px-8 sm:px-12 transition-colors duration-500`} 
      style={{ 
        background: isDarkMode ? 'rgba(18, 18, 18, 0.97)' : 'rgba(248, 250, 252, 0.98)',
        borderTop: isDarkMode ? '1px solid rgba(59,130,246,0.15)' : '1px solid rgba(59,130,246,0.1)'
      }}
    >

      {/* Decorative glow orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      {/* Top gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      
      <ScrollRevealGroup className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10" staggerDelay={0.12}>
        <ScrollRevealItem direction="up">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className={`${isDarkMode ? 'bg-white/10 border-white/10' : 'bg-blue-50 border-blue-100'} p-2 rounded-2xl border transition-colors duration-500`}>
                <img src={logoImg} alt="Taekwondo PTIT Logo" className="w-11 h-11 object-contain" />
              </div>
              <span className={`font-bold text-3xl transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>TAEKWONDO PTIT</span>
            </div>
            <p className={`text-base leading-relaxed mt-2 pr-4 transition-colors duration-500 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
              Rèn luyện thể chất, hun đúc tinh thần thượng võ. CLB Võ thuật Taekwondo - Học viện Công nghệ Bưu chính Viễn thông.
            </p>
          </div>
        </ScrollRevealItem>
        
        <ScrollRevealItem direction="up">
          <div className="flex flex-col gap-6 md:pl-10">
            <h2 className={`font-bold text-xl uppercase tracking-wider border-b pb-2 inline-block w-fit transition-colors duration-500 ${isDarkMode ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'}`}>Liên kết nhanh</h2>
            <ul className="flex flex-col gap-4 text-base">
              <li className={`hover:text-blue-400 cursor-pointer transition-all duration-300 hover:translate-x-2 group text-sm ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                <span className="relative">
                  Trang chủ
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
                </span>
              </li>
              <li className={`hover:text-blue-400 cursor-pointer transition-all duration-300 hover:translate-x-2 group text-sm ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                <span className="relative">
                  Về chúng tôi
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
                </span>
              </li>
              <li className={`hover:text-blue-400 cursor-pointer transition-all duration-300 hover:translate-x-2 group text-sm ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
                <span className="relative">
                  Quy chế CLB
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
                </span>
              </li>
            </ul>
          </div>
        </ScrollRevealItem>
        
        <ScrollRevealItem direction="up">
          <div className="flex flex-col gap-6">
            <h2 className={`font-bold text-xl uppercase tracking-wider border-b pb-2 inline-block w-fit transition-colors duration-500 ${isDarkMode ? 'text-white border-white/10' : 'text-slate-800 border-slate-200'}`}>Thông tin liên hệ</h2>
            <ul className={`flex flex-col gap-4 text-base transition-colors duration-500 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>
              <li className="flex items-center gap-4 group cursor-pointer w-fit">
                <Phone className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative overflow-hidden h-6 text-base font-semibold">
                  <span className={`block group-hover:-translate-y-full transition-transform duration-300 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>0375 106 022</span>
                  <span className="block absolute top-0 left-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 text-blue-400 font-bold">0375 106 022</span>
                </div>
              </li>
              <li className={`flex items-center gap-4 group`}><Mail className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" /><span className="group-hover:text-blue-400 transition-colors duration-300">taekwondo.ptit@gmail.com</span></li>
              <li className="flex items-start gap-4 group"><MapPin className="w-6 h-6 text-blue-400 shrink-0 mt-1 group-hover:scale-110 transition-transform duration-300" /><span className="leading-relaxed group-hover:text-blue-400 transition-colors duration-300">Km10, Nguyễn Trãi, Q.Hà Đông, Hà Nội</span></li>
            </ul>
          </div>
        </ScrollRevealItem>
      </ScrollRevealGroup>
      
      <hr className={`my-10 relative z-10 transition-colors duration-500 ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200'}`} />
      <ScrollReveal direction="fade" delay={0.2}>
        <p className={`text-center text-base font-medium transition-colors duration-500 ${isDarkMode ? 'text-white/30' : 'text-slate-400'}`}>Copyright 2026 © Taekwondo PTIT Club. All Rights Reserved.</p>
      </ScrollReveal>
    </footer>
  );
};

export default Footer;
