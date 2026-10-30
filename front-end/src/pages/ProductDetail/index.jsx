import { useEffect, useMemo, useState } from "react";
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
      <div className="product-detail-state" role="status">
        <LoaderCircle className="product-detail-state__loader" aria-hidden="true" />
        <span>Đang tải sản phẩm...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-state">
        <AlertCircle size={34} aria-hidden="true" />
        <h1>{error || "Sản phẩm không tồn tại"}</h1>
        <p>Sản phẩm bạn đang tìm có thể đã bị ẩn hoặc đường dẫn không đúng.</p>
        <Link to="/products">Quay lại trang sản phẩm</Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="product-detail__container">
        <nav className="product-detail__breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/products">Sản phẩm</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </nav>

        <section className="product-detail__main" aria-label="Chi tiết sản phẩm">
          <ProductGallery
            key={product.slug || product.id}
            images={product.images}
            productName={product.name}
          />
          <ProductInfo product={product} variants={variants} />
        </section>

        <ProductTabs product={product} variants={variants} />
        <ProductReview
          reviews={normalizedReviews}
          productId={product.id}
          averageRating={product.rating}
        />
        <RelatedProducts products={normalizedRelatedProducts} />
      </div>
    </div>
  );
};

export default ProductDetail;
