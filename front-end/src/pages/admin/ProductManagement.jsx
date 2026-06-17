import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  X,
  AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAllProductService,
  addProductService,
  updateProductService,
  deleteProductService
} from "@/services/product.service";
import { getAllCategoriesService } from "@/services/category.service";

const defaultProductImage = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("Tất cả");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOldPrice, setFormOldPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats] = await Promise.all([
        getAllProductService(),
        getAllCategoriesService(),
      ]);
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0) {
        setFormCategoryId(cats[0]._id);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      setError("Không thể tải danh sách sản phẩm từ backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setFormName("");
    setFormCategoryId(categories[0]?._id || "");
    setFormPrice("");
    setFormOldPrice("");
    setFormStock("");
    setFormImage("");
    setFormDescription("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setCurrentProduct(product);
    setFormName(product.name || "");
    const catId = typeof product.category_id === "object" ? product.category_id?._id : product.category_id;
    setFormCategoryId(catId || (categories[0]?._id || ""));
    setFormPrice((product.new_price ?? product.price ?? 0).toString());
    setFormOldPrice((product.old_price ?? product.price ?? 0).toString());
    setFormStock((product.stock ?? 0).toString());
    setFormImage(product.displayProduct?.[0] || product.image || "");
    setFormDescription(product.description || "");
    setIsEditModalOpen(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formCategoryId || !formPrice || !formStock) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      await addProductService({
        name: formName,
        category_id: formCategoryId,
        new_price: parseFloat(formPrice),
        old_price: parseFloat(formOldPrice || formPrice),
        stock: parseInt(formStock, 10),
        displayProduct: [formImage || defaultProductImage],
        description: formDescription,
      });
      toast.success("Thêm sản phẩm thành công!");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Không thể thêm sản phẩm!");
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formCategoryId || !formPrice || !formStock) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      await updateProductService(currentProduct._id, {
        name: formName,
        category_id: formCategoryId,
        new_price: parseFloat(formPrice),
        old_price: parseFloat(formOldPrice || formPrice),
        stock: parseInt(formStock, 10),
        displayProduct: [formImage || defaultProductImage],
        description: formDescription,
      });
      toast.success("Cập nhật sản phẩm thành công!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật sản phẩm!");
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      try {
        await deleteProductService(id);
        toast.success("Đã xóa sản phẩm!");
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error("Không thể xóa sản phẩm!");
      }
    }
  };

  // Filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.slug?.toLowerCase().includes(search.toLowerCase());
    const pCatId = typeof product.category_id === "object" ? product.category_id?._id : product.category_id;
    const matchesCategory =
      selectedCategoryId === "Tất cả" || pCatId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500">Đang tải sản phẩm từ backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Không thể kết nối API</h3>
        <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-6 py-2 rounded-xl transition cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý sản phẩm</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            >
              <option value="Tất cả">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Product Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Product Catalog Section */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Danh mục sản phẩm</h2>
          <span className="text-xs text-slate-400">
            Hiển thị {filteredProducts.length} sản phẩm
          </span>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Hình ảnh</th>
                <th className="px-6 py-4">Tên sản phẩm</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4 text-center">Kho hàng</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-6 py-4">
                      <img
                        src={product.displayProduct?.[0] || product.image || defaultProductImage}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                        onError={(e) => {
                          e.target.src = defaultProductImage;
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold max-w-[200px] truncate">
                      {product.name}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {(() => {
                        const pCatId = typeof product.category_id === "object" ? product.category_id?._id : product.category_id;
                        const cat = categories.find((c) => c._id === pCatId);
                        return cat ? cat.name : "Chưa phân loại";
                      })()}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                      ${(product.new_price ?? product.price ?? 0).toFixed(2)}
                    </td>

                    {/* Stock badge with warning */}
                    <td className="px-6 py-4 text-center">
                      {product.stock <= 5 ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                          <span>{product.stock}</span>
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                          {product.stock}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Sửa sản phẩm"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product._id, product.name)
                          }
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD PRODUCT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold">Thêm sản phẩm mới</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Hình ảnh (URL)
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Danh mục
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá cũ ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá mới ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Số lượng kho
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Mô tả sản phẩm
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer text-slate-750 dark:text-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold">Chỉnh sửa sản phẩm</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Hình ảnh (URL)
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Danh mục
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá cũ ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá mới ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Số lượng kho
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Mô tả sản phẩm
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer text-slate-750 dark:text-slate-200"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
