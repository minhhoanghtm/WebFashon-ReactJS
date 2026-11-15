import { useState, useRef } from "react";

/**
 * FitImage
 * Monochromatic atelier image component ensuring zero unwanted cropping.
 * 
 * Props:
 * - src: Image URL
 * - alt: Image alt text
 * - width: Pre-calculated width (from API metadata if available)
 * - height: Pre-calculated height (from API metadata if available)
 * - mode: "adaptive" (default) | "cover-focal" | "contain"
 * - focal: Object position for cover-focal (default "50% 25%")
 * - maxHeight: Optional CSS max-height constraint (e.g. "calc(100svh - 8rem)")
 * - priority: High priority / eager load
 * - onError: Error callback
 * - onLoad: Load callback
 * - className: Outer container classes
 * - imageClassName: Inner <img> classes
 * - fallbackSrc: Optional fallback placeholder
 * - containerStyle: Additional style for outer wrapper
 * - imgStyle: Additional style for <img>
 * - showSkeleton: Display pulse skeleton while loading
 */
export default function FitImage({
  src,
  alt = "",
  width,
  height,
  mode = "adaptive",
  focal = "50% 25%",
  maxHeight,
  priority = false,
  onError,
  onLoad,
  className = "",
  imageClassName = "",
  fallbackSrc = "/placeholder-product.svg",
  containerStyle = {},
  imgStyle = {},
  showSkeleton = true,
  ...rest
}) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [measuredDimensions, setMeasuredDimensions] = useState(null);

  const imgRef = useRef(null);

  // Adjust state during render when src changes (React 19 pattern: storing info from prev renders)
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsLoaded(false);
    setHasError(false);
    setMeasuredDimensions(null);
  }

  // Pre-calculated prop dimensions if available
  const propDimensions =
    width && height && Number(width) > 0 && Number(height) > 0
      ? {
          width: Number(width),
          height: Number(height),
          ratio: Number(width) / Number(height),
        }
      : null;

  const activeDimensions = propDimensions || measuredDimensions;

  const handleImageLoad = (e) => {
    const nw = e.currentTarget.naturalWidth;
    const nh = e.currentTarget.naturalHeight;
    if (nw > 0 && nh > 0) {
      setMeasuredDimensions({ width: nw, height: nh, ratio: nw / nh });
    }
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleImageError = (e) => {
    setHasError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  // Compute aspect ratio styles
  const currentRatio = activeDimensions?.ratio;

  // Style configurations
  const computedContainerStyle = { ...containerStyle };
  const computedImgStyle = { ...imgStyle };

  if (maxHeight) {
    computedContainerStyle.maxHeight = maxHeight;
  }

  if (mode === "adaptive") {
    // If we have an aspect ratio, apply it with smooth transition
    if (currentRatio) {
      computedContainerStyle.aspectRatio = `${currentRatio}`;
    } else {
      // Default placeholder ratio 3/4 until loaded
      computedContainerStyle.aspectRatio = "3/4";
    }
  }

  // Focal position
  if (mode === "cover-focal") {
    computedImgStyle.objectPosition = focal;
  }

  return (
    <div
      className={`fit-image-container relative overflow-hidden transition-[aspect-ratio,max-height] duration-250 ease-out ${
        mode === "adaptive"
          ? "w-full max-w-full mx-auto flex items-center justify-center bg-[var(--muted)]/40 dark:bg-zinc-900/40"
          : ""
      } ${
        mode === "contain"
          ? "bg-[var(--muted)]/50 dark:bg-zinc-900/60 flex items-center justify-center"
          : ""
      } ${className}`}
      style={computedContainerStyle}
    >
      {/* Skeleton while loading */}
      {showSkeleton && !isLoaded && (
        <div
          className="absolute inset-0 z-0 bg-[var(--muted)] dark:bg-zinc-800 animate-pulse pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Render Fallback on Error */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--muted)]/60 dark:bg-zinc-900/80 p-4 text-center">
          <svg
            className="w-8 h-8 text-[var(--color-muted)] mb-2 stroke-[1.2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span className="text-2xs uppercase tracking-widest text-[var(--color-muted)] font-mono">
            {alt || "WebFashion"}
          </span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={src || fallbackSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={computedImgStyle}
          className={`transition-opacity duration-300 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${
            mode === "adaptive"
              ? "w-full h-full object-contain object-center"
              : mode === "contain"
              ? "w-full h-full object-contain object-center"
              : mode === "cover-focal"
              ? "w-full h-full object-cover"
              : "w-full h-full object-contain"
          } ${imageClassName}`}
          {...rest}
        />
      )}
    </div>
  );
}
