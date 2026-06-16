import React from 'react';
import { ArrowDown } from 'lucide-react';

const LookbookHero = ({ image, title, subtitle }) => {
  if (!image) return null;

  const handleScrollDown = () => {
    const nextSection = document.getElementById('featured-section') || document.getElementById('lookbooks-grid');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section 
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-neutral-900 rounded-none"
      aria-label="Lookbook Hero Cover"
    >
      {/* Background Cover */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out scale-102 rounded-none"
        style={{ backgroundImage: `url("${encodeURI(image)}")` }}
      />
      {/* Premium Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl select-none animate-fadeIn">
        {title && (
          <h1 
            className="text-white text-5xl md:text-8xl font-light tracking-[0.22em] uppercase mb-8"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
          >
            {title.normalize("NFC")}
          </h1>
        )}
        {title && subtitle && <div className="w-16 h-[1px] bg-white/30 mx-auto mb-8" />}
        {subtitle && (
          <p className="text-white/95 text-xs md:text-sm font-light max-w-md mx-auto leading-relaxed tracking-[0.15em] font-sans uppercase">
            {subtitle.normalize("NFC")}
          </p>
        )}
      </div>

      {/* Smooth Scroll Indicator */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-15 flex flex-col items-center gap-3 text-white/60 hover:text-white transition-all duration-300 border-none bg-transparent cursor-pointer group rounded-none"
        aria-label="Cuộn xuống bộ sưu tập"
      >
        <span className="text-[9px] uppercase tracking-[0.25em] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Scroll Down
        </span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
};

export default React.memo(LookbookHero);

