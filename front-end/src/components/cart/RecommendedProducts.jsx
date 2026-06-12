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
      <div className="space-y-4 pt-10 border-t border-slate-100 dark:border-slate-800/80">
        <h3 className="text-xl font-bold tracking-tight text-left">Có thể bạn sẽ thích</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 pt-10 border-t border-slate-150 dark:border-slate-800/80 text-left">
      <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Có thể bạn sẽ thích
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((prod) => {
          const mainImg = prod.image || (prod.displayProduct && prod.displayProduct[0]) || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
          const hasDiscount = prod.old_price > prod.new_price;
          const isAdding = addingId === prod._id;

          return (
            <div
              key={prod._id || prod.id}
              className="bg-white dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
            >
              {/* Product Link wrapper */}
              <Link to={`/product/${prod.slug}`} className="block flex-1">
                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 relative">
                  <img
                    src={mainImg}
                    alt={prod.name}
                    className="w-full h-full object-cover object-center group-hover:scale-104 transition duration-300"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=60";
                    }}
                  />
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {prod.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {formatPrice(prod.new_price)}
                    </span>
                    {hasDiscount && (
                      <s className="text-xs text-slate-400 dark:text-slate-600">
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
                className="mt-3.5 w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white text-xs font-bold rounded-xl transition duration-200 cursor-pointer"
              >
                {isAdding ? (
                  <Loader className="h-4 w-4 animate-spin" />
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
