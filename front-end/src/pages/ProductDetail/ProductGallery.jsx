import React, { useRef, useState } from "react";
import { ImageOff, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import brownBagImage from "../Home/assets/product-brown-bag.jpg";
import linenShirtImage from "../Home/assets/product-linen-shirt.jpg";
import navyBlazerImage from "../Home/assets/product-navy-blazer.jpg";
import whiteSneakersImage from "../Home/assets/product-white-sneakers.jpg";

const fallbackImages = [
  linenShirtImage,
  navyBlazerImage,
  whiteSneakersImage,
  brownBagImage,
];

const ProductGallery = ({ images = [], productName = "Sản phẩm thời trang" }) => {
  const galleryImages =
    Array.isArray(images) && images.length > 0 ? images : fallbackImages;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const mainImageRef = useRef(null);

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImages[0];
  };

  const handleMouseMove = (event) => {
    const frame = mainImageRef.current;
    if (!frame) return;

    const { left, top, width, height } = frame.getBoundingClientRect();
    const x = Math.min(Math.max(((event.clientX - left) / width) * 100, 0), 100);
    const y = Math.min(Math.max(((event.clientY - top) / height) * 100, 0), 100);

    // Update the compositor-only transform origin directly: this follows the
    // pointer without triggering a component render for every mouse event.
    frame.style.setProperty("--zoom-x", `${x}%`);
    frame.style.setProperty("--zoom-y", `${y}%`);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="product-gallery flex flex-col gap-3 w-full">
      {/* Khung ảnh chính */}
      <div
        ref={mainImageRef}
        onClick={() => setIsZoomOpen(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          mainImageRef.current?.style.setProperty("--zoom-x", "50%");
          mainImageRef.current?.style.setProperty("--zoom-y", "50%");
        }}
        className="group relative w-full aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-[calc(100dvh-220px)] lg:min-h-[520px] lg:max-h-[680px] bg-neutral-50 rounded-2xl overflow-hidden cursor-zoom-in border border-neutral-200/60 shadow-xs"
      >
        {galleryImages[activeIndex] ? (
          <img
            src={galleryImages[activeIndex]}
            alt={productName}
            onError={handleImageError}
            style={{ transformOrigin: "var(--zoom-x, 50%) var(--zoom-y, 50%)" }}
            className="w-full h-full object-contain object-center p-2 transition-transform duration-300 ease-out group-hover:scale-[1.12] pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
            <ImageOff size={40} className="mb-2" />
            <span className="text-xs">Đang cập nhật hình ảnh</span>
          </div>
        )}

        {/* Nút phóng to Lightbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomOpen(true);
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-neutral-700 shadow-md hover:bg-white hover:scale-105 active:scale-95 transition cursor-pointer z-10"
          aria-label="Phóng to ảnh"
          title="Phóng to xem chi tiết"
        >
          <Maximize2 size={16} />
        </button>

        {/* Mũi tên chuyển ảnh nhanh trên Desktop/Mobile */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-neutral-800 shadow-md hover:bg-white hover:scale-110 active:scale-95 transition opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-neutral-800 shadow-md hover:bg-white hover:scale-110 active:scale-95 transition opacity-0 group-hover:opacity-100 cursor-pointer z-10"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Chỉ số ảnh (VD: 1 / 4) */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-neutral-900/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full pointer-events-none tabular-nums">
            {activeIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* Danh sách Thumbnails bên dưới */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {galleryImages.map((image, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                type="button"
                key={`${image}-${index}`}
                onClick={() => setActiveIndex(index)}
                className={`relative flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs"
                    : "border-transparent opacity-65 hover:opacity-100 hover:border-neutral-300"
                }`}
                aria-label={`Xem ảnh ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  onError={handleImageError}
                  className="w-full h-full object-contain object-center bg-neutral-50"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal phóng to toàn màn hình */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Nút đóng */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition cursor-pointer z-50"
            aria-label="Đóng xem ảnh"
          >
            <X size={24} />
          </button>

          {/* Nút lùi */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition cursor-pointer z-50"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Ảnh phóng to */}
          <div
            className="relative max-w-4xl max-h-[85vh] p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[activeIndex]}
              alt={productName}
              onError={handleImageError}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Nút tiếp */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition cursor-pointer z-50"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Bottom Thumbnails */}
          {galleryImages.length > 1 && (
            <div
              className="absolute bottom-6 flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-10 h-12 rounded-lg overflow-hidden border-2 transition ${
                    activeIndex === idx ? "border-white" : "border-transparent opacity-40 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
