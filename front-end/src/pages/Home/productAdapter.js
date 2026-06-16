import linenShirtImage from "./assets/product-linen-shirt.jpg";

const fallbackProductImage = linenShirtImage;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const getCategoryName = (product) => {
  const category = firstValue(
    product.category,
    product.categoryName,
    product.loai,
    product.loaiSP,
    product.loaiMon,
    product.category_id,
  );

  if (typeof category === "object") {
    return firstValue(category.name, category.title, category.tenLoai, "Thời trang");
  }

  if (
    typeof category === "string" &&
    !/^[a-f\d]{24}$/i.test(category.trim())
  ) {
    return category;
  }

  return "Thời trang";
};

const getProductImage = (product) => {
  const displayImage = Array.isArray(product.displayProduct)
    ? product.displayProduct.find(Boolean)
    : product.displayProduct;

  return firstValue(
    displayImage,
    product.image,
    product.imageUrl,
    product.image_url,
    product.thumbnail,
    product.hinhAnh,
    product.avatar,
    fallbackProductImage,
  );
};

export const normalizeProduct = (product = {}, index = 0, isMock = false) => {
  const price = Number(
    firstValue(
      product.new_price,
      product.price,
      product.gia,
      product.giaSP,
      product.giaMon,
      product.unitPrice,
      0,
    ),
  );
  const oldPrice = Number(
    firstValue(product.old_price, product.oldPrice, product.giaCu, 0),
  );
  const rawRating = Number(firstValue(product.rating, product.rate, 4.6));

  return {
    id: String(
      firstValue(
        product.id,
        product._id,
        product.maSP,
        product.maMon,
        product.productId,
        `san-pham-${index}`,
      ),
    ),
    slug: firstValue(
      product.slug,
      product.productSlug,
      (product.id || product._id)?.startsWith("mock-")
        ? (product.id || product._id)
        : "",
      "",
    ),
    name: firstValue(
      product.name,
      product.productName,
      product.tenSP,
      product.tenMon,
      product.title,
      "Sản phẩm chưa có tên",
    ),
    price: Number.isFinite(price) ? price : 0,
    oldPrice: Number.isFinite(oldPrice) ? oldPrice : 0,
    image: getProductImage(product),
    category: getCategoryName(product),
    description: firstValue(
      product.description,
      product.moTa,
      product.ghiChu,
      "",
    ),
    rating: Number.isFinite(rawRating)
      ? Math.min(Math.max(rawRating, 0), 5)
      : 4.6,
    badge: firstValue(
      product.badge,
      product.tag,
      oldPrice > price && price > 0 ? "Giảm giá" : "Mới",
    ),
    isMock,
  };
};

export const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
