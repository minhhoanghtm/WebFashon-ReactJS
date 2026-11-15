import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RefreshCw,
  Scissors,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Star,
  Info,
  Ruler,
} from "lucide-react";
import { productApi } from "../../api/endpoints";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../../components/ui/Button";
import { CompleteTheLook } from "../../components/shared/CompleteTheLook";
import { SmartSizeAssistantModal } from "../../components/shared/SmartSizeAssistantModal";
import { SafeImage } from "../../components/ui/SafeImage";
import { ProductCard } from "../../components/shared/ProductCard";

export function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isSizeGuideTableOpen, setIsSizeGuideTableOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(0); // 0: Material, 1: Shipping, 2: Care
  const [relatedProducts, setRelatedProducts] = useState([]);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await productApi.getBySlug(slug);
        const data = res.data || res;
        if (active && data) {
          setProduct(data);
          const defaultImg =
            data.displayProduct?.[0] ||
            data.displayProduct ||
            data.images?.[0] ||
            data.image ||
            "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80";
          setSelectedImage(defaultImg);

          let varList = Array.isArray(data.variants) && data.variants.length > 0 ? data.variants : null;
          if (!varList) {
            const [varRes, availRes] = await Promise.allSettled([
              productApi.getVariants(data._id),
              productApi.getAvailability(data._id),
            ]);
            if (varRes.status === "fulfilled") {
              const resData = varRes.value?.data || varRes.value || [];
              varList = Array.isArray(resData) ? resData : [];
            }
            if (availRes.status === "fulfilled" && availRes.value) {
              setAvailability(availRes.value);
            }
          }
          const finalVariants = Array.isArray(varList) ? varList : [];
          setVariants(finalVariants);
          if (finalVariants.length > 0) {
            setSelectedVariant(finalVariants[0]);
          }

          // Fetch related products from same category
          try {
            const relRes = await productApi.getAll({ limit: 4 });
            const relList = relRes.data || relRes || [];
            if (Array.isArray(relList)) {
              setRelatedProducts(relList.filter((p) => p._id !== data._id).slice(0, 4));
            }
          } catch (e) {
            // Ignore related fetch error
          }
        }
      } catch (err) {
        console.error("ProductDetail fetch error:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProduct();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product._id,
      productId: product._id,
      variantId: selectedVariant?._id || null,
      name: product.name,
      price: product.price || product.new_price || 0,
      image: selectedImage,
      quantity,
      variantDetails: selectedVariant
        ? `${selectedVariant.color || ""} - ${selectedVariant.size || ""}`
        : null,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
        <div className="aspect-[3/4] bg-[#161619]" />
        <div className="space-y-6">
          <div className="h-8 bg-[#161619] w-3/4" />
          <div className="h-6 bg-[#161619] w-1/4" />
          <div className="h-24 bg-[#161619] w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl uppercase text-[#f4f0e8]">
          Không tìm thấy thiết kế này
        </h2>
        <Link to="/products">
          <Button variant="signal" size="md">
            Quay Lại Danh Mục
          </Button>
        </Link>
      </div>
    );
  }

  const price = product.price || product.new_price || 0;
  const oldPrice = product.old_price || product.oldPrice || null;
  const imageList =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [selectedImage];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[#9a989f] mb-8 uppercase tracking-wider">
        <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-white transition-colors">Bộ Sưu Tập</Link>
        <ChevronRight size={12} />
        <span className="text-[#f4f0e8] truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* 2. Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* Left Gallery */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          {imageList.length > 1 && (
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:w-20 shrink-0">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 md:w-20 aspect-[3/4] border overflow-hidden transition-all ${
                    selectedImage === img
                      ? "border-[#e65100]"
                      : "border-[rgba(244,240,232,0.15)] opacity-60 hover:opacity-100"
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`${product?.name || "Product"} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Visual Frame */}
          <div className="flex-1 aspect-[3/4] bg-[#161619] border border-[rgba(244,240,232,0.15)] overflow-hidden">
            <SafeImage
              src={selectedImage}
              alt={product.name}
              priority={true}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Right Product Purchase Ledger */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f0e8]">
                {product.name}
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9a989f] block mt-1">
                {product.category?.name || "Atelier Collection"}
              </span>
            </div>

            {/* Price Box & Stock Indicator */}
            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 border-b border-[rgba(244,240,232,0.1)] tabular-nums">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-[#f4f0e8]">
                  {price.toLocaleString("vi-VN")} ₫
                </span>
                {oldPrice && oldPrice > price && (
                  <span className="text-base text-[#6b6973] line-through font-mono">
                    {oldPrice.toLocaleString("vi-VN")} ₫
                  </span>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Còn Hàng Tại Atelier</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#9a989f] measure-prose leading-relaxed">
              {product.description ||
                "Thiết kế may đo phá cách kết hợp cùng nghệ thuật may thủ công truyền thống. Từng đường cắt và mũi chỉ là sự tuyên ngôn của bản sắc cá nhân."}
            </p>

            {/* Variants Selector */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block">
                    Kích Thước & Biến Thể:
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSizeGuideTableOpen(true)}
                      className="text-[11px] font-mono text-[#9a989f] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Ruler size={12} />
                      <span>Bảng Size</span>
                    </button>
                    <button
                      onClick={() => setIsSizeModalOpen(true)}
                      className="text-[11px] font-mono text-[#ff6d00] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Scissors size={12} />
                      <span>Tư Vấn AI</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      className={`min-h-[40px] px-3.5 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${
                        selectedVariant?._id === v._id
                          ? "border-[#e65100] bg-[rgba(230,81,0,0.15)] text-[#ff6d00] font-bold"
                          : "border-[rgba(244,240,232,0.15)] bg-[#161619] text-[#f4f0e8] hover:border-white/40"
                      }`}
                    >
                      {v.color} - {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and CTA */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9a989f]">
                  Số Lượng:
                </span>
                <div className="flex items-center border border-[rgba(244,240,232,0.2)] bg-[#161619]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="min-h-[40px] min-w-[40px] text-sm text-[#f4f0e8] hover:bg-white/5"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-mono font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="min-h-[40px] min-w-[40px] text-sm text-[#f4f0e8] hover:bg-white/5"
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                variant={isAdded ? "primary" : "signal"}
                size="lg"
                className="w-full gap-2 py-4"
                onClick={handleAddToCart}
              >
                {isAdded ? (
                  <>
                    <Check size={18} className="text-emerald-500" />
                    <span>Đã Thêm Vào Giỏ Hàng!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>Thêm Vào Giỏ Hàng</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Accordion Tabs for Craftsmanship, Shipping & Garment Care */}
          <div className="pt-6 border-t border-[rgba(244,240,232,0.1)] space-y-2">
            {[
              {
                title: "Chi Tiết May Đo & Chất Liệu Vải",
                content:
                  "Chất liệu len dệt tự nhiên nhập khẩu từ vùng Biella (Ý). Cấu trúc lót lụa tơ tằm nguyên bản, chống tĩnh điện và thoáng khí. May đo theo phương pháp bán thủ công (Half-Canvas) giữ phom ve áo bền vững.",
              },
              {
                title: "Chính Sách Vận Chuyển & Đổi Trả",
                content:
                  "Miễn phí vận chuyển toàn quốc cho đơn hàng này. Đổi size hoặc đổi mẫu tận nơi trong vòng 07 ngày miễn phí. Sản phẩm được bọc túi chống ẩm và hộp quà đen Atelier sang trọng.",
              },
              {
                title: "Hướng Dẫn Giặt Ủi & Bảo Quản",
                content:
                  "Khuyến khích giặt hấp khô chuyên nghiệp định kỳ. Khi ủi nên sử dụng bàn ủi hơi nước với lớp vải lót bảo vệ. Dùng móc treo vai gỗ chuyên dụng để giữ dáng áo luôn đứng chuẩn.",
              },
            ].map((tab, idx) => (
              <div key={idx} className="border border-white/10 bg-[#161619]">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === idx ? -1 : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-display uppercase tracking-wider text-[#f4f0e8]"
                >
                  <span className="font-bold">{tab.title}</span>
                  <ChevronDown
                    size={14}
                    className={`text-[#e65100] transition-transform ${
                      activeAccordion === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeAccordion === idx && (
                  <div className="p-3.5 pt-0 text-xs text-[#9a989f] leading-relaxed border-t border-white/5 animate-fade-in">
                    {tab.content}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Service Guarantee Badges */}
          <div className="pt-4 border-t border-[rgba(244,240,232,0.1)] grid grid-cols-2 gap-4 text-[11px] text-[#9a989f]">
            <div className="flex items-center gap-2.5">
              <Truck size={16} className="text-[#e65100]" />
              <span>Giao hàng toàn quốc</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCw size={16} className="text-[#e65100]" />
              <span>Đổi trả 7 ngày</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Scissors size={16} className="text-[#e65100]" />
              <span>Bảo hành may đo</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-[#e65100]" />
              <span>Chính hãng 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPLETE THE LOOK SECTION */}
      <CompleteTheLook currentProduct={product} />

      {/* 4. RELATED PRODUCTS SECTION */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[rgba(244,240,232,0.12)]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
                CÁC THIẾT KẾ CÙNG BỘ SƯU TẬP
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-display uppercase tracking-widest text-[#9a989f] hover:text-[#e65100] flex items-center gap-1"
            >
              <span>Xem Tất Cả</span>
              <ChevronRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel._id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* 5. SIZE GUIDE TABLE MODAL */}
      {isSizeGuideTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#121215] border border-[rgba(244,240,232,0.15)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-sm uppercase tracking-wider text-[#f4f0e8] font-bold">
                Bảng Thông Số Kích Thước Chuẩn
              </h3>
              <button
                onClick={() => setIsSizeGuideTableOpen(false)}
                className="text-[#9a989f] hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[#e65100]">
                    <th className="py-2">Size</th>
                    <th className="py-2">Vòng Ngực (cm)</th>
                    <th className="py-2">Vòng Eo (cm)</th>
                    <th className="py-2">Dài Áo (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#9a989f]">
                  <tr>
                    <td className="py-2 font-bold text-white">S (46)</td>
                    <td className="py-2">88 - 92</td>
                    <td className="py-2">74 - 78</td>
                    <td className="py-2">70</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">M (48)</td>
                    <td className="py-2">93 - 97</td>
                    <td className="py-2">79 - 83</td>
                    <td className="py-2">72</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">L (50)</td>
                    <td className="py-2">98 - 102</td>
                    <td className="py-2">84 - 88</td>
                    <td className="py-2">74</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-white">XL (52)</td>
                    <td className="py-2">103 - 108</td>
                    <td className="py-2">89 - 94</td>
                    <td className="py-2">76</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[#9a989f]">
              * Nếu số đo của bạn nằm giữa hai size, hãy chọn size lớn hơn để có phom dáng thoải mái hoặc sử dụng Trợ lý AI để được tư vấn chính xác.
            </p>
          </div>
        </div>
      )}

      {/* 6. SMART SIZE ASSISTANT MODAL */}
      <SmartSizeAssistantModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSelectSize={(recommendedSize) => {
          const match = variants.find(
            (v) => v.size && v.size.trim().toUpperCase() === recommendedSize.toUpperCase()
          );
          if (match) {
            setSelectedVariant(match);
          }
        }}
      />

      {/* 7. MOBILE STICKY BUY DOCK (Ergonomics for screens < 1024px) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#121215]/95 backdrop-blur-md border-t border-[rgba(244,240,232,0.15)] p-3 px-4 flex items-center justify-between gap-3 lg:hidden">
        <div className="flex flex-col tabular-nums">
          <span className="text-[10px] font-mono text-[#9a989f] uppercase">Giá Trọn Gói</span>
          <span className="font-display text-base font-bold text-[#f4f0e8]">
            {price.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <Button
          variant={isAdded ? "primary" : "signal"}
          size="sm"
          className="flex-1 max-w-[200px] gap-1.5 py-2.5 text-xs font-semibold"
          onClick={handleAddToCart}
        >
          {isAdded ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span>Đã Thêm!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={14} />
              <span>Thêm Giỏ Hàng</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
