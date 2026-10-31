import React, { useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProductCard from "@/components/ProductCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavoriteStore } from "@/store/favorite.store";

const Favorites = ({ isDashboard = false }) => {
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites);
  const favoriteGridRef = useRef(null);

  useDocumentTitle("Danh sách yêu thích");

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id))),
    [favoriteItems]
  );

  // Scroll reveal animation for favorite items
  useEffect(() => {
    if (favoriteItems.length === 0) return undefined;
    const gridEl = favoriteGridRef.current;
    if (!gridEl) return undefined;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const cards = gridEl.querySelectorAll("[data-product-card]");
    if (!cards.length) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: gridEl,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, gridEl);

    return () => {
      ctx.revert();
    };
  }, [favoriteItems]);

  return (
    <div
      className={
        isDashboard
          ? "w-full space-y-6 text-[var(--color-text)]"
          : "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] py-8 sm:py-12"
      }
    >
      <div
        className={
          isDashboard
            ? "space-y-6"
            : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        }
      >
        {/* Breadcrumb */}
        {!isDashboard && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-4 mb-6"
          >
            <Link
              to="/"
              className="hover:text-[var(--color-text)] transition-colors"
            >
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-[var(--color-text)] font-medium">
              Yêu thích
            </span>
          </nav>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {!isDashboard && (
              <span className="atelier-eyebrow block mb-1.5 font-mono text-[11px] tracking-[0.24em] uppercase text-[var(--color-text-muted)]">
                Bộ sưu tập cá nhân
              </span>
            )}
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight uppercase">
              Danh sách yêu thích ({favoriteItems.length})
            </h1>
            {!isDashboard && (
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed font-sans">
                Những thiết kế bạn đã lưu lại để theo dõi và chuẩn bị cho đơn hàng may đo tiếp theo.
              </p>
            )}
          </div>

          {favoriteItems.length > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-xs uppercase tracking-[0.14em] font-medium text-[var(--color-text)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors cursor-pointer"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {/* Content */}
        {favoriteItems.length === 0 ? (
          <div className="mt-8 flex min-h-[340px] flex-col items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center border border-[var(--color-border)] text-[var(--color-text)]">
              <Heart size={24} className="stroke-[1.5]" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight">
              Chưa có sản phẩm yêu thích
            </h2>
            <p className="mt-2 max-w-sm text-xs text-[var(--color-text-muted)] leading-relaxed font-sans">
              Nhấn biểu tượng trái tim trên các tạo tác may đo trong cửa hàng để lưu trữ tại đây.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 min-h-[46px] border border-foreground bg-foreground px-6 py-3 text-xs uppercase tracking-[0.2em] font-semibold text-background hover:bg-background hover:text-foreground transition-all"
            >
              <ShoppingBag size={14} aria-hidden="true" />
              <span>Khám phá bộ sưu tập</span>
            </Link>
          </div>
        ) : (
          <div
            ref={favoriteGridRef}
            className={
              isDashboard
                ? "mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
                : "mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
            }
          >
            {favoriteItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteIds.has(String(product.id))}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
