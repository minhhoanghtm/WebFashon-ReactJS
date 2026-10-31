import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductGallery = ({ images = [], productName = "Thiết kế WebFashion" }) => {
  const [failedMap, setFailedMap] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);

  const validImages = useMemo(() => {
    const raw = Array.isArray(images) ? images : [];
    return raw.filter(
      (url) => typeof url === "string" && url.trim() && !failedMap[url]
    );
  }, [images, failedMap]);

  const safeIndex =
    validImages.length > 0 ? Math.min(selectedIndex, validImages.length - 1) : 0;
  const currentImage = validImages[safeIndex] || "";

  const handleImageError = (url) => {
    setFailedMap((prev) => ({ ...prev, [url]: true }));
  };

  const handlePrev = () => {
    if (validImages.length <= 1) return;
    setSelectedIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length
    );
  };

  const handleNext = () => {
    if (validImages.length <= 1) return;
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 h-full min-h-0">
      {/* Desktop Thumbnails Column (hidden on mobile, vertical strip on left) */}
      {validImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Chọn góc nhìn thiết kế (desktop)"
          className="hidden lg:flex flex-col gap-2 w-16 xl:w-20 shrink-0 overflow-y-auto max-h-full py-0.5 scrollbar-none"
        >
          {validImages.map((url, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={url}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[3/4] w-full shrink-0 overflow-hidden border transition-all ${
                  isSelected
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border opacity-60 hover:opacity-100"
                }`}
                aria-label={`Góc nhìn ${idx + 1}`}
              >
                <img
                  src={url}
                  alt=""
                  onError={() => handleImageError(url)}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Frame: mobile aspect-[3/4], desktop flex-1 h-full min-h-0 */}
      <div className="relative aspect-[3/4] lg:aspect-auto flex-1 h-full min-h-0 w-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${productName} - góc nhìn ${safeIndex + 1}`}
            onError={() => handleImageError(currentImage)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center p-8 text-center select-none"
            aria-label="Khung chờ hình ảnh thiết kế"
          >
            <div className="mb-3 flex h-20 w-14 items-center justify-center border border-border">
              <span className="font-sans text-base tracking-[0.16em] uppercase text-muted-foreground">
                WF
              </span>
            </div>
            <p className="font-sans text-sm italic text-foreground">
              {productName}
            </p>
            <span className="mt-1 text-[9px] tracking-[0.22em] uppercase text-muted-foreground">
              Atelier Archive
            </span>
          </div>
        )}

        {/* Prev / Next Navigation */}
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="touch-target absolute top-1/2 left-2.5 -translate-y-1/2 inline-flex items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-background"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="touch-target absolute top-1/2 right-2.5 -translate-y-1/2 inline-flex items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-background"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {/* Mobile Thumbnails Strip (hidden on desktop) */}
      {validImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Chọn góc nhìn sản phẩm (di động)"
          className="flex lg:hidden gap-2 overflow-x-auto pb-1"
        >
          {validImages.map((url, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={url}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-[3/4] w-16 shrink-0 overflow-hidden border transition-all ${
                  isSelected
                    ? "border-foreground ring-1 ring-foreground"
                    : "border-border opacity-60 hover:opacity-100"
                }`}
                aria-label={`Góc nhìn ${idx + 1}`}
              >
                <img
                  src={url}
                  alt=""
                  onError={() => handleImageError(url)}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;