import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavoriteStore } from "@/store/favorite.store";

const Favorites = ({ isDashboard = false }) => {
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);
  const clearFavorites = useFavoriteStore((state) => state.clearFavorites);

  if (!isDashboard) {
    useDocumentTitle("Yêu thích");
  }

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id))),
    [favoriteItems],
  );

  return (
    <div className={isDashboard ? "w-full space-y-6" : "min-h-screen bg-[#FBF9F5] py-8 sm:py-12 select-none"}>
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8"}>
        {/* Breadcrumb */}
        {!isDashboard && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B716E] border-b border-[#05251C]/10 pb-4 mb-6">
            <Link to="/" className="hover:text-[#05251C] transition">404STUDIO</Link>
            <span>/</span>
            <span className="text-[#05251C] font-black">CURATED WISHLIST</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[#05251C]/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {!isDashboard && (
              <span className="micro-label text-[#05251C]/70">
                PERSONAL ATELIER VAULT
              </span>
            )}
            <h1 className="mt-1 text-3xl sm:text-5xl font-black tracking-tight text-[#05251C] font-display uppercase leading-[0.95]">
              Yêu thích cá nhân ({favoriteItems.length})
            </h1>
            {!isDashboard && (
              <p className="mt-2 max-w-xl text-xs sm:text-sm text-[#6B716E] font-medium leading-relaxed">
                Những thiết kế bạn đã lưu vào danh sách sẽ xuất hiện tại đây để bạn có thể xem lại và đặt may bất cứ lúc nào.
              </p>
            )}
          </div>

          {favoriteItems.length > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#05251C]/20 bg-white px-5 py-2.5 text-xs font-bold text-[#05251C] transition hover:bg-red-50 hover:border-red-200 hover:text-red-600 shadow-xs cursor-pointer active:scale-95"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {/* Content */}
        {favoriteItems.length === 0 ? (
          <div className="mt-8 flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-[#E8E5DF] bg-white px-6 py-12 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#05251C]/5 text-[#05251C] border border-[#05251C]/15 shadow-2xs">
              <Heart size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-black text-[#05251C] font-display uppercase">
              Chưa có sản phẩm yêu thích nào
            </h2>
            <p className="mt-2 max-w-sm text-xs sm:text-sm text-neutral-500 leading-relaxed">
              Hãy thả tim những sản phẩm bạn ưng ý nhất khi khám phá cửa hàng, chúng sẽ tự động xuất hiện ở đây.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#05251C] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#F5DD20] transition hover:bg-[#073D2A] shadow-md hover:shadow-lg active:scale-95"
            >
              <ShoppingBag size={14} aria-hidden="true" />
              <span>Khám phá bộ sưu tập</span>
            </Link>
          </div>
        ) : (
          <div className={isDashboard ? "mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" : "mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"}>
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
