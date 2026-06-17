import React from 'react';

const GallerySection = ({ data }) => {
  const { images = [] } = data || {};

  if (!images || images.length === 0) return null;

  // Determine grid column styles based on quantity of photos
  let gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  if (images.length === 1) {
    gridClass = "grid-cols-1 max-w-4xl mx-auto";
  } else if (images.length === 2) {
    gridClass = "grid-cols-1 md:grid-cols-2";
  } else if (images.length % 2 === 0) {
    gridClass = "grid-cols-1 md:grid-cols-2";
  }

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 rounded-none">
      <div className={`grid gap-8 ${gridClass} rounded-none`}>
        {images.map((item, idx) => (
          <figure key={idx} className="group flex flex-col bg-transparent m-0 overflow-hidden rounded-none">
            {item.imageUrl && (
              <div className="w-full overflow-hidden bg-neutral-50 relative rounded-none aspect-[3/4]">
                <img
                  src={item.imageUrl}
                  alt={item.caption || `Gallery image ${idx}`}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-[1200ms] ease-out rounded-none"
                  loading="lazy"
                />
              </div>
            )}
            {item.caption && (
              <figcaption 
                className="pt-4 text-left text-neutral-400 text-xs italic tracking-wide"
              >
                {item.caption.normalize("NFC")}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
};

export default React.memo(GallerySection);
