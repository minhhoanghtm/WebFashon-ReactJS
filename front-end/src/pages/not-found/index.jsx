import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const NotFound = () => {
  useDocumentTitle("404 Lost in Style — 404STUDIO");

  return (
    <div className="min-h-[80vh] bg-[#FBF9F5] flex flex-col items-center justify-center text-center px-4 py-20 select-none">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C] text-[#F5DD20] text-[10px] font-black tracking-[0.25em] uppercase mb-6 shadow-sm">
        <Sparkles size={12} />
        <span>404STUDIO · SYSTEM STATE</span>
      </div>

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <h1 className="text-7xl sm:text-9xl lg:text-[14rem] font-black tracking-tighter text-[#05251C] font-display leading-[0.82]">
          404.
        </h1>
        {/* Floating playful badge */}
        <motion.div
          animate={{ y: [-4, 4, -4], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute -top-4 -right-2 sm:-right-8 px-4 py-1.5 rounded-full bg-[#F5DD20] text-[#05251C] font-display text-xs font-black uppercase tracking-wider shadow-lg border border-[#05251C]"
        >
          LOST IN STYLE
        </motion.div>
      </motion.div>

      <p className="mt-6 text-xl sm:text-2xl font-black text-[#05251C] uppercase tracking-tight font-display">
        BẠN ĐANG LẠC BƯỚC KHỎI BẢN ĐỒ THỜI TRANG.
      </p>

      <p className="mt-3 text-xs sm:text-sm text-[#6B716E] max-w-md mx-auto leading-relaxed font-medium">
        Trang này có thể đã được lưu trữ, đổi tên hoặc chưa được phát hành trong mùa diễn này. Hãy cùng quay lại với không gian Atelier chính.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#05251C] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-[#F5DD20] hover:bg-[#073D2A] transition-all shadow-md active:scale-95"
        >
          <span>Trở về không gian chính</span>
          <ArrowRight size={14} />
        </Link>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-full border border-[#05251C]/20 bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-[#05251C] hover:bg-neutral-50 transition shadow-xs active:scale-95"
        >
          <span>Khám phá bộ sưu tập</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
