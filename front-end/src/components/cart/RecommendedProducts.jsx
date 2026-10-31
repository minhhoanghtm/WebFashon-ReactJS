import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Loader2, ArrowUpRight } from "lucide-react";
import { getAllProductService } from "@/services/product.service";
import { formatCurrency } from "@/utils/format";

const RecommendedCard = ({ prod, isAdding, onAdd }) => {
  const candidates = [
    ...(Array.isArray(prod.displayProduct) ? prod.displayProduct : []),
    prod.image,
    prod.imageUrl,
    ...(Array.isArray(prod.variants)
      ? prod.variants.map((v) => v?.image_url)
      : []),
  ].filter((u) => typeof u === "string" && u.trim());

  const [imgIdx, setImgIdx] = useState(0);
  const activeUrl = candidates[imgIdx] || "";
  const hasDiscount = Number(prod.old_price) > Number(prod.new_price);

  return (
    <article className="group flex flex-col justify-between border border-border bg-card transition-colors hover:border-foreground">
      <Link
        to={`/product/${encodeURIComponent(prod.slug || prod._id || prod.id)}`}
        className="block flex-1"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border bg-secondary">
          {activeUrl ? (
            <img
              src={activeUrl}
              alt={prod.name}
              onError={() => setImgIdx((prev) => prev + 1)}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center select-none">
              <span className="font-sans text-lg uppercase tracking-[0.16em] text-muted-foreground">
                WF
              </span>
              <span className="mt-1 text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                Atelier Archive
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 p-4">
          <h4 className="line-clamp-1 font-sans font-medium text-base text-foreground">
            {prod.name}
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold tabular-nums text-foreground sm:text-sm">
              {formatCurrency(prod.new_price)}
            </span>
            {hasDiscount && (
              <span className="text-[11px] tabular-nums text-muted-foreground line-through">
                {formatCurrency(prod.old_price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={(e) => onAdd(e, prod)}
          disabled={isAdding}
          className="touch-target flex w-full items-center justify-center gap-1.5 border border-border bg-background text-xs font-semibold tracking-[0.14em] uppercase text-foreground transition-colors hover:border-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
        >
          {isAdding ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Plus size={14} />
              <span>Thêm vào giỏ</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

const RecommendedProducts = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProductService();
        if (isMounted && Array.isArray(data)) {
          setProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error("Không thể tải sản phẩm gợi ý:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdd = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingId(prod._id || prod.id);
      await onAddToCart(prod);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <section className="mt-14 space-y-6 border-t border-border pt-10">
        <div className="h-6 w-56 animate-pulse bg-secondary" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse border border-border bg-secondary"
            />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section
      aria-label="Thiết kế gợi ý"
      className="mt-14 space-y-6 border-t border-border pt-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
            Giám tuyển bổ sung
          </p>
          <h3 className="mt-1 font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Có thể bạn sẽ thích
          </h3>
        </div>
        <Link
          to="/products"
          className="touch-target inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] uppercase text-foreground hover:underline"
        >
          <span>Xem toàn bộ</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((prod) => (
          <RecommendedCard
            key={prod._id || prod.id}
            prod={prod}
            isAdding={addingId === (prod._id || prod.id)}
            onAdd={handleAdd}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendedProducts;
