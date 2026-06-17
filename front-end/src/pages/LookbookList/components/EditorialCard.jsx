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
      className={`group flex flex-col bg-[#0d0f12] border border-neutral-900/60 overflow-hidden shadow-none rounded-[12px] hover:scale-[1.01] transition-all duration-300 mb-8 decoration-none
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      {/* Thumbnail */}
      <div className="aspect-[16/9.5] w-full overflow-hidden bg-neutral-950 rounded-t-[12px]">
        <img
          src={displayImage}
          alt={title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover object-center group-hover:scale-[1.025] transition-transform duration-750 rounded-t-[12px]"
        />
      </div>

      {/* Info */}
      <div className="p-6 flex-1 flex flex-col text-left">
        {publishedAt && (
          <span className="text-neutral-500 text-[9px] font-semibold uppercase tracking-[0.15em] mb-2 block">
            {formatDate(publishedAt)}
          </span>
        )}
        <h3 
          className="text-white text-base font-semibold leading-snug group-hover:text-neutral-300 transition mb-2 uppercase tracking-wide"
        >
          {title ? title.normalize("NFC") : ""}
        </h3>
        {excerpt && (
          <p className="text-neutral-400 text-xs font-light leading-relaxed mb-4 line-clamp-2">
            {excerpt.normalize("NFC")}
          </p>
        )}
        <div className="mt-auto pt-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-white transition">
          XEM BỘ SƯU TẬP →
        </div>
      </div>
    </Link>
  );
};

export default React.memo(EditorialCard);
