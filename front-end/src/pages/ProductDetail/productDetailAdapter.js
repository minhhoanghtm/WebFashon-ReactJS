const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const objectIdPattern = /^[a-f\d]{24}$/i;

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value) return [value];
  return [];
};

const getCategory = (product, categoryMap = {}) => {
  const category = firstValue(
    product.category,
    product.categoryName,
    product.loai,
    product.loaiSP,
    product.danhMuc,
    product.tenDanhMuc,
    product.category_id
  );

  if (typeof category === "object" && category !== null) {
    return firstValue(category.name, category.title, category.tenDanhMuc, "");
  }

  if (!category) return "";
  const str = String(category);
  if (categoryMap[str]) return categoryMap[str];
  if (objectIdPattern.test(str)) return "";
  return str;
};

const getImages = (product, variants = []) => {
  const imageSources = [
    ...asArray(product.displayProduct),
    ...asArray(product.images),
    ...asArray(product.imageList),
    firstValue(
      product.image,
      product.imageUrl,
      product.image_url,
      product.thumbnail,
      ""
    ),
    ...variants.map((variant) => variant?.image_url || variant?.image),
  ]
    .filter((u) => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim());

  return [...new Set(imageSources)];
};

const normalizePrice = (product) =>
  Number(
    firstValue(
      product.new_price,
      product.price,
      product.gia,
      product.giaSP,
      product.unitPrice,
      0
    )
  ) || 0;

export const normalizeProduct = (p, variants = []) => {
  if (!p) return { variants: [], colors: [], sizes: [] };

  const productVariants =
    Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : Array.isArray(variants)
      ? variants
      : [];

  const colors = Array.isArray(p.colors)
    ? p.colors
    : Array.isArray(p.mauSac)
    ? p.mauSac
    : [];

  const sizes = Array.isArray(p.sizes)
    ? p.sizes
    : Array.isArray(p.kichThuoc)
    ? p.kichThuoc
    : [];

  return {
    variants: productVariants,
    colors,
    sizes,
  };
};

export const normalizeProductDetail = (
  product,
  variants = [],
  reviews = [],
  categoryMap = {}
) => {
  if (!product) return null;

  const price = normalizePrice(product);
  const oldPrice =
    Number(firstValue(product.old_price, product.oldPrice, product.giaCu, 0)) ||
    0;
  const stockValue = firstValue(
    product.stock,
    product.quantity,
    product.soLuong,
    null
  );
  const stock = stockValue === null ? null : Number(stockValue) || 0;
  const reviewCount = Number(
    firstValue(product.reviewCount, product.totalReview, reviews.length, 0)
  );
  const rawRating = Number(firstValue(product.rating, product.rate, 0)) || 0;
  const description = firstValue(
    product.description,
    product.moTa,
    product.ghiChu,
    ""
  );

  const normalizedOptions = normalizeProduct(product, variants);
  const images = getImages(product, normalizedOptions.variants);

  return {
    ...product,
    id: String(firstValue(product.id, product._id, product.productId, "")),
    _id: product._id || product.id,
    sku: firstValue(
      product.sku,
      product.code,
      product.maSP,
      product.maSanPham,
      ""
    ),
    slug: firstValue(product.slug, product.productSlug, ""),
    name: firstValue(
      product.name,
      product.productName,
      product.tenSP,
      product.title,
      "Thiết kế chưa đặt tên"
    ),
    price,
    oldPrice,
    images,
    displayProduct: images,
    category: getCategory(product, categoryMap),
    category_id: String(product.category_id?._id || product.category_id || ""),
    description,
    rating:
      Number.isFinite(rawRating) && rawRating > 0
        ? Math.min(Math.max(rawRating, 0), 5)
        : 0,
    reviewCount,
    stock,
    isSoldOut: stock !== null && stock <= 0,
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
      "Khách hàng"
    );
    const date = review.createdAt || review.date;

    return {
      id: String(firstValue(review.id, review._id, `review-${index}`)),
      userId: firstValue(review.user_id?._id, review.user_id, ""),
      author,
      rating: Number(firstValue(review.rating, review.rate, 5)) || 5,
      content: firstValue(
        review.content?.text,
        typeof review.content === "string" ? review.content : "",
        review.comment,
        ""
      ),
      images: Array.isArray(review.content?.images)
        ? review.content.images
        : Array.isArray(review.images)
        ? review.images
        : [],
      date: date
        ? new Date(date).toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "",
    };
  });

export const normalizeRelatedProduct = (
  product = {},
  index = 0,
  categoryMap = {}
) => {
  const price = normalizePrice(product);
  const oldPrice =
    Number(firstValue(product.old_price, product.oldPrice, product.giaCu, 0)) ||
    0;
  const images = getImages(product, product.variants || []);
  const rawRating = Number(firstValue(product.rating, product.rate, 0)) || 0;
  const resolvedId = String(
    firstValue(product.id, product._id, `related-${index}`)
  );

  return {
    ...product,
    id: resolvedId,
    _id: product._id || resolvedId,
    slug: firstValue(product.slug, product.productSlug, ""),
    name: firstValue(
      product.name,
      product.productName,
      product.tenSP,
      product.title,
      "Thiết kế chưa đặt tên"
    ),
    price,
    oldPrice,
    image: images[0] || "",
    displayProduct: images,
    category: getCategory(product, categoryMap),
    rating:
      Number.isFinite(rawRating) && rawRating > 0
        ? Math.min(Math.max(rawRating, 0), 5)
        : 0,
  };
};
