import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, Check, ShieldCheck, Truck, RefreshCw, Scissors, ChevronRight } from "lucide-react";
import { productApi } from "../../api/endpoints";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../../components/ui/Button";

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

          // Fetch variants if available
          const varRes = await productApi.getVariants(data._id).catch(() => null);
          const varList = varRes?.data || varRes || [];
          setVariants(Array.isArray(varList) ? varList : []);
          if (varList.length > 0) {
            setSelectedVariant(varList[0]);
          }

          // Check availability
          const availRes = await productApi.getAvailability(data._id).catch(() => null);
          if (availRes) setAvailability(availRes);
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
  const imageList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [selectedImage];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-[#9a989f] mb-8 uppercase tracking-wider">
        <Link to="/" className="hover:text-white transition-colors">Trang Chủ</Link>
        <ChevronRight size={12} />
        <Link to="/products" className="hover:text-white transition-colors">Bộ Sưu Tập</Link>
        <ChevronRight size={12} />
        <span className="text-[#f4f0e8] truncate max-w-[200px]">{product.name}</span>
      </nav>

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
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Visual Frame */}
          <div className="flex-1 aspect-[3/4] bg-[#161619] border border-[rgba(244,240,232,0.15)] overflow-hidden">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Right Sticky Purchase Ledger */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
                {product.category?.name || "HAUTE COLLECTION"}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f0e8]">
                {product.name}
              </h1>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 pb-4 border-b border-[rgba(244,240,232,0.1)]">
              <span className="font-display text-3xl font-bold text-[#f4f0e8]">
                {price.toLocaleString("vi-VN")} ₫
              </span>
              {oldPrice && oldPrice > price && (
                <span className="text-base text-[#6b6973] line-through font-mono">
                  {oldPrice.toLocaleString("vi-VN")} ₫
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#9a989f] leading-relaxed">
              {product.description ||
                "Thiết kế may đo phá cách kết hợp cùng nghệ thuật may thủ công truyền thống. Từng đường cắt và mũi chỉ là sự tuyên ngôn của bản sắc cá nhân."}
            </p>

            {/* Variants Selector */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block">
                  Chọn Biến Thể (Size / Màu)
                </span>
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

          {/* Service Guarantee Badges */}
          <div className="pt-6 border-t border-[rgba(244,240,232,0.1)] grid grid-cols-2 gap-4 text-[11px] text-[#9a989f]">
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
    </div>
  );
}
