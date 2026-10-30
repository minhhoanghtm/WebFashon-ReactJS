import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Loader } from "lucide-react";
import { getAllProductService } from "@/services/product.service";

const RecommendedProducts = ({ onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProductService();
        setProducts(data.slice(0, 4)); // Get first 4 products
      } catch (err) {
        console.error("Failed to load recommended products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAdd = async (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAddingId(prod._id);
      await onAddToCart(prod);
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (val) => {
    return val.toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-10 border-t border-neutral-200/80">
        <h3 className="text-xl font-extrabold tracking-tight text-neutral-900 text-left">Có thể bạn sẽ thích</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 pt-10 border-t border-neutral-200/80 text-left">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#05251C] uppercase tracking-widest block mb-1">
            Gợi ý dành riêng cho bạn
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#05251C] font-display uppercase">
            Có thể bạn sẽ thích
          </h3>
        </div>
        <Link
          to="/products"
          className="text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:underline transition"
        >
          Xem thêm →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((prod) => {
          const mainImg = prod.image || (prod.displayProduct && prod.displayProduct[0]) || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
          const hasDiscount = prod.old_price > prod.new_price;
          const isAdding = addingId === prod._id;

          return (
            <div
              key={prod._id || prod.id}
              className="bg-white border border-neutral-200/80 rounded-2xl p-3 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
            >
              <Link to={`/product/${prod.slug || prod._id || prod.id}`} className="block flex-1">
                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/60 relative">
                  <img
                    src={mainImg}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                    {prod.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs sm:text-sm font-extrabold text-neutral-950 tabular-nums">
                      {formatPrice(prod.new_price)}
                    </span>
                    {hasDiscount && (
                      <s className="text-[11px] text-neutral-400 tabular-nums">
                        {formatPrice(prod.old_price)}
                      </s>
                    )}
                  </div>
                </div>
              </Link>

              {/* Add to Cart shortcut button */}
              <button
                type="button"
                onClick={(e) => handleAdd(e, prod)}
                disabled={isAdding}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-50 hover:bg-neutral-900 text-neutral-800 hover:text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer border border-neutral-200/80 hover:border-neutral-900"
              >
                {isAdding ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm vào giỏ</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts;
