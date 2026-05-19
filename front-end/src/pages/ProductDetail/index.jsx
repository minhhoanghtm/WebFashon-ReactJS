import { useEffect, useState } from "react";
import ProductInfo from "./ProductInfo";
import ProductReview from "./ProductReview";
import PurchaseActions from "./PurchaseActions";
import { useParams } from "react-router-dom";
import {
  getProductByCategoryService,
  getProductBySlugService,
} from "@/services/product.service";
import { getProductVariantByIdService } from "@/services/productItem.service";
import { getReviewsByProductIdService } from "@/services/review.service";
import RelatedProducts from "./RelatedProducts";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

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
  //tính tiền thanh toán
  const totalPrice =
  (Number(selected?.quantity) || 0) *
  (Number(product?.new_price) || 0);
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

        //Lấy thông tin sản phẩm theo slug
        const productData = await getProductBySlugService(slug);
        setProduct(productData);
        console.log("Product data:", productData);

        if (!productData) return;

        //Lấy thông tin biến thể sản phẩm theo productId
        const variantRes = await getProductVariantByIdService(productData._id);
        const variantData = variantRes || [];
        setVariants(variantData);
        console.log("Variant data:", variantData);

        //Lấy thông tin đánh giá sản phẩm theo productId
        const reviewRes = await getReviewsByProductIdService(productData._id);
        const reviewData = reviewRes || [];
        setReviews(reviewData);
        console.log("Review data:", reviewData);

        //Lấy thông tin sản phẩm liên quan theo categoryId
        const relatedRes = await getProductByCategoryService(
          productData.category_id,
          12,
        );
        const relatedData = relatedRes || [];
        setRelatedProducts(relatedData);
        console.log("Related products data:", relatedData);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
  }, [slug]);

  return (
    <div className="relative">
      <ProductInfo
        product={product}
        variants={variants}
        selected={selected}
        updateSelected={updateSelected}
      />
      <ProductReview reviews={reviews} />
      <RelatedProducts relatedProducts={relatedProducts} />
      <PurchaseActions
        product={product}
        variants={variants}
        selected={selected}
        totalPrice={totalPrice}
      />
    </div>
  );
};

export default ProductDetail;
