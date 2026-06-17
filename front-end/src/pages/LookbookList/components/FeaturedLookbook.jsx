import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const FeaturedLookbook = ({ lookbook }) => {
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
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
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

  if (!lookbook) return null;

  const detailUrl = `/lookbooks/${lookbook.slug}`;

  return (
    <section 
      id="featured-section"
      ref={domRef}
      className={`max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-32 transition-all duration-1000 ease-out transform rounded-none
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      aria-label="Bộ sưu tập nổi bật"
    >
      <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center rounded-none">
        {/* Large Image (70% on Desktop) */}
        <div className="w-full md:w-[70%] overflow-hidden bg-neutral-100 rounded-none">
          <Link 
            to={detailUrl} 
            rel="bookmark"
            aria-label={`Xem bộ sưu tập nổi bật: ${lookbook.title}`}
            className="block aspect-[16/10] overflow-hidden group relative rounded-none"
          >
            <img
              src={lookbook.bannerUrl || lookbook.thumbnailUrl}
              alt={`Hình ảnh bộ sưu tập ${lookbook.title}`}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-[1200ms] ease-out rounded-none"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 rounded-none" />
          </Link>
        </div>

        {/* Info Column (30% on Desktop) */}
        <div className="w-full md:w-[30%] text-left flex flex-col justify-center rounded-none">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-4 block">
            Featured Collection
          </span>
          <h2 
            className="text-3xl md:text-5xl font-semibold text-neutral-900 leading-tight mb-6 tracking-wide uppercase"
          >
            {lookbook.title ? lookbook.title.normalize("NFC") : ""}
          </h2>
          <div className="w-12 h-[1px] bg-neutral-900 mb-6" />
          <p className="text-neutral-500 text-xs md:text-sm leading-relaxed mb-8 font-light font-sans tracking-wide">
            {lookbook.excerpt ? lookbook.excerpt.normalize("NFC") : "Chiêm ngưỡng những thiết kế đại diện cho xu hướng hiện đại, kết hợp hài hòa giữa phom dáng tối giản và chất liệu cao cấp tinh tế."}
          </p>

          <Link
            to={detailUrl}
            rel="bookmark"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900 hover:text-neutral-500 transition duration-300 w-fit rounded-none border-b border-neutral-900 pb-1"
            aria-label={`Khám phá bộ sưu tập nổi bật: ${lookbook.title}`}
          >
            <span>Khám phá bộ sưu tập</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default React.memo(FeaturedLookbook);
