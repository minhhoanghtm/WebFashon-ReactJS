import React from 'react';

const ImageTextSection = ({ data }) => {
  const { image, title, content, imagePosition = 'left' } = data || {};

  if (!image && !content) return null;

  const isImageRight = imagePosition === 'right';

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 rounded-none">
      <div className={`flex flex-col ${isImageRight ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center rounded-none`}>
        
        {/* Image Column */}
        {image && (
          <div className="w-full lg:w-1/2 overflow-hidden bg-neutral-50 rounded-none">
            <div className="aspect-[4/3] lg:aspect-[16/11] w-full overflow-hidden relative rounded-none flex items-center justify-center">
              <img
                src={image}
                alt={title || "Section photography"}
                className="max-w-full max-h-full object-contain rounded-none"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Text Column */}
        <div className="w-full lg:w-1/2 text-left space-y-6 rounded-none">
          {title && (
            <h2 
              className="text-2xl md:text-4xl font-semibold text-neutral-900 leading-tight uppercase tracking-wide"
            >
              {title.normalize("NFC")}
            </h2>
          )}
          {title && <div className="w-12 h-[1px] bg-neutral-900" />}
          {content && (
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed font-light font-sans tracking-wide">
              {content.normalize("NFC")}
            </p>
          )}
        </div>

      </div>
    </section>
  );
};

export default React.memo(ImageTextSection);
