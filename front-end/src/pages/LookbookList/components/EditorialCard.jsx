import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const EditorialCard = ({ title, excerpt, image, href, publishedAt, priority = false }) => {
  const domRef = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const currentTarget = domRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const displayImage = image || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800";

  return (
    <Link
      ref={domRef}
      to={href}
      className={`group flex flex-col bg-[#05251C] border border-white/10 hover:border-[#F5DD20]/40 overflow-hidden shadow-md rounded-[16px] hover:scale-[1.015] transition-all duration-300 mb-8 decoration-none
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      {/* Thumbnail */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-900 rounded-t-[16px] flex items-center justify-center relative">
        <img
          src={displayImage}
          alt={title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out rounded-t-[16px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-6 flex-1 flex flex-col text-left">
        {publishedAt && (
          <span className="text-[#F5DD20] text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2 block">
            {formatDate(publishedAt)}
          </span>
        )}
        <h3 
          className="text-white text-lg font-bold leading-snug group-hover:text-[#F5DD20] transition mb-2 uppercase tracking-tight font-heading"
        >
          {title ? title.normalize("NFC") : ""}
        </h3>
        {excerpt && (
          <p className="text-neutral-300 text-xs font-normal leading-relaxed mb-4 line-clamp-2">
            {excerpt.normalize("NFC")}
          </p>
        )}
        <div className="mt-auto pt-2 text-[10px] font-bold uppercase tracking-widest text-[#F5DD20] group-hover:text-white transition flex items-center gap-1.5">
          <span>XEM BỘ SƯU TẬP</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(EditorialCard);
