import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderHeart, AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { getAllCategoriesService } from "@/services/category.service";

const CategoryShowcase = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getAllCategoriesService();
      setCategories(data);
    } catch (err) {
      console.error("Lỗi khi nạp danh mục trang chủ:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (!loading && !error && categories.length === 0) {
    return null; // Gracefully hide section if no categories exist
  }

  return (
    <section className="home-section home-categories" aria-labelledby="home-categories-title">
      <SectionHeader
        id="home-categories-title"
        eyebrow="Danh mục nổi bật"
        title="Khám phá danh mục"
        subtitle="Lựa chọn hoàn hảo cho phong cách thời trang của bạn"
      />

      {loading ? (
        // Pulsing skeleton loader for category cards
        <div className="flex gap-6 overflow-x-auto pb-4 pt-4 scrollbar-none">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-36 sm:w-44 h-48 sm:h-56 bg-slate-150/70 rounded-2xl animate-pulse relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-200/50 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 h-4 bg-slate-250/70 rounded-md"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error state with retry action
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-rose-50/30 border border-dashed border-rose-200/40 rounded-2xl text-center mt-6">
          <AlertCircle className="h-9 w-9 text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-rose-600">Không thể tải danh mục sản phẩm</p>
          <button
            onClick={fetchCategories}
            className="mt-3 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        // Horizontal Scrollable Cards
        <div className="relative group/scroll mt-6">
          <div className="flex gap-6 overflow-x-auto pb-4 pt-2 scrollbar-none snap-x snap-mandatory">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="flex-shrink-0 w-36 sm:w-44 h-48 sm:h-56 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-150/50 bg-gray-900 snap-start cursor-pointer"
              >
                {/* Background image */}
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500"}
                  alt={cat.name}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500";
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                />

                {/* Dark Vignette Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-all duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-4 text-center">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase drop-shadow-sm select-none">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryShowcase;
