import { useEffect, useMemo, useState } from "react";
import {
  getAllProductService,
  addProductService,
  updateProductService,
  deleteProductService,
} from "@/services/product.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { getAllCategoriesService } from "@/services/category.service";
import {
  getProductVariantByProductIdService,
} from "@/services/productItem.service";
import { uploadImageService } from "@/services/upload.service";

const defaultVariantSize = {
  size: "M",
  stock: 0,
};

const defaultVariantGroup = {
  color: "",
  image_url: "",
  sizes: [
    { size: "S", stock: 0 },
    { size: "M", stock: 0 },
    { size: "L", stock: 0 },
  ],
};

const defaultFormData = {
  name: "",
  displayProduct: [],
  category_id: "",
  description: "",
  old_price: "",
  new_price: "",
  sold: "",
  stock: 0,
  is_active: true,
  variants: [],
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getCategoryName = (categories, categoryId) =>
  categories.find((item) => item._id === categoryId)?.name || "Chưa phân loại";

const toFormData = (product) => ({
  name: product.name || "",
  displayProduct: [...(product.displayProduct || [])],
  category_id: product.category_id || "",
  description: product.description || "",
  old_price: product.old_price ?? "",
  new_price: product.new_price ?? "",
  sold: product.sold ?? "",
  stock: product.stock ?? 0,
  is_active: product.is_active ?? true,

  variants: Array.isArray(product.variants)
    ? groupVariantsByColor(product.variants)
    : [],
});

function groupVariantsByColor(variants) {
  const safeVariants = Array.isArray(variants) ? variants : [];

  return safeVariants.reduce((groups, variant) => {
    const color = variant.color || "";
    const existingGroup = groups.find((group) => group.color === color);

    if (existingGroup) {
      existingGroup.sizes.push({
        size: variant.size || "M",
        stock: variant.stock ?? 0,
      });
      return groups;
    }

    groups.push({
      color,
      image_url: variant.image_url || "",
      sizes: [
        {
          size: variant.size || "M",
          stock: variant.stock ?? 0,
        },
      ],
    });
    return groups;
  }, []);
}

const normalizePayload = (formData, hasVariants) => ({
  name: formData.name.trim(),
  displayProduct: formData.displayProduct.filter(
    (image) => typeof image === "string" && !image.startsWith("data:"),
  ),
  category_id: formData.category_id,
  description: formData.description.trim(),
  old_price: Number(formData.old_price),
  new_price: Number(formData.new_price),
  sold: Number(formData.sold || 0),
  stock: hasVariants
    ? formData.variants.reduce(
        (sum, group) =>
          sum +
          (Array.isArray(group.sizes)
            ? group.sizes.reduce(
                (sizeSum, sizeItem) =>
                  sizeSum + Number(sizeItem.stock || 0),
                0,
              )
            : 0),
        0,
      )
    : Number(formData.stock || 0),
  is_active: Boolean(formData.is_active),
  variants: formData.variants.flatMap((group) =>
    (group.sizes || []).map((sizeItem) => ({
      color: group.color.trim(),
      size: sizeItem.size,
      stock: Number(sizeItem.stock || 0),
      image_url:
        typeof group.image_url === "string" &&
        !group.image_url.startsWith("data:")
          ? group.image_url
          : "",
    })),
  ),
});

const StaffProductManagement = () => {
  useDocumentTitle("Quản lý sản phẩm");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(defaultFormData);
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [editingProductId, setEditingProductId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const fetchManagementData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [productData, categoryData] = await Promise.all([
        getAllProductService(),
        getAllCategoriesService(),
      ]);

      const productsRaw = Array.isArray(productData)
        ? productData
        : (productData?.data ?? []);

      // 🔥 load variants cho từng product
      const productsWithVariants = await Promise.all(
        productsRaw.map(async (p) => {
          try {
            const variantsRes = await getProductVariantByProductIdService(
              p._id,
            );
            console.log(`Variants for product ${p._id}:`, variantsRes);
            const variants = Array.isArray(variantsRes)
              ? variantsRes
              : variantsRes?.data ?? [];
            return {
              ...p,
              variants,
            };
          } catch {
            return { ...p, variants: [] };
          }
        }),
      );

      setProducts(productsWithVariants);
      setCategories(
        Array.isArray(categoryData) ? categoryData : (categoryData?.data ?? []),
      );
    } catch {
      setErrorMessage("Không thể tải dữ liệu quản lý sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagementData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products?.filter((product) => {
      const productName = String(product?.name || "");
      const productSlug = String(product?.slug || "");
      const searchKeyword = keyword.toLowerCase();

      const matchesKeyword =
        productName.toLowerCase().includes(searchKeyword) ||
        productSlug.toLowerCase().includes(searchKeyword);
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && product.is_active) ||
        (filterStatus === "inactive" && !product.is_active);
      const matchesCategory =
        filterCategoryId === "all" ||
        String(product?.category_id || "") === filterCategoryId;
      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [filterCategoryId, filterStatus, keyword, products]);

  const productStats = useMemo(() => {
    const activeCount = products.filter((item) => item.is_active).length;
    return {
      total: products.length,
      active: activeCount,
      inactive: products.length - activeCount,
      totalSold: products.reduce((t, item) => t + Number(item.sold || 0), 0),
    };
  }, [products]);

  const resetForm = () => {
    setEditingProductId(null);
    setIsFormOpen(false);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({ ...defaultFormData, category_id: categories[0]?._id || "" });
  };

  const openCreateForm = () => {
    setEditingProductId(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
    setFormData({ ...defaultFormData, category_id: categories[0]?._id || "" });
    window.scrollTo({ top: 420, behavior: "smooth" });
  };

  const handleInputChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);

    try {
      const urls = await Promise.all(
        files.map((file) => uploadImageService(file)),
      );

      setFormData((prev) => ({
        ...prev,
        displayProduct: [...prev.displayProduct, ...urls],
      }));
    } catch {
      setErrorMessage("Upload ảnh thất bại");
    }
  };

  const handleRemoveImage = (i) =>
    setFormData((prev) => ({
      ...prev,
      displayProduct: prev.displayProduct.filter((_, idx) => idx !== i),
    }));

  const handleAddVariant = () =>
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { ...defaultVariantGroup }],
    }));

  const handleChangeVariant = (index, updated) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) => (i === index ? updated : group)),
    }));

  const handleRemoveVariant = (index) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));

  const handleAddSizeToGroup = (groupIndex) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              sizes: [...(group.sizes || []), { ...defaultVariantSize }],
            }
          : group,
      ),
    }));

  const handleChangeSizeInGroup = (groupIndex, sizeIndex, updated) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              sizes: (group.sizes || []).map((sizeItem, j) =>
                j === sizeIndex ? updated : sizeItem,
              ),
            }
          : group,
      ),
    }));

  const handleRemoveSizeFromGroup = (groupIndex, sizeIndex) =>
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              sizes: (group.sizes || []).filter((_, j) => j !== sizeIndex),
            }
          : group,
      ),
    }));

  const handleGroupImageChange = async (groupIndex, file) => {
    if (!file || !file.type.startsWith("image/")) return;

    try {
      const url = await uploadImageService(file);
      setFormData((prev) => ({
        ...prev,
        variants: prev.variants.map((group, i) =>
          i === groupIndex ? { ...group, image_url: url } : group,
        ),
      }));
    } catch {
      setErrorMessage("Upload ảnh biến thể thất bại");
    }
  };

  const handleEditProduct = (product) => {
    console.log("PRODUCT:", product);
    console.log("VARIANTS:", product.variants);
    setEditingProductId(product._id);
    setSuccessMessage("");
    setErrorMessage("");
    setHasVariants(product.variants?.length > 0);
    setFormData(toFormData(product));
    setIsFormOpen(true);

    setTimeout(() => {
      window.scrollTo({ top: 420, behavior: "smooth" });
    }, 0);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const result = await deleteProductService(productId);
      setProducts((prev) => prev.filter((item) => item._id !== productId));
      if (editingProductId === productId) resetForm();
      setSuccessMessage(`Đã xóa sản phẩm "${result.name}".`);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Xóa sản phẩm thất bại.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = normalizePayload(formData, hasVariants);
    console.log("payload.stock:", payload.stock); // kiểm tra ở đây
    console.log("formData.stock:", formData.stock);

    const hasBase64Images =
      formData.displayProduct.some(
        (image) => typeof image === "string" && image.startsWith("data:"),
      ) ||
      formData.variants.some(
        (group) =>
          typeof group.image_url === "string" &&
          group.image_url.startsWith("data:"),
      );

    if (hasBase64Images) {
      setErrorMessage(
        "Ảnh đang ở dạng dữ liệu tạm (base64). Vui lòng upload lại ảnh để tránh vượt giới hạn dung lượng.",
      );
      setIsSubmitting(false);
      return;
    }
    if (
      !payload.name ||
      !payload.category_id ||
      !payload.displayProduct.length ||
      payload.old_price <= 0 ||
      payload.new_price <= 0
    ) {
      setErrorMessage(
        "Vui lòng nhập đầy đủ tên, danh mục, ảnh và giá sản phẩm.",
      );
      setIsSubmitting(false);
      return;
    }

    if (hasVariants) {
      const invalidVariant = formData.variants.find(
        (group) => !group.color || !group.image_url || !group.sizes?.length,
      );

      if (invalidVariant) {
        setErrorMessage("Mỗi nhóm màu cần có ảnh và ít nhất một size.");
        setIsSubmitting(false);
        return;
      }

      const variantKeys = payload.variants.map((v) => `${v.color}-${v.size}`);

      if (new Set(variantKeys).size !== variantKeys.length) {
        setErrorMessage("Có variant bị trùng màu sắc + size.");
        setIsSubmitting(false);
        return;
      }

      const duplicatedSizesInSameColor = formData.variants.some((group) => {
        const sizes = (group.sizes || []).map((sizeItem) => sizeItem.size);
        return new Set(sizes).size !== sizes.length;
      });

      if (duplicatedSizesInSameColor) {
        setErrorMessage("Một màu không được chọn trùng size.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const result = editingProductId
        ? await updateProductService(editingProductId, payload)
        : await addProductService(payload);

      await fetchManagementData();

      if (editingProductId) {
        setSuccessMessage(`Đã cập nhật sản phẩm "${result?.name || ""}".`);
      } else {
        setSuccessMessage(`Đã thêm sản phẩm "${result?.name || ""}".`);
      }
      resetForm();
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || "Không thể lưu sản phẩm.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!hasVariants) {
      setFormData((prev) => ({
        ...prev,
        variants: [],
      }));
    }
  }, [hasVariants]);

  console.log("formData trước submit:", formData);
  console.log(
    "payload sau normalize:",
    normalizePayload(formData, hasVariants),
  );
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header stats */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              Staff Product Management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Quản lý sản phẩm cho nhân viên
            </h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-155">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Tổng sản phẩm
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {productStats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                Đang bán
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {productStats.active}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-600">
                Tạm ẩn
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">
                {productStats.inactive}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-600">
                Tổng lượt bán
              </p>
              <p className="mt-1 text-2xl font-semibold text-orange-700">
                {productStats.totalSold}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product list */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
              Product List
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Danh sách sản phẩm
            </h2>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:rounded-full lg:bg-slate-50 lg:p-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên sản phẩm"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:min-w-72 lg:border-white"
            />
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kinh doanh</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-500 hover:to-orange-400"
            >
              Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Form */}
        {isFormOpen && (
          <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50/70 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                {editingProductId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-white text-xl text-slate-700 hover:bg-orange-100"
              >
                ×
              </button>
            </div>

            <form
              className="mt-5 grid gap-4 lg:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Tên sản phẩm
                </span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên sản phẩm"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Danh mục
                </span>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Ảnh sản phẩm
                </span>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center hover:border-orange-400 hover:bg-orange-50/40">
                  <span className="text-sm font-semibold text-slate-700">
                    Chọn ảnh mẫu từ máy
                  </span>
                  <span className="mt-1 text-sm text-slate-500">
                    Cho phép chọn nhiều ảnh
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {formData.displayProduct.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {formData.displayProduct.map((img, i) => (
                      <div
                        key={`${i}-${img.slice(0, 30)}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        <img
                          src={img}
                          alt={`Ảnh ${i + 1}`}
                          className="h-40 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="w-full border-t border-slate-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Mô tả
                </span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Nhập mô tả ngắn"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Giá gốc
                </span>
                <input
                  type="number"
                  min="0"
                  name="old_price"
                  value={formData.old_price}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Giá mới
                </span>
                <input
                  type="number"
                  min="0"
                  name="new_price"
                  value={formData.new_price}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>

              {/* Số lượng sản phẩm:  */}
              {!hasVariants && ( // ✅ chỉ hiện khi không có variant
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Số lượng
                  </span>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock || 0}
                    onChange={handleInputChange}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  />
                </label>
              )}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Trạng thái
                </span>
                <select
                  name="is_active"
                  value={String(formData.is_active)}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.value === "true",
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                >
                  <option value="true">Đang kinh doanh</option>
                  <option value="false">Tạm ẩn</option>
                </select>
              </label>

              {/* Variants */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => setHasVariants(e.target.checked)}
                />
                <span className="text-sm font-medium">
                  Sản phẩm có biến thể (màu / size)
                </span>
              </label>
              {hasVariants && (
                <div className="lg:col-span-2 grid gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Biến thể sản phẩm
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mỗi màu có thể chứa nhiều size, mỗi size có số lượng riêng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100 transition"
                    >
                      + Thêm màu
                    </button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                      Chưa có biến thể nào. Nhấn "+ Thêm màu" để bắt đầu.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {formData.variants.map((group, groupIndex) => (
                        <div
                          key={`${group.color || "color"}-${groupIndex}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="grid gap-3 sm:grid-cols-2 flex-1">
                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Màu
                                </span>
                                <input
                                  value={group.color}
                                  onChange={(e) =>
                                    handleChangeVariant(groupIndex, {
                                      ...group,
                                      color: e.target.value,
                                    })
                                  }
                                  placeholder="Ví dụ: Đen"
                                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                                />
                              </label>

                              <label className="grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Ảnh nhóm màu
                                </span>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleGroupImageChange(
                                        groupIndex,
                                        e.target.files?.[0],
                                      )
                                    }
                                    className="text-sm"
                                  />
                                  {group.image_url && (
                                    <img
                                      src={group.image_url}
                                      alt={group.color || "variant"}
                                      className="h-12 w-12 rounded-xl object-cover border"
                                    />
                                  )}
                                </div>
                              </label>
                            </div>

                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              <button
                                type="button"
                                onClick={() => handleAddSizeToGroup(groupIndex)}
                                className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition"
                              >
                                + Thêm size
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(groupIndex)}
                                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                              >
                                Xóa màu
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-white p-4 border border-slate-200">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  Danh sách size
                                </p>
                                <p className="text-xs text-slate-500">
                                  Mỗi size nhập số lượng riêng.
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                              {(group.sizes || []).map((sizeItem, sizeIndex) => (
                                <div
                                  key={`${groupIndex}-${sizeIndex}`}
                                  className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] rounded-2xl border border-slate-200 bg-slate-50 p-3"
                                >
                                  <label className="grid gap-1">
                                    <span className="text-xs text-slate-500">
                                      Size
                                    </span>
                                    <input
                                      value={sizeItem.size}
                                      onChange={(e) =>
                                        handleChangeSizeInGroup(
                                          groupIndex,
                                          sizeIndex,
                                          {
                                            ...sizeItem,
                                            size: e.target.value,
                                          },
                                        )
                                      }
                                      placeholder="M / L / XL"
                                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                                    />
                                  </label>

                                  <label className="grid gap-1">
                                    <span className="text-xs text-slate-500">
                                      Số lượng
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={sizeItem.stock}
                                      onChange={(e) =>
                                        handleChangeSizeInGroup(
                                          groupIndex,
                                          sizeIndex,
                                          {
                                            ...sizeItem,
                                            stock: e.target.value,
                                          },
                                        )
                                      }
                                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400"
                                    />
                                  </label>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveSizeFromGroup(
                                          groupIndex,
                                          sizeIndex,
                                        )
                                      }
                                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                                    >
                                      Xóa size
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Messages */}
              {(errorMessage || successMessage) && (
                <div className="lg:col-span-2 grid gap-3">
                  {errorMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  )}
                  {successMessage && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="lg:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-400 transition"
                >
                  {isSubmitting
                    ? "Đang xử lý..."
                    : editingProductId
                      ? "Lưu cập nhật"
                      : "Thêm sản phẩm"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {successMessage && !isFormOpen && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
        {errorMessage && !isFormOpen && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* Product grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-slate-100 px-4 py-10 text-center text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-slate-100 px-4 py-10 text-center text-slate-500">
              Không có sản phẩm nào phù hợp bộ lọc hiện tại.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <article
                key={product._id}
                className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={product.displayProduct?.[0]}
                    alt={product.name}
                    className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    className={`absolute left-3 top-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white"}`}
                  >
                    {product.is_active ? "Đang kinh doanh" : "Tạm ẩn"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        {getCategoryName(categories, product.category_id)}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        {product.name}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                      <p className="text-xs text-slate-500">Sold</p>
                      <p className="font-semibold text-slate-900">
                        {product.sold}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {product.description}
                  </p>

                  {product.variants?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {product.variants.map((v, i) => (
                        <span
                          key={`${v.color}-${v.size}-${i}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                        >
                          <span className="font-medium">{v.color}</span>
                          <span className="text-slate-400">/</span>
                          <span>{v.size}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-emerald-600 font-medium">
                            {v.stock}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-orange-500">
                        {formatCurrency(product.new_price)}
                      </p>
                      <p className="text-sm text-slate-400 line-through">
                        {formatCurrency(product.old_price)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>Rating {product.rating}</p>
                      <p className="truncate">{product.slug}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product._id)}
                      className="flex-1 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default StaffProductManagement;
