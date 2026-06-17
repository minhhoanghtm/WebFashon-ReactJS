import React from 'react';

const CTASection = ({ data }) => {
  const { title, description, buttonText, buttonLink } = data || {};

  if (!title && !buttonText) return null;

  return (
    <section className="py-20 md:py-28 text-center px-6 max-w-xl mx-auto space-y-6 rounded-none">
      {title && (
        <h2 
          className="text-2xl md:text-5xl font-semibold uppercase tracking-wide text-neutral-900" 
        >
          {title.normalize("NFC")}
        </h2>
      )}

      {description && (
        <p className="text-neutral-500 text-xs md:text-sm font-light leading-relaxed tracking-wider font-sans uppercase">
          {description.normalize("NFC")}
        </p>
      )}

      {buttonText && buttonLink && (
        <div className="pt-4 select-none">
          <a
            href={buttonLink}
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-neutral-900 bg-transparent text-neutral-900 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition duration-300 rounded-none cursor-pointer"
          >
            {buttonText.normalize("NFC")}
          </a>
        </div>
      )}
    </section>
  );
};

export default React.memo(CTASection);
