import trackingService from "@/services/tracking.service";
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getAllProductService,
  getProductDetailByIdService,
  getProductByCategoryService,
  getProductBySlugService,
} from "@/services/product.service";
import { getProductVariantByProductIdService } from "@/services/productItem.service";
import { getReviewsByProductIdService } from "@/services/review.service";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductReview from "./ProductReview";
import ProductTabs from "./ProductTabs";
import RelatedProducts from "./RelatedProducts";
import {
  normalizeProductDetail,
  normalizeRelatedProduct,
  normalizeReviews,
} from "./productDetailAdapter";
import "./ProductDetail.css";
import { useChatContextStore } from "@/store/chatContext.store";

const getProductId = (p) => {
  if (!p) return "";
  return p.id || p._id || p.productId || p.maSP || "";
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [rawProduct, setRawProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const product = useMemo(
    () => normalizeProductDetail(rawProduct, variants, reviews),
    [rawProduct, variants, reviews],
  );
  const normalizedReviews = useMemo(() => normalizeReviews(reviews), [reviews]);
  const normalizedRelatedProducts = useMemo(() => {
    const sourceProducts = relatedProducts.length
      ? relatedProducts
      : [];

    return sourceProducts
      .map((item, index) => normalizeRelatedProduct(item, index))
      .filter((item) => item.id !== product?.id)
      .slice(0, 4);
  }, [product?.id, relatedProducts]);

  const setContext = useChatContextStore((state) => state.setContext);
  useEffect(() => {
    if(!product) return;
    // console.log("Product: ", product);
    setContext({
      type: 'product',
      productid: product?.id,
      slug: product?.slug,
      productName: product?.name,
      old_price: product?.oldPrice,
      new_price: product?.price,
      rating: product?.rating,
      image: product?.images?.[0] || null,
    });
  }, [product, setContext]);

  useDocumentTitle(product?.name || "Chi tiết sản phẩm");

  const lastTrackedProductIdRef = useRef(null);

  useEffect(() => {
    const pId = String(rawProduct?._id || product?.id || "");
    if (pId && lastTrackedProductIdRef.current !== pId) {
      lastTrackedProductIdRef.current = pId;
      trackingService.trackProductView(product || rawProduct, {
        source: "product_detail",
        price: product?.price || rawProduct?.new_price || 0,
      });
    }
  }, [rawProduct?._id, product?.id, rawProduct?.category_id, product?.category_id, product?.price, rawProduct?.new_price]);

  useEffect(() => {
    if (product) {
      // console.log("Chi tiết sản phẩm:", product);
    }
  }, [product]);

  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      if (!slug) return;

      setIsLoading(true);
      setError(null);

      try {
        let productData;
        // console.log("ID route (slug param):", slug);

        // Thử tải sản phẩm theo slug
        try {
          productData = await getProductBySlugService(slug);
          // console.log("Loaded product by slug:", productData);
        } catch {
          // Nếu lỗi, thử tải theo ID
          try {
            productData = await getProductDetailByIdService(slug);
            // console.log("Loaded product by ID:", productData);
          } catch (idError) {
            console.warn("API chi tiết theo ID thất bại:", idError);
          }
        }

        // Nếu vẫn không thấy, thử tìm trong toàn bộ sản phẩm của shop
        if (!productData) {
          try {
            // console.log("Đang thử fallback tìm trong toàn bộ sản phẩm...");
            const allProducts = await getAllProductService();
            // console.log("Product list (all products loaded):", allProducts);

            if (Array.isArray(allProducts)) {
              productData = allProducts.find(
                (item) =>
                  String(getProductId(item)) === String(slug) ||
                  item.slug === slug
              );
              if (productData) {
                // console.log("Tìm thấy sản phẩm trong danh sách fallback:", productData);
              }
            }
          } catch (listError) {
            console.error("Lỗi khi tải danh sách sản phẩm fallback:", listError);
          }
        }

        if (!isMounted) return;

        if (!productData) {
          setRawProduct(null);
          setError("Sản phẩm không tồn tại");
          console.error("Không tìm thấy sản phẩm với param:", slug);
          return;
        }

        setRawProduct(productData);

        const productId = getProductId(productData);

        const categoryId =
          typeof productData.category_id === "object"
            ? productData.category_id?._id
            : productData.category_id;

        window.scrollTo({ top: 0, behavior: "smooth" });

        // Tải các dữ liệu phụ trợ (không để lỗi các API này làm sập trang)
        const [variantData, reviewData, relatedData] = await Promise.all([
          (productId
            ? getProductVariantByProductIdService(productId)
            : Promise.resolve([])
          ).catch((err) => {
            console.error("Lỗi khi tải variants:", err);
            return [];
          }),
          (productId
            ? getReviewsByProductIdService(productId)
            : Promise.resolve([])
          ).catch((err) => {
            console.error("Lỗi khi tải reviews:", err);
            return [];
          }),
          (categoryId
            ? getProductByCategoryService(categoryId, 12)
            : getAllProductService()
          ).catch((err) => {
            console.error("Lỗi khi tải sản phẩm liên quan:", err);
            return [];
          }),
        ]);

        if (!isMounted) return;

        // console.log("Variants data loaded:", variantData);
        setVariants(Array.isArray(variantData) ? variantData : []);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
        setRelatedProducts(Array.isArray(relatedData) ? relatedData : []);
      } catch (fetchError) {
        console.error("Lỗi nghiêm trọng khi tải chi tiết sản phẩm:", fetchError);
        if (isMounted) {
          setRawProduct(null);
          setError("Sản phẩm không tồn tại");
          setVariants([]);
          setReviews([]);
          setRelatedProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProductDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-8 text-neutral-500" role="status">
        <LoaderCircle className="animate-spin text-[#05251C] mb-3" size={36} aria-hidden="true" />
        <span className="text-sm font-semibold text-[#05251C]">Đang tải chi tiết thiết kế...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#05251C]/5 text-[#05251C] flex items-center justify-center mb-4 border border-[#05251C]/15 shadow-2xs">
          <AlertCircle size={32} aria-hidden="true" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#05251C] font-display uppercase mb-2">
          {error || "Sản phẩm không tồn tại"}
        </h1>
        <p className="text-sm text-[#6B716E] max-w-md mb-6 leading-relaxed">
          Sản phẩm bạn đang tìm kiếm có thể đã hết hàng, đổi tên hoặc đã được cập nhật đường dẫn mới.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#05251C] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#073D2A] hover:text-[#F5DD20] transition duration-200 shadow-sm"
        >
          Khám phá sản phẩm khác
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail min-h-screen bg-[#FBF9F5] py-6 sm:py-8 lg:py-4 select-none">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb thanh lịch */}
        <nav className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-6 lg:mb-3 border-b border-black/[0.05] pb-4 lg:pb-2" aria-label="Điều hướng">
          <Link to="/" className="hover:text-neutral-700 transition">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-neutral-700 transition">Sản phẩm</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-neutral-700 transition">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-800 font-semibold truncate max-w-[240px]">
            {product.name}
          </span>
        </nav>

        {/* Khối chính 2 cột: Gallery bên trái (52%), Information bên phải (48%) */}
        <section className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start" aria-label="Chi tiết sản phẩm">
          {/* Cột Trái: Studio Gallery */}
          <div className="w-full lg:w-[52%] xl:w-[50%] flex-shrink-0">
            <ProductGallery
              key={product.slug || product.id}
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Cột Phải: Information & Actions */}
          <div className="w-full lg:w-[48%] xl:w-[50%] lg:sticky lg:top-24">
            <ProductInfo product={product} variants={variants} />
          </div>
        </section>

        {/* Thông tin mô tả & thông số Tabs */}
        <ProductTabs product={product} variants={variants} />

        {/* Đánh giá từ khách hàng */}
        <ProductReview
          reviews={normalizedReviews}
          productId={product.id}
          averageRating={product.rating}
        />

        {/* Sản phẩm liên quan */}
        <RelatedProducts products={normalizedRelatedProducts} />
      </div>

      {/* Sticky Buy Bar on Mobile (chỉ hiển thị trên mobile) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3 sm:hidden flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={product.images?.[0] || ""}
            alt=""
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-neutral-200"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-neutral-900 truncate">{product.name}</span>
            <strong className="text-xs font-extrabold text-neutral-950 tabular-nums">
              {product.price > 0 ? `${product.price.toLocaleString("vi-VN")} đ` : "Liên hệ"}
            </strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.scrollTo({ top: 380, behavior: "smooth" });
          }}
          className="px-5 py-2.5 rounded-full bg-[#05251C] text-white font-bold text-xs uppercase tracking-wider flex-shrink-0 shadow-md active:scale-95 hover:bg-[#073D2A] hover:text-[#F5DD20] transition duration-200 cursor-pointer"
        >
          Chọn mua
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
