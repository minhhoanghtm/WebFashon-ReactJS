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
    <section className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-muted flex items-center justify-center">
      {/* Dynamic Image */}
      <img 
        src={coverImage}
        alt={title || "Cover image"}
        className="max-h-full w-auto max-w-full object-contain block select-none pointer-events-none mx-auto"
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 select-none">
        {title && (
          <h1 
            className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 md:mb-6 text-balance"
          >
            {title.normalize("NFC")}
          </h1>
        )}
        
        {subtitle && (
          <p className="text-white/90 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed tracking-wide mb-2 md:mb-4 text-balance">
            {subtitle.normalize("NFC")}
          </p>
        )}

        {description && (
          <p className="text-white/80 text-xs md:text-sm font-normal max-w-md mx-auto leading-relaxed mb-6 md:mb-8 hidden sm:block">
            {description.normalize("NFC")}
          </p>
        )}

        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-flex items-center justify-center px-8 py-3 bg-accent text-accent-foreground text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition duration-300 rounded-lg"
          >
            {buttonText.normalize("NFC")}
          </a>
        )}
      </div>

      {/* Scroll Down */}
      <button
        onClick={handleScrollDown}
        className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-15 flex flex-col items-center gap-2 text-white/60 hover:text-white transition duration-300 border-none bg-transparent cursor-pointer group"
        aria-label="Scroll down"
      >
        <span className="text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Scroll
        </span>
        <ArrowDown className="h-5 w-5 animate-bounce" />
      </button>
    </section>
  );
};

export default React.memo(HeroSection);
