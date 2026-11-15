import React, { useState } from "react";

// Minimal dark monochrome luxury placeholder SVG data URI
const DEFAULT_FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500' width='400' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23161619'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b6973' font-family='sans-serif' font-size='14' letter-spacing='2'%3EWEBFASHION ATELIER%3C/text%3E%3C/svg%3E";

export function SafeImage({
  src,
  alt = "Product design",
  className = "w-full h-full object-cover",
  fallbackSrc = DEFAULT_FALLBACK_SVG,
  priority = false,
  aspectRatio,
  onError,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(!src);

  const handleError = (e) => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      if (typeof onError === "function") {
        onError(e);
      }
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={handleError}
      className={className}
      style={aspectRatio ? { aspectRatio } : undefined}
      {...props}
    />
  );
}

export default SafeImage;
