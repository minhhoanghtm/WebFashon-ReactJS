import { useEffect, useMemo, useState } from "react";
import {
  addProductApi,
  deleteProductApi,
  getAllCategoryApi,
  getAllProductApi,
  initializeProductManagementApi,
  updateProductApi,
} from "../../api/productManagementApi";

const defaultFormData = {
  name: "",
  displayProductText: "",
  category_id: "",
  description: "",
  old_price: "",
  new_price: "",
  sold: "",
  rating: "",
  is_active: true,
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getCategoryName = (categories, categoryId) =>
  categories.find((item) => item._id === categoryId)?.name || "Chưa phân loại";

const toFormData = (product) => ({
  name: product.name || "",
  displayProductText: product.displayProduct?.join("\n") || "",
  category_id: product.category_id || "",
  description: product.description || "",
  old_price: product.old_price ?? "",
  new_price: product.new_price ?? "",
  sold: product.sold ?? "",
  rating: product.rating ?? "",
  is_active: product.is_active ?? true,
});

const normalizePayload = (formData) => ({
  name: formData.name.trim(),
  displayProduct: formData.displayProductText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean),
  category_id: formData.category_id,
  description: formData.description.trim(),
  old_price: Number(formData.old_price),
  new_price: Number(formData.new_price),
  sold: Number(formData.sold || 0),
  rating: Number(formData.rating || 0),
  is_active: Boolean(formData.is_active),
});

const StaffProductManagement = () => {
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

  const fetchManagementData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await initializeProductManagementApi();

      const [productResponse, categoryResponse] = await Promise.all([
        getAllProductApi(),
        getAllCategoryApi(),
      ]);

      const productData = await productResponse.json();
      const categoryData = await categoryResponse.json();

      setProducts(productData);
      setCategories(categoryData);

      if (!formData.category_id && categoryData.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: categoryData[0]._id }));
      }
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
    return products.filter((product) => {
      const matchesKeyword =
        product.name.toLowerCase().includes(keyword.toLowerCase()) ||
        product.slug.toLowerCase().includes(keyword.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && product.is_active) ||
        (filterStatus === "inactive" && !product.is_active);

      const matchesCategory =
        filterCategoryId === "all" || product.category_id === filterCategoryId;

      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [filterCategoryId, filterStatus, keyword, products]);

  const productStats = useMemo(() => {
    const activeCount = products.filter((item) => item.is_active).length;
    const inactiveCount = products.length - activeCount;
    const totalSold = products.reduce(
      (total, item) => total + Number(item.sold || 0),
      0,
    );

    return {
      total: products.length,
      active: activeCount,
      inactive: inactiveCount,
      totalSold,
    };
  }, [products]);

  const resetForm = () => {
    setEditingProductId(null);
    setIsFormOpen(false);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      ...defaultFormData,
      category_id: categories[0]?._id || "",
    });
  };

  const openCreateForm = () => {
    setEditingProductId(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
    setFormData({
      ...defaultFormData,
      category_id: categories[0]?._id || "",
    });
    window.scrollTo({ top: 420, behavior: "smooth" });
  };

  const handleInputChange = ({ target }) => {
    const { name, value, type, checked } = target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setIsFormOpen(true);
    setFormData(toFormData(product));
    setSuccessMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 420, behavior: "smooth" });
  };

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");

    if (!confirmDelete) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const response = await deleteProductApi(productId);
    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.message || "Xóa sản phẩm thất bại.");
      return;
    }

    setProducts((prev) => prev.filter((item) => item._id !== productId));

    if (editingProductId === productId) {
      resetForm();
    }

    setSuccessMessage(`Đã xóa sản phẩm "${result.name}".`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = normalizePayload(formData);

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

    if (payload.rating < 0 || payload.rating > 5) {
      setErrorMessage("Rating chỉ hợp lệ trong khoảng 0 đến 5.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = editingProductId
        ? await updateProductApi(editingProductId, payload)
        : await addProductApi(payload);
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.message || "Không thể lưu sản phẩm.");
        return;
      }

      if (editingProductId) {
        setProducts((prev) =>
          prev.map((item) => (item._id === editingProductId ? result : item)),
        );
        setSuccessMessage(`Đã cập nhật sản phẩm "${result.name}".`);
      } else {
        setProducts((prev) => [result, ...prev]);
        setSuccessMessage(`Đã thêm sản phẩm "${result.name}".`);
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:min-w-[620px]">
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
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên sản phẩm"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:min-w-72 lg:border-white"
            />
            <select
              value={filterCategoryId}
              onChange={(event) => setFilterCategoryId(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả loại quần áo</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kinh doanh</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-500 hover:to-orange-400"
            >
              Thêm sản phẩm
            </button>
          </div>
        </div>

        {isFormOpen ? (
          <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                  {editingProductId ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-orange-100"
              >
                Đóng form
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Ảnh sản phẩm
                </span>
                <textarea
                  name="displayProductText"
                  value={formData.displayProductText}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Mỗi dòng là 1 image url"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Đã bán
                </span>
                <input
                  type="number"
                  min="0"
                  name="sold"
                  value={formData.sold}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Đánh giá (Rating)
                </span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Trạng thái
                </span>
                <select
                  name="is_active"
                  value={String(formData.is_active)}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: event.target.value === "true",
                    }))
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="true">Đang kinh doanh</option>
                  <option value="false">Tạm ẩn</option>
                </select>
              </label>

              {(errorMessage || successMessage) && (
                <div className="lg:col-span-2 grid gap-3">
                  {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  ) : null}
                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {successMessage}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="lg:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {successMessage && !isFormOpen ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage && !isFormOpen ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : null}

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
                    className={`absolute left-3 top-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      product.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-900 text-white"
                    }`}
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
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product._id)}
                      className="flex-1 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
