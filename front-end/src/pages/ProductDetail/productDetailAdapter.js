import brownBagImage from "../Home/assets/product-brown-bag.jpg";
import linenShirtImage from "../Home/assets/product-linen-shirt.jpg";
import navyBlazerImage from "../Home/assets/product-navy-blazer.jpg";
import whiteSneakersImage from "../Home/assets/product-white-sneakers.jpg";

const fallbackImages = [
  linenShirtImage,
  navyBlazerImage,
  whiteSneakersImage,
  brownBagImage,
];

const fallbackDescription =
  "Thông tin sản phẩm đang được cập nhật. Thiết kế được chọn lọc để phù hợp với phong cách hiện đại, dễ phối đồ và thoải mái khi sử dụng hằng ngày.";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const objectIdPattern = /^[a-f\d]{24}$/i;

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

const getCategory = (product) => {
  const category = firstValue(
    product.category,
    product.categoryName,
    product.loai,
    product.loaiSP,
    product.danhMuc,
    product.tenDanhMuc,
    product.category_id,
  );

  if (typeof category === "object") {
    return firstValue(category.name, category.title, category.tenDanhMuc, "");
  }

  if (!category || objectIdPattern.test(String(category))) return "";
  return String(category);
};

const getImages = (product, variants = []) => {
  const imageSources = [
    ...asArray(product.images),
    ...asArray(product.imageList),
    ...asArray(product.hinhAnhList),
    ...asArray(product.displayProduct),
    firstValue(product.image, product.imageUrl, product.thumbnail, product.hinhAnh, ""),
    ...variants.map((variant) => variant?.image_url),
  ];

  const uniqueImages = [...new Set(imageSources.filter(Boolean))];
  return uniqueImages.length ? uniqueImages : fallbackImages;
};

const normalizePrice = (product) =>
  Number(
    firstValue(
      product.new_price,
      product.price,
      product.gia,
      product.giaSP,
      product.unitPrice,
      0,
    ),
  ) || 0;

const getStockLabel = (stock) => {
  if (stock === null || stock === undefined) return "";
  return Number(stock) > 0 ? "Còn hàng" : "Hết hàng";
};

export const normalizeProduct = (p, variants = []) => {
  if (!p) return { variants: [], colors: [], sizes: [] };

  const productVariants =
    p.variants ||
    p.productVariants ||
    (Array.isArray(variants) ? variants : []);

  const colors =
    p.colors ||
    p.mauSac ||
    [];

  const sizes =
    p.sizes ||
    p.kichThuoc ||
    [];

  return {
    variants: Array.isArray(productVariants) ? productVariants : [],
    colors: Array.isArray(colors) ? colors : [],
    sizes: Array.isArray(sizes) ? sizes : [],
  };
};

export const normalizeProductDetail = (product, variants = [], reviews = []) => {
  if (!product) return null;

  const price = normalizePrice(product);
  const oldPrice =
    Number(firstValue(product.old_price, product.oldPrice, product.giaCu, 0)) || 0;
  const stockValue = firstValue(product.stock, product.quantity, product.soLuong, null);
  const stock = stockValue === null ? null : Number(stockValue) || 0;
  const reviewCount = Number(
    firstValue(product.reviewCount, product.totalReview, reviews.length, 0),
  );
  const rating = Number(firstValue(product.rating, product.rate, 0)) || 0;
  const description = firstValue(
    product.description,
    product.moTa,
    product.ghiChu,
    fallbackDescription,
  );

  const normalizedOptions = normalizeProduct(product, variants);

  return {
    id: String(firstValue(product.id, product._id, product.productId, "")),
    sku: firstValue(product.sku, product.code, product.maSP, product.maSanPham, ""),
    slug: firstValue(product.slug, product.productSlug, ""),
    name: firstValue(
      product.name,
      product.productName,
      product.tenSP,
      product.title,
      "Sản phẩm chưa có tên",
    ),
    price,
    oldPrice,
    images: getImages(product, variants),
    category: getCategory(product),
    description,
    shortDescription:
      description.length > 190 ? `${description.slice(0, 190).trim()}...` : description,
    rating: Math.min(Math.max(rating, 0), 5),
    reviewCount,
    stock,
    stockLabel: getStockLabel(stock),
    isSoldOut: stock !== null && stock <= 0,
    badge: firstValue(
      product.badge,
      product.tag,
      oldPrice > price && price > 0 ? `-${Math.round(((oldPrice - price) / oldPrice) * 100)}%` : "",
    ),
    variants: normalizedOptions.variants,
    colors: normalizedOptions.colors,
    sizes: normalizedOptions.sizes,
  };
};

export const normalizeReviews = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).map((review, index) => {
    const author = firstValue(
      review.user_id?.fullName,
      review.user_id?.name,
      review.author,
      review.name,
      "Khách hàng",
    );
    const date = review.createdAt || review.date;

    return {
      id: String(firstValue(review.id, review._id, `review-${index}`)),
      userId: firstValue(review.user_id?._id, review.user_id, ""),
      author,
      rating: Number(firstValue(review.rating, review.rate, 5)) || 5,
      content: firstValue(
        review.content?.text,
        review.content,
        review.comment,
        "Sản phẩm đúng mô tả và chất lượng tốt.",
      ),
      images: Array.isArray(review.content?.images)
        ? review.content.images
        : Array.isArray(review.images)
        ? review.images
        : [],
      videos: Array.isArray(review.content?.videos)
        ? review.content.videos
        : Array.isArray(review.videos)
        ? review.videos
        : [],
      date: date
        ? new Date(date).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Đang cập nhật",
    };
  });

export const normalizeRelatedProduct = (product = {}, index = 0) => {
  const price = normalizePrice(product);
  const images = getImages(product, product.variants || []);
  const rating = Number(firstValue(product.rating, product.rate, 0)) || 0;

  return {
    id: String(firstValue(product.id, product._id, `related-${index}`)),
    slug: firstValue(product.slug, product.productSlug, ""),
    name: firstValue(
      product.name,
      product.productName,
      product.tenSP,
      product.title,
      "Sản phẩm chưa có tên",
    ),
    price,
    image: firstValue(product.image, product.imageUrl, product.thumbnail, images[0]),
    category: getCategory(product) || "Thời trang",
    rating: Math.min(Math.max(rating, 0), 5),
    isMock: Boolean(product.isMock),
  };
};
