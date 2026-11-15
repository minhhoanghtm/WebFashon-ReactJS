import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Compass, Scissors } from "lucide-react";
import { SignalFabricCanvas } from "../../components/shared/SignalFabricCanvas";
import { ProductCard } from "../../components/shared/ProductCard";
import { productApi, categoryApi, contentApi } from "../../api/endpoints";
import { Button } from "../../components/ui/Button";

export function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [prodRes, catRes, banRes] = await Promise.allSettled([
          productApi.getAll({ limit: 8 }),
          categoryApi.getAll(),
          contentApi.getBanners(),
        ]);

        if (isMounted) {
          if (prodRes.status === "fulfilled") {
            const list = prodRes.value?.data || prodRes.value || [];
            setProducts(Array.isArray(list) ? list : []);
          }
          if (catRes.status === "fulfilled") {
            const cats = catRes.value?.data || catRes.value || [];
            setCategories(Array.isArray(cats) ? cats : []);
          }
          if (banRes.status === "fulfilled") {
            const bans = banRes.value?.data || banRes.value || [];
            setBanners(Array.isArray(bans) ? bans : []);
          }
        }
      } catch (e) {
        console.error("Error loading home data:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full flex flex-col">
      {/* 1. HERO SECTION — One Screen High-Impact Editorial (Taste-skill & Hallmark Floor) */}
      <section
        className="relative min-h-[90svh] flex items-center border-b border-[rgba(244,240,232,0.1)] overflow-hidden"
        data-enter="hero"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-12">
          {/* Left Hero Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(230,81,0,0.12)] border border-[rgba(230,81,0,0.3)] text-[#ff6d00] text-xs font-mono tracking-widest uppercase w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6d00] animate-ping" />
              <span>BỘ SƯU TẬP MAY ĐO MÙA MỚI — 2026/27</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-[#f4f0e8] leading-[1.05]">
              CẤU TRÚC ĐƯƠNG ĐẠI <br />
              <span className="text-[#e65100]">TỐI GIẢN ĐƠN SẮC</span>
            </h1>

            <p className="text-sm sm:text-base text-[#9a989f] max-w-lg leading-relaxed">
              Thiết kế may đo phá cách kết hợp cùng nghệ thuật may thủ công truyền thống. Từng đường cắt và mũi chỉ là sự tuyên ngôn của bản sắc cá nhân.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/products">
                <Button variant="signal" size="lg" className="gap-2">
                  <span>Khám Phá Thiết Kế</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/lookbooks">
                <Button variant="secondary" size="lg">
                  Xem Lookbooks
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Hero 3D Interactive Canvas */}
          <div className="lg:col-span-5 h-[380px] sm:h-[460px] xl:h-[520px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 border border-[rgba(244,240,232,0.15)] bg-[#121215]/50 overflow-hidden">
              <SignalFabricCanvas className="w-full h-full" />
              <div className="absolute top-4 right-4 text-[10px] font-mono tracking-widest text-[#9a989f] uppercase bg-[#0c0c0e]/80 px-2 py-1 border border-white/10">
                TƯƠNG TÁC CHUỘT: SÓNG LỤA ATELIER
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE VALUE PILLARS */}
      <section className="border-b border-[rgba(244,240,232,0.1)] bg-[#0e0e11] py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <Scissors className="text-[#e65100] shrink-0" size={24} />
            <div>
              <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">Haute Tailoring</h4>
              <p className="text-[11px] text-[#9a989f]">May đo chuẩn phom dáng</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <Compass className="text-[#e65100] shrink-0" size={24} />
            <div>
              <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">Đơn Sắc Sang Trọng</h4>
              <p className="text-[11px] text-[#9a989f]">Bảng màu tối giản thanh lịch</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <Shield className="text-[#e65100] shrink-0" size={24} />
            <div>
              <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">Vải Thượng Hạng</h4>
              <p className="text-[11px] text-[#9a989f]">Nguồn gốc xuất xứ chọn lọc</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <Sparkles className="text-[#e65100] shrink-0" size={24} />
            <div>
              <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8]">Trợ Lý Mua Sắm AI</h4>
              <p className="text-[11px] text-[#9a989f]">Tư vấn phối đồ thông minh</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS & CATEGORY INDEX */}
      <section className="py-16 sm:py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
          <div>
            <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
              TUYỂN TẬP SIGNATURE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
              CÁC THIẾT KẾ NỔI BẬT
            </h2>
          </div>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-xs font-display tracking-widest text-[#9a989f] hover:text-[#f4f0e8] uppercase">
            <span>Xem Tất Cả</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Categories Rail */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-6 scrollbar-none">
            <Link
              to="/products"
              className="px-4 py-2 bg-[#e65100] text-white text-xs font-display tracking-wider uppercase shrink-0"
            >
              Tất Cả
            </Link>
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="px-4 py-2 bg-[#161619] border border-[rgba(244,240,232,0.1)] hover:border-[#e65100] text-xs font-display tracking-wider uppercase text-[#f4f0e8] shrink-0 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.length > 0 ? (
            products.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            // Placeholder skeletons if loading
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#161619] animate-pulse border border-white/5" />
            ))
          )}
        </div>
      </section>

      {/* 4. EDITORIAL MANIFESTO CALLOUT */}
      <section className="bg-[#121215] border-y border-[rgba(244,240,232,0.1)] py-16 sm:py-24">
        <div className="max-w-[1000px] mx-auto px-4 text-center space-y-6">
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase">
            TRIẾT LÝ ATELIER
          </span>
          <blockquote className="font-display text-2xl sm:text-4xl text-[#f4f0e8] leading-snug">
            "Chúng tôi không chỉ tạo ra quần áo, chúng tôi tạo dựng nên sự tự tin và cấu trúc thẩm mỹ cho người mặc."
          </blockquote>
          <p className="text-xs sm:text-sm text-[#9a989f] max-w-xl mx-auto">
            Mỗi thiết kế từ 404Studio là kết quả của hàng chục giờ hoàn thiện tỉ mỉ từ những cuộn vải cao cấp nhất.
          </p>
          <div className="pt-2">
            <Link to="/about">
              <Button variant="secondary" size="md">
                Tìm Hiểu Câu Chuyện Thương Hiệu
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
