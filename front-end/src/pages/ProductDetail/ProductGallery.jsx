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
    <div className="flex flex-col gap-3">
      {/* Main Portrait Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden border border-border bg-secondary">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`${productName} - góc nhìn ${safeIndex + 1}`}
            onError={() => handleImageError(currentImage)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center p-10 text-center select-none"
            aria-label="Khung chờ hình ảnh thiết kế"
          >
            <div className="mb-4 flex h-24 w-16 items-center justify-center border border-border">
              <span className="font-serif text-lg tracking-[0.2em] uppercase text-muted-foreground">
                WF
              </span>
            </div>
            <p className="font-serif text-base italic text-foreground">
              {productName}
            </p>
            <span className="mt-1 text-[10px] tracking-[0.22em] uppercase text-muted-foreground">
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
              className="touch-target absolute top-1/2 left-3 -translate-y-1/2 inline-flex items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-background"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="touch-target absolute top-1/2 right-3 -translate-y-1/2 inline-flex items-center justify-center border border-border bg-background/85 text-foreground backdrop-blur-xs transition-colors hover:bg-background"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Strip */}
      {validImages.length > 1 && (
        <div
          role="tablist"
          aria-label="Chọn góc nhìn sản phẩm"
          className="flex gap-2.5 overflow-x-auto pb-1"
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
                className={`relative aspect-[3/4] w-20 shrink-0 overflow-hidden border transition-all ${
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
