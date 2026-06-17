import React from 'react';
import { ArrowDown } from 'lucide-react';

const HeroSection = ({ data }) => {
  const { title, subtitle, description, coverImage, buttonText, buttonLink } = data || {};

  if (!coverImage) return null;

  const handleScrollDown = (e) => {
    e.preventDefault();
    const parentSection = e.currentTarget.closest('section');
    if (parentSection && parentSection.nextSibling) {
      parentSection.nextSibling.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-neutral-900 rounded-none mb-12 flex items-center justify-center">
      {/* Dynamic Image that fits within the viewport height without cropping or causing scroll */}
      <img 
        src={coverImage}
        alt={title || "Cover image"}
        className="max-h-full w-auto max-w-full object-contain block select-none pointer-events-none mx-auto"
      />
      <div className="absolute inset-0 bg-black/45 rounded-none" />

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 select-none animate-fadeIn">
        {title && (
          <h1 
            className="text-white text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-[0.12em] uppercase mb-4 md:mb-6"
          >
            {title.normalize("NFC")}
          </h1>
        )}
        
        {subtitle && (
          <p className="text-white/90 text-[10px] sm:text-xs md:text-sm font-light max-w-lg mx-auto leading-relaxed tracking-[0.25em] font-sans uppercase mb-2 md:mb-4">
            {subtitle.normalize("NFC")}
          </p>
        )}

        {description && (
          <p className="text-white/80 text-[10px] sm:text-xs font-light max-w-md mx-auto leading-relaxed tracking-wider mb-4 md:mb-8 hidden sm:block">
            {description.normalize("NFC")}
          </p>
        )}

        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-flex items-center justify-center px-6 py-2.5 md:px-8 md:py-3.5 border border-white bg-transparent text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition duration-300 rounded-none"
          >
            {buttonText.normalize("NFC")}
          </a>
        )}
      </div>

      {/* Scroll Down */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 z-15 flex flex-col items-center gap-1 md:gap-2 text-white/50 hover:text-white transition duration-300 border-none bg-transparent cursor-pointer rounded-none group"
        aria-label="Scroll to next block"
      >
        <span className="text-[8px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
          Scroll
        </span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
};

export default React.memo(HeroSection);
