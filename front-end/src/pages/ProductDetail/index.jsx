import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertCircle, LoaderCircle, Star } from "lucide-react";
import trackingService from "@/services/tracking.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getAllProductService,
  getProductByCategoryService,
  getProductBySlugService,
  getProductDetailByIdService,
} from "@/services/product.service";
import { getProductVariantByProductIdService } from "@/services/productItem.service";
import { getReviewsByProductIdService } from "@/services/review.service";
import { getAllCategoriesService } from "@/services/category.service";
import { useChatContextStore } from "@/store/chatContext.store";
import { useFavoriteStore } from "@/store/favorite.store";
import { formatCurrency } from "@/utils/format";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "./ProductGallery";
import ProductActions from "./ProductActions";
import {
  normalizeProductDetail,
  normalizeRelatedProduct,
  normalizeReviews,
} from "./productDetailAdapter";

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
  const [categoryMap, setCategoryMap] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id || item._id))),
    [favoriteItems]
  );

  useEffect(() => {
    let mounted = true;
    getAllCategoriesService()
      .then((cats) => {
        if (mounted && Array.isArray(cats)) {
          setCategoryMap(
            Object.fromEntries(
              cats
                .filter((c) => (c?._id || c?.id) && c?.name)
                .map((c) => [String(c._id || c.id), c.name])
            )
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const product = useMemo(
    () => normalizeProductDetail(rawProduct, variants, reviews, categoryMap),
    [rawProduct, variants, reviews, categoryMap]
  );

  const normalizedReviews = useMemo(() => normalizeReviews(reviews), [reviews]);

  const normalizedRelatedProducts = useMemo(() => {
    return (Array.isArray(relatedProducts) ? relatedProducts : [])
      .map((item, idx) => normalizeRelatedProduct(item, idx, categoryMap))
      .filter((item) => String(item.id) !== String(product?.id))
      .slice(0, 4);
  }, [product?.id, relatedProducts, categoryMap]);

  const setContext = useChatContextStore((state) => state.setContext);

  useEffect(() => {
    if (!product) return;
    setContext({
      type: "product",
      productid: product.id,
      slug: product.slug,
      productName: product.name,
      old_price: product.oldPrice,
      new_price: product.price,
      rating: product.rating,
      image: product.images?.[0] || null,
    });
  }, [product, setContext]);

  useDocumentTitle(product?.name || "Chi tiết thiết kế");

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
  }, [rawProduct, product]);

  useEffect(() => {
    let isMounted = true;

    const fetchProductDetail = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      setSelectedVariant(null);

      try {
        let productData = null;

        try {
          productData = await getProductBySlugService(slug);
        } catch {
          try {
            productData = await getProductDetailByIdService(slug);
          } catch {
            // fallback to list search
          }
        }

        if (!productData) {
          try {
            const allProducts = await getAllProductService();
            if (Array.isArray(allProducts)) {
              productData = allProducts.find(
                (item) =>
                  String(getProductId(item)) === String(slug) ||
                  item.slug === slug
              );
            }
          } catch {
            // ignore
          }
        }

        if (!productData) {
          throw new Error("Không tìm thấy sản phẩm");
        }

        const resolvedProductId = getProductId(productData);
        const categoryId =
          productData.category_id?._id ||
          productData.category_id ||
          productData.categoryId;

        const [variantResult, reviewResult, relatedResult] =
          await Promise.allSettled([
            resolvedProductId
              ? getProductVariantByProductIdService(resolvedProductId)
              : Promise.resolve([]),
            resolvedProductId
              ? getReviewsByProductIdService(resolvedProductId)
              : Promise.resolve([]),
            categoryId
              ? getProductByCategoryService(categoryId)
              : getAllProductService(),
          ]);

        if (!isMounted) return;

        setRawProduct(productData);
        setVariants(
          variantResult.status === "fulfilled" &&
            Array.isArray(variantResult.value)
            ? variantResult.value
            : []
        );
        setReviews(
          reviewResult.status === "fulfilled" &&
            Array.isArray(reviewResult.value)
            ? reviewResult.value
            : []
        );
        setRelatedProducts(
          relatedResult.status === "fulfilled" &&
            Array.isArray(relatedResult.value)
            ? relatedResult.value
            : []
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Không thể tải thông tin thiết kế.");
        setRawProduct(null);
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

  const galleryImages = useMemo(() => {
    const base = Array.isArray(product?.images) ? product.images : [];
    const variantImg = selectedVariant?.image_url || selectedVariant?.image;
    if (variantImg && typeof variantImg === "string") {
      return [variantImg, ...base.filter((u) => u !== variantImg)];
    }
    return base;
  }, [product?.images, selectedVariant]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-8 text-center">
        <LoaderCircle
          className="mb-3 animate-spin text-foreground"
          size={32}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Đang tải chi tiết thiết kế...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center border border-border bg-secondary text-foreground">
          <AlertCircle size={26} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h1 className="font-sans font-semibold text-2xl text-foreground sm:text-3xl leading-snug">
          {error || "Thiết kế không tồn tại"}
        </h1>
        <p className="mt-2 mb-6 max-w-md text-xs leading-relaxed text-muted-foreground">
          Thiết kế bạn đang tìm kiếm có thể đã ngừng phát hành hoặc thay đổi
          đường dẫn.
        </p>
        <Link
          to="/products"
          className="touch-target inline-flex items-center justify-center bg-primary px-6 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground"
        >
          Quay lại Bộ sưu tập
        </Link>
      </div>
    );
  }

  const discountPercent =
    product.oldPrice > product.price && product.price > 0
      ? Math.round(
          ((product.oldPrice - product.price) / product.oldPrice) * 100
        )
      : 0;

  return (
    <div className="min-h-screen bg-background text-foreground py-2 lg:py-0 pb-24 lg:pb-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 h-full">
        {/* Main 2-Column Product Showcase (Fits in 1st screen on desktop) */}
        <section
          aria-label="Thông tin và hình ảnh thiết kế"
          className="lg:h-[calc(100svh-5rem)] lg:min-h-[calc(100svh-5rem)] lg:max-h-[calc(100svh-5rem)] flex flex-col pt-1 sm:pt-2 lg:pt-2.5 pb-2 lg:pb-3 overflow-hidden"
        >
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="shrink-0 mb-2 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.16em] uppercase text-muted-foreground border-b border-border/40 pb-2"
          >
            <Link to="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-foreground">
              Bộ sưu tập
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  to={`/products?category=${encodeURIComponent(
                    product.category_id || product.category
                  )}`}
                  className="hover:text-foreground"
                >
                  {product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="inline-block truncate font-semibold text-foreground max-w-[180px] sm:max-w-xs align-bottom">
              {product.name}
            </span>
          </nav>

          {/* 2-Column Showcase */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-6 xl:col-span-7 h-full min-h-0">
              <ProductGallery
                key={`${product.id}-${selectedVariant?._id || "base"}`}
                images={galleryImages}
                productName={product.name}
              />
            </div>

            {/* Right Column: Specification & Actions */}
            <div className="lg:col-span-6 xl:col-span-5 h-full min-h-0 flex flex-col justify-between overflow-y-auto pr-1">
              <div className="space-y-3">
                {/* Header Info */}
                <div className="space-y-1.5 border-b border-border/40 pb-2.5">
                  {product.category && (
                    <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
                      {product.category}
                    </p>
                  )}

                  <h1 className="font-display text-xl sm:text-2xl lg:text-[clamp(1.25rem,1.7vw,1.75rem)] font-medium uppercase tracking-tight text-foreground leading-snug">
                    {product.name}
                  </h1>

                  {/* Price, Discount & Rating on 1-2 compact lines */}
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <strong className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
                      {product.price > 0
                        ? formatCurrency(product.price)
                        : "Liên hệ"}
                    </strong>
                    {product.oldPrice > product.price && product.price > 0 && (
                      <del className="text-xs sm:text-sm tabular-nums text-muted-foreground line-through">
                        {formatCurrency(product.oldPrice)}
                      </del>
                    )}
                    {discountPercent > 0 && (
                      <span className="border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase text-foreground">
                        -{discountPercent}%
                      </span>
                    )}
                    {(product.rating > 0 || product.sold > 0) && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground ml-auto">
                        {product.rating > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Star
                              size={12}
                              fill="currentColor"
                              className="text-foreground"
                            />
                            <span>{product.rating.toFixed(1)}</span>
                          </span>
                        )}
                        {product.sold > 0 && (
                          <span>Đã bán {product.sold}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Variant Selection & Cart Actions */}
                <ProductActions
                  product={product}
                  variants={variants}
                  onVariantChange={setSelectedVariant}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Description Section (Below first screen) */}
        {product.description && (
          <section
            aria-labelledby="product-description-heading"
            className="mt-12 sm:mt-16 border-t border-border pt-8 sm:pt-12"
          >
            <div className="max-w-3xl">
              <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
                Chi tiết thiết kế
              </p>
              <h2
                id="product-description-heading"
                className="mt-1 font-display text-2xl font-normal uppercase text-foreground sm:text-3xl"
              >
                Câu chuyện & Chất liệu
              </h2>
              <p className="mt-4 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          </section>
        )}

        {/* Real Customer Reviews Section */}
        <section
          aria-labelledby="product-reviews-heading"
          className="mt-16 border-t border-border pt-12"
        >
          <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
                Phản hồi từ Khách hàng
              </p>
              <h2
                id="product-reviews-heading"
                className="mt-1 font-display text-2xl font-normal uppercase text-foreground sm:text-3xl"
              >
                Đánh giá thực tế ({normalizedReviews.length})
              </h2>
            </div>
          </div>

          {normalizedReviews.length === 0 ? (
            <div className="border border-border bg-card p-8 text-center">
              <p className="text-xs text-muted-foreground">
                Chưa có đánh giá nào cho thiết kế này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {normalizedReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="space-y-3 border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-semibold text-foreground">
                      {rev.author}
                    </strong>
                    {rev.date && (
                      <span className="text-[11px] text-muted-foreground">
                        {rev.date}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-foreground">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={12}
                        fill={idx < rev.rating ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  {rev.content && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {rev.content}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Related Products Section */}
        {normalizedRelatedProducts.length > 0 && (
          <section
            aria-labelledby="related-products-heading"
            className="mt-16 border-t border-border pt-12"
          >
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
                  Đồng điệu phong cách
                </p>
                <h2
                  id="related-products-heading"
                  className="mt-1 font-display text-2xl font-normal uppercase text-foreground sm:text-3xl"
                >
                  Thiết kế cùng danh mục
                </h2>
              </div>
              <Link
                to="/products"
                className="text-xs font-medium tracking-[0.16em] uppercase text-foreground underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {normalizedRelatedProducts.map((relProduct, idx) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  isFavorite={favoriteIds.has(String(relProduct.id))}
                  onToggleFavorite={toggleFavorite}
                  trackingMeta={{
                    position: idx + 1,
                    source: "related_products",
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;