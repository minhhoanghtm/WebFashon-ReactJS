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
import {
  fallbackProductDetails,
  fallbackRelatedProducts,
} from "./productDetailMockData";
import { mockProducts as homeMocks } from "../Home/homeMockData";
import { mockProducts as searchMocks } from "../ProductSearch/productMockData";
import "./ProductDetail.css";

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
      : fallbackRelatedProducts;

    return sourceProducts
      .map((item, index) => normalizeRelatedProduct(item, index))
      .filter((item) => item.id !== product?.id)
      .slice(0, 4);
  }, [product?.id, relatedProducts]);

  useDocumentTitle(product?.name || "Chi tiết sản phẩm");

  useEffect(() => {
    if (product) {
      console.log("Chi tiết sản phẩm:", product);
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
        console.log("ID route (slug param):", slug);

        // 1. Check if it's a mock product
        if (slug.startsWith("mock-")) {
          const homeMock = homeMocks.find((p) => p.id === slug);
          const searchMock = searchMocks.find((p) => p.id === slug);
          const rawMock = homeMock || searchMock;

          if (rawMock) {
            productData = {
              _id: rawMock.id,
              id: rawMock.id,
              name: rawMock.name,
              new_price: rawMock.price,
              old_price: rawMock.oldPrice || 0,
              image: rawMock.image,
              displayProduct: [rawMock.image],
              category: rawMock.category,
              description: rawMock.description,
              rating: rawMock.rating,
              slug: rawMock.id,
              isMock: true,
            };

            // Setup mock variants
            const colors = rawMock.color || ["Mặc định"];
            const sizes = rawMock.size || ["S", "M", "L"];
            const mockVars = [];
            let varIdx = 0;
            colors.forEach((color) => {
              sizes.forEach((size) => {
                mockVars.push({
                  _id: `${rawMock.id}-var-${varIdx++}`,
                  color,
                  size,
                  stock: 10,
                  image_url: rawMock.image,
                });
              });
            });

            setVariants(mockVars);
            setReviews([]);

            // Related products: filter out current and show other mock products
            const allMocks = [...homeMocks, ...searchMocks];
            const related = allMocks
              .filter((p) => p.id !== rawMock.id)
              // remove duplicates by id
              .filter((value, index, self) => self.findIndex((t) => t.id === value.id) === index)
              .slice(0, 4)
              .map((p) => ({
                _id: p.id,
                id: p.id,
                name: p.name,
                new_price: p.price,
                old_price: p.oldPrice || 0,
                image: p.image,
                slug: p.id,
              }));
            setRelatedProducts(related);
          }
        }

        // 2. Nếu không phải mock, thử tải theo API của Nam
        if (!productData) {
          // Thử tải sản phẩm theo slug
          try {
            productData = await getProductBySlugService(slug);
            console.log("Loaded product by slug:", productData);
          } catch {
            // Nếu lỗi, thử tải theo ID
            try {
              productData = await getProductDetailByIdService(slug);
              console.log("Loaded product by ID:", productData);
            } catch (idError) {
              console.warn("API chi tiết theo ID thất bại:", idError);
            }
          }
        }

        // 3. Nếu vẫn không thấy, thử tìm trong toàn bộ sản phẩm của shop
        if (!productData) {
          try {
            console.log("Đang thử fallback tìm trong toàn bộ sản phẩm...");
            const allProducts = await getAllProductService();
            console.log("Product list (all products loaded):", allProducts);

            if (Array.isArray(allProducts)) {
              productData = allProducts.find(
                (item) =>
                  String(getProductId(item)) === String(slug) ||
                  item.slug === slug
              );
              if (productData) {
                console.log("Tìm thấy sản phẩm trong danh sách fallback:", productData);
              }
            }
          } catch (listError) {
            console.error("Lỗi khi tải danh sách sản phẩm fallback:", listError);
          }
        }

        // 4. Nếu vẫn không thấy, thử tìm trong fallback mock data
        if (!productData) {
          productData = fallbackProductDetails.find(
            (item) => item.slug === slug || item.id === slug,
          );
          if (productData) {
            console.log("Tìm thấy sản phẩm trong mock data:", productData);
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
        const isMockProduct = Boolean(productData.isMock);

        const categoryId =
          typeof productData.category_id === "object"
            ? productData.category_id?._id
            : productData.category_id;

        window.scrollTo({ top: 0, behavior: "smooth" });

        // Tải các dữ liệu phụ trợ (không để lỗi các API này làm sập trang)
        const [variantData, reviewData, relatedData] = await Promise.all([
          (!isMockProduct && productId
            ? getProductVariantByProductIdService(productId)
            : Promise.resolve([])
          ).catch((err) => {
            console.error("Lỗi khi tải variants:", err);
            return [];
          }),
          (!isMockProduct && productId
            ? getReviewsByProductIdService(productId)
            : Promise.resolve([])
          ).catch((err) => {
            console.error("Lỗi khi tải reviews:", err);
            return [];
          }),
          (!isMockProduct && categoryId
            ? getProductByCategoryService(categoryId, 12)
            : !isMockProduct
              ? getAllProductService()
              : Promise.resolve(fallbackRelatedProducts)
          ).catch((err) => {
            console.error("Lỗi khi tải sản phẩm liên quan:", err);
            return [];
          }),
        ]);

        if (!isMounted) return;

        console.log("Variants data loaded:", variantData);
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
