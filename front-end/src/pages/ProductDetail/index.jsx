import { useEffect, useState } from "react";
import ProductInfo from "./ProductInfo";
import ProductReview from "./ProductReview";
import { useParams } from "react-router-dom";
import {
  getProductByCategoryService,
  getProductBySlugService,
} from "@/services/product.service";
import { getProductVariantByProductIdService } from "@/services/productItem.service";
import { getReviewsByProductIdService } from "@/services/review.service";
import RelatedProducts from "./RelatedProducts";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  useDocumentTitle(product?.name || "Chi tiết sản phẩm");
  const [variants, setVariants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selected, setSelected] = useState({
    color: null,
    size: null,
    quantity: 1,
  });

  const [activeTab, setActiveTab] = useState("description"); // "description", "care", "shipping"

  // Cập nhật selected state
  const updateSelected = (key, value) => {
    setSelected(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!slug) return;

        // Lấy thông tin sản phẩm theo slug
        const productData = await getProductBySlugService(slug);
        setProduct(productData);
        console.log("Product data:", productData);

        if (!productData) return;

        // Lấy thông tin biến thể sản phẩm theo productId
        const productId = productData._id ?? productData.id;
        if (productId) {
          const variantRes = await getProductVariantByProductIdService(productId);
          const variantData = variantRes || [];
          setVariants(variantData);
          console.log("Variant data:", variantData);
        }

        // Lấy thông tin đánh giá sản phẩm theo productId
        if (productId) {
          const reviewRes = await getReviewsByProductIdService(productId);
          const reviewData = reviewRes || [];
          setReviews(reviewData);
          console.log("Review data:", reviewData);
        }

        // Lấy thông tin sản phẩm liên quan theo categoryId
        if (productData.category_id) {
          const relatedRes = await getProductByCategoryService(
            productData.category_id,
            12,
          );
          const relatedData = relatedRes || [];
          setRelatedProducts(relatedData);
          console.log("Related products data:", relatedData);
        } else {
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [slug]);

  if (!product) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Generate a nice mock SKU based on product id
  const displaySku = product.sku || `LUS-TR-${(product._id || product.id || "000").slice(-4).toUpperCase()}`;

  return (
    <div className="max-w-[1300px] mx-auto px-6 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="pd-breadcrumb">
        Trang chủ <span>›</span> Cửa hàng <span>›</span> Thời trang <span>›</span> {product.name}
      </div>

      {/* Main product detail section */}
      <ProductInfo
        product={product}
        variants={variants}
        selected={selected}
        updateSelected={updateSelected}
      />

      {/* Bottom info section */}
      <div className="pd-bottom-wrap">
        <div className="pd-divider"></div>

        {/* Tabs headings */}
        <div className="pd-tabs">
          <button
            onClick={() => setActiveTab("description")}
            className={`pd-tab-btn ${activeTab === "description" ? "active" : ""}`}
          >
            Mô tả sản phẩm
          </button>
          <button
            onClick={() => setActiveTab("care")}
            className={`pd-tab-btn ${activeTab === "care" ? "active" : ""}`}
          >
            Chi tiết & Bảo quản
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`pd-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
          >
            Giao hàng & Trả hàng
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "description" && (
          <div className="pd-desc-grid animate-in fade-in duration-200">
            <div className="pd-desc-col">
              <h4>Về sản phẩm này</h4>
              <p>{product.description || "Thiết kế may mặc cao cấp, cắt may tinh tế tôn dáng người mặc và đem lại cảm giác thoải mái khi vận động suốt cả ngày dài."}</p>
              <p>Chất liệu vải cao cấp được tuyển chọn giúp giữ dáng áo/quần bền đẹp, thoáng khí, hoàn hảo khi mặc hàng ngày hoặc trong các dịp quan trọng.</p>
            </div>
            <div className="pd-desc-col">
              <h4>Thành phần & Thông số</h4>
              <div className="pd-spec-row">
                <span className="pd-spec-label">Chất liệu</span>
                <span className="pd-spec-val">72% Wool, 28% Polyester</span>
              </div>
              <div className="pd-spec-row">
                <span className="pd-spec-label">Lớp lót</span>
                <span className="pd-spec-val">100% Viscose</span>
              </div>
              <div className="pd-spec-row">
                <span className="pd-spec-label">Kiểu dáng</span>
                <span className="pd-spec-val">Wide Leg, High Rise</span>
              </div>
              <div className="pd-spec-row">
                <span className="pd-spec-label">Nguồn gốc</span>
                <span className="pd-spec-val">Made in Vietnam</span>
              </div>
              <div className="pd-spec-row">
                <span className="pd-spec-label">Mã SKU</span>
                <span className="pd-spec-val">{displaySku}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "care" && (
          <div className="pd-desc-grid animate-in fade-in duration-200">
            <div className="pd-desc-col">
              <h4>Hướng dẫn giặt ủi</h4>
              <p>Giặt máy ở chế độ giặt nhẹ (delicates hoặc handwash) ở nhiệt độ thường.</p>
              <p>Không dùng thuốc tẩy mạnh hoặc nước giặt có tính tẩy cao. Ủi nhẹ ở nhiệt độ thấp hoặc giặt hấp khô để bảo quản phom dáng sản phẩm tốt nhất.</p>
            </div>
            <div className="pd-desc-col">
              <h4>Hướng dẫn bảo quản</h4>
              <p>Treo sản phẩm bằng móc treo có đệm vai để giữ đúng phom áo và quần.</p>
              <p>Tránh phơi trực tiếp dưới ánh nắng gắt của mặt trời để duy trì độ bền màu tối ưu.</p>
            </div>
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="pd-desc-grid animate-in fade-in duration-200">
            <div className="pd-desc-col">
              <h4>Thông tin giao hàng</h4>
              <p>Miễn phí vận chuyển cho tất cả đơn hàng từ $100 trở lên. Thời gian xử lý đơn hàng nhanh chóng trong vòng 24 giờ.</p>
              <p>Giao hàng tiêu chuẩn mất từ 2-4 ngày làm việc. Có hỗ trợ giao hàng hỏa tốc nội thành.</p>
            </div>
            <div className="pd-desc-col">
              <h4>Chính sách đổi trả</h4>
              <p>Đổi trả dễ dàng trong vòng 7 ngày kể từ ngày nhận hàng thành công nếu phát sinh lỗi từ nhà sản xuất hoặc chọn nhầm size.</p>
              <p>Sản phẩm đổi trả yêu cầu nguyên tem mác, chưa qua sử dụng hoặc giặt là.</p>
            </div>
          </div>
        )}

        <div className="pd-divider"></div>

        {/* Product reviews list */}
        <ProductReview reviews={reviews} productId={product._id || product.id} />

        <div className="pd-divider"></div>

        {/* Related products */}
        <RelatedProducts relatedProducts={relatedProducts} />
      </div>
    </div>
  );
};

export default ProductDetail;
