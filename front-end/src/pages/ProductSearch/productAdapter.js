import fallbackProductImage from "../Home/assets/product-linen-shirt.jpg";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const toArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
};

const getCategory = (product, categoryMap) => {
  const categoryValue = firstValue(
    product.category,
    product.categoryName,
    product.loai,
    product.loaiSP,
    product.loaiMon,
    product.danhMuc,
    product.tenDanhMuc,
    product.category_id,
  );

  if (typeof categoryValue === "object") {
    return firstValue(
      categoryValue.name,
      categoryValue.title,
      categoryValue.tenDanhMuc,
      "",
    );
  }

  if (!categoryValue) return "";

  return categoryMap[String(categoryValue)] || (
    /^[a-f\d]{24}$/i.test(String(categoryValue)) ? "" : String(categoryValue)
  );
};

const getImage = (product) => {
  const displayImage = Array.isArray(product.displayProduct)
    ? product.displayProduct.find(Boolean)
    : product.displayProduct;
  const variantImage = Array.isArray(product.variants)
    ? product.variants.find((variant) => variant?.image_url)?.image_url
    : "";

  return firstValue(
    displayImage,
    variantImage,
    product.image,
    product.imageUrl,
    product.image_url,
    product.thumbnail,
    product.hinhAnh,
    product.avatar,
    fallbackProductImage,
  );
};

const getVariantValues = (product, key) => {
  const directValue =
    key === "size"
      ? firstValue(product.size, product.sizes, product.kichThuoc)
      : firstValue(product.color, product.colors, product.mauSac);
  const variantValues = Array.isArray(product.variants)
    ? product.variants.map((variant) => variant?.[key]).filter(Boolean)
    : [];

  return [...new Set([...toArray(directValue), ...variantValues.map(String)])];
};

const getStatus = (product) => {
  const status = firstValue(
    product.status,
    product.trangThai,
    product.active,
    product.isActive,
    product.is_active,
  );

  if (status === true) return "Đang hoạt động";
  if (status === false) return "Tạm ẩn";
  return status ? String(status) : "";
};

export const normalizeProduct = (
  product = {},
  index = 0,
  categoryMap = {},
  isMock = false,
) => {
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
  const rating = Number(firstValue(product.rating, product.rate, 4.6));
  const createdAtTime = new Date(
    firstValue(product.createdAt, product.created_at, product.ngayTao, 0),
  ).getTime();

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
    sku: firstValue(product.sku, product.code, product.maSP, product.maSanPham, ""),
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
    image: getImage(product),
    category: getCategory(product, categoryMap),
    description: firstValue(
      product.description,
      product.moTa,
      product.ghiChu,
      "",
    ),
    rating: Number.isFinite(rating) ? Math.min(Math.max(rating, 0), 5) : 4.6,
    badge: firstValue(
      product.badge,
      product.tag,
      oldPrice > price && price > 0 ? `-${Math.round(((oldPrice - price) / oldPrice) * 100)}%` : "",
    ),
    brand: String(firstValue(product.brand, product.thuongHieu, "")),
    status: getStatus(product),
    sizes: getVariantValues(product, "size"),
    colors: getVariantValues(product, "color"),
    sold: Number(firstValue(product.sold, product.daBan, 0)) || 0,
    createdAtTime: Number.isFinite(createdAtTime) ? createdAtTime : 0,
    sourceIndex: index,
    isMock,
  };
};

export const COLOR_MAP = {
  "đen": "#18181B",
  "black": "#18181B",
  "trắng": "#FFFFFF",
  "white": "#FFFFFF",
  "xám": "#9CA3AF",
  "grey": "#9CA3AF",
  "gray": "#9CA3AF",
  "xanh dương": "#2563EB",
  "xanh navy": "#1E3A8A",
  "navy": "#1E3A8A",
  "blue": "#2563EB",
  "xanh lá": "#16A34A",
  "green": "#16A34A",
  "đỏ": "#DC2626",
  "red": "#DC2626",
  "vàng": "#EAB308",
  "yellow": "#EAB308",
  "hồng": "#EC4899",
  "pink": "#EC4899",
  "be": "#E5D9C5",
  "kem": "#F5EBE1",
  "beige": "#E5D9C5",
  "nâu": "#78350F",
  "brown": "#78350F",
  "tím": "#9333EA",
  "purple": "#9333EA",
  "cam": "#EA580C",
  "orange": "#EA580C",
  "bạc": "#E2E8F0",
  "silver": "#E2E8F0",
};

export const getColorHex = (colorName = "") => {
  const normalized = String(colorName).trim().toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key)) return hex;
  }
  return "#D1D5DB";
};

const SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "4XL",
  "28", "29", "30", "31", "32", "33", "34", "35", "36",
  "FREESIZE", "ONE SIZE", "OVERSIZE"
];

const sortSizes = (sizes = []) => {
  return [...sizes].sort((a, b) => {
    const normA = String(a).toUpperCase().trim();
    const normB = String(b).toUpperCase().trim();
    const indexA = SIZE_ORDER.indexOf(normA);
    const indexB = SIZE_ORDER.indexOf(normB);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return normA.localeCompare(normB, "vi", { numeric: true });
  });
};

const uniqueValues = (values) => {
  const map = new Map();
  values.filter(Boolean).forEach((val) => {
    const trimmed = String(val).trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!map.has(key)) {
      map.set(key, trimmed);
    }
  });
  return Array.from(map.values()).sort((first, second) =>
    first.localeCompare(second, "vi"),
  );
};

export const buildFilterOptions = (products) => ({
  categories: uniqueValues(products.map((product) => product.category)),
  brands: uniqueValues(products.map((product) => product.brand)),
  statuses: uniqueValues(products.map((product) => product.status)),
  sizes: sortSizes(uniqueValues(products.flatMap((product) => product.sizes))),
  colors: uniqueValues(products.flatMap((product) => product.colors)),
});

export const calculatePriceBounds = (products) => {
  const prices = products
    .map((product) => product.price)
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (!prices.length) return { min: 0, max: 0, step: 1000 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const difference = Math.max(max - min, 1);
  const step = Math.max(1000, Math.round(difference / 100 / 1000) * 1000);

  return { min, max, step };
};

export const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
