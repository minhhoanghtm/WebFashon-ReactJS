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
    <div className={isDashboard ? "w-full space-y-6" : "bg-white"}>
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"}>
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {!isDashboard && (
              <span className="text-xs font-extrabold uppercase tracking-[0.24em] text-rose-500">
                Sản phẩm đã lưu
              </span>
            )}
            <h1 className={isDashboard ? "text-2xl sm:text-3xl font-bold text-slate-950" : "mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl"}>
              Yêu thích
            </h1>
            {!isDashboard && (
              <p className="mt-3 max-w-2xl text-sm text-slate-500">
                Những sản phẩm bạn đã thả tim sẽ được lưu ở đây để xem lại và mua sắm nhanh hơn.
              </p>
            )}
          </div>

          {favoriteItems.length > 0 && (
            <button
              type="button"
              onClick={clearFavorites}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 size={15} aria-hidden="true" />
              Xóa tất cả
            </button>
          )}
        </div>

        {favoriteItems.length === 0 ? (
          <div className="mt-10 flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
              <Heart size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-900">
              Chưa có sản phẩm yêu thích
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Hãy thả tim sản phẩm bạn thích, danh sách này sẽ tự động cập nhật.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <ShoppingBag size={15} aria-hidden="true" />
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className={isDashboard ? "mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"}>
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
