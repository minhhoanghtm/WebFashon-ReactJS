const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

export const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getCategoryName = (product, categoryMap = {}) => {
  const category = firstValue(
    product.category,
    product.categoryName,
    product.loai,
    product.loaiSP,
    product.category_id
  );

  if (typeof category === "object" && category !== null) {
    return firstValue(category.name, category.title, category.tenLoai, "");
  }

  if (!category) return "";

  const categoryStr = String(category);
  if (categoryMap && categoryMap[categoryStr]) {
    return categoryMap[categoryStr];
  }

  if (
    typeof category === "string" &&
    !/^[a-f\d]{24}$/i.test(category.trim())
  ) {
    return category;
  }

  return "";
};

const getProductImages = (product) => {
  const list = [
    ...(Array.isArray(product.displayProduct) ? product.displayProduct : []),
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.imageUrl,
    product.image_url,
    product.thumbnail,
    product.hinhAnh,
    product.avatar,
    ...(Array.isArray(product.variants)
      ? product.variants.map((v) => v?.image_url || v?.image)
      : []),
  ]
    .filter((u) => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim());

  return [...new Set(list)];
};

export const normalizeProduct = (product = {}, index = 0, categoryMap = {}) => {
  const price = Number(
    firstValue(
      product.new_price,
      product.price,
      product.gia,
      product.giaSP,
      product.unitPrice,
      0
    )
  );
  const oldPrice = Number(
    firstValue(product.old_price, product.oldPrice, product.giaCu, 0)
  );
  const rawRating = Number(firstValue(product.rating, product.rate, 0));

  const resolvedId = String(
    firstValue(
      product.id,
      product._id,
      product.maSP,
      product.productId,
      `product-${index}`
    )
  );

  const images = getProductImages(product);

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
    price: Number.isFinite(price) ? price : 0,
    oldPrice: Number.isFinite(oldPrice) ? oldPrice : 0,
    image: images[0] || "",
    displayProduct: images,
    category: getCategoryName(product, categoryMap),
    category_id: String(product.category_id?._id || product.category_id || ""),
    description: firstValue(product.description, product.moTa, ""),
    rating:
      Number.isFinite(rawRating) && rawRating > 0
        ? Math.min(Math.max(rawRating, 0), 5)
        : 0,
  };
};

/**
 * Deduplicate categories with identical normalized names and group into
 * parent-child hierarchy (Áo, Quần, Đầm & Váy, Đồ thể thao, Phụ kiện).
 */
export const buildCategoryHierarchy = (rawCategories = []) => {
  const mergedMap = new Map();

  rawCategories.forEach((cat) => {
    const id = String(cat?._id || cat?.id || "").trim();
    const name = String(cat?.name || "").trim();
    if (!id || !name) return;

    const normKey = normalizeSearchText(name);
    if (!mergedMap.has(normKey)) {
      mergedMap.set(normKey, {
        key: normKey,
        name,
        ids: [id],
      });
    } else {
      const existing = mergedMap.get(normKey);
      if (!existing.ids.includes(id)) {
        existing.ids.push(id);
      }
    }
  });

  const deduplicated = Array.from(mergedMap.values());

  const groups = [
    { key: "group-ao", name: "Áo", ids: [], children: [] },
    { key: "group-quan", name: "Quần", ids: [], children: [] },
    { key: "group-dam-vay", name: "Đầm & Chân váy", ids: [], children: [] },
    { key: "group-the-thao", name: "Đồ thể thao", ids: [], children: [] },
    { key: "group-phu-kien", name: "Phụ kiện", ids: [], children: [] },
  ];

  const assignGroup = (item) => {
    const k = item.key;
    if (k.includes("dam") || k.includes("chan vay") || k.includes("vay")) {
      return groups[2];
    }
    if (k.includes("the thao")) {
      return groups[3];
    }
    if (k.includes("phu kien")) {
      return groups[4];
    }
    if (k.startsWith("ao") || k.includes("ao ")) {
      return groups[0];
    }
    if (k.startsWith("quan") || k.includes("quan ")) {
      return groups[1];
    }
    return null;
  };

  const ungrouped = [];

  deduplicated.forEach((item) => {
    const targetGroup = assignGroup(item);
    if (targetGroup) {
      item.ids.forEach((id) => {
        if (!targetGroup.ids.includes(id)) targetGroup.ids.push(id);
      });
      // Only add as sub-chip if its name isn't identical to the parent group name
      if (normalizeSearchText(targetGroup.name) !== item.key) {
        targetGroup.children.push(item);
      }
    } else {
      ungrouped.push({
        key: item.key,
        name: item.name,
        ids: item.ids,
        children: [],
      });
    }
  });

  return [...groups.filter((g) => g.ids.length > 0), ...ungrouped];
};
