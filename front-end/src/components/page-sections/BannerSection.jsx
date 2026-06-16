import React from 'react';

const BannerSection = ({ data }) => {
  const { image, title, subtitle, buttonText, buttonLink } = data || {};

  if (!image) return null;

  return (
    <section className="relative w-full h-[55vh] flex items-center justify-center overflow-hidden bg-neutral-900 rounded-none mb-12">
      {/* Cover background */}
      <div 
        className="absolute inset-0 bg-cover bg-center rounded-none scale-101"
        style={{ backgroundImage: `url("${encodeURI(image)}")` }}
      />
      <div className="absolute inset-0 bg-black/40 rounded-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl select-none">
        {title && (
          <h2 
            className="text-white text-3xl md:text-5xl font-light tracking-widest uppercase mb-4"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
          >
            {title.normalize("NFC")}
          </h2>
        )}
        
        {subtitle && (
          <p className="text-white/90 text-xs md:text-sm font-light max-w-md mx-auto leading-relaxed tracking-wider uppercase mb-8">
            {subtitle.normalize("NFC")}
          </p>
        )}

        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-flex items-center justify-center px-6 py-2.5 border border-white bg-transparent text-white text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-neutral-900 transition duration-300 rounded-none"
          >
            {buttonText.normalize("NFC")}
          </a>
        )}
      </div>
    </section>
  );
};

export default React.memo(BannerSection);
