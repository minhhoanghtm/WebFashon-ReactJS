import React, { useState } from "react";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";

const images = {
  jacket: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format&fit=crop&q=60",
  tshirt: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop&q=60",
  jeans: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=100&auto=format&fit=crop&q=60",
  dress: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=100&auto=format&fit=crop&q=60",
  sneakers: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=100&auto=format&fit=crop&q=60",
  boots: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=100&auto=format&fit=crop&q=60",
  placeholder: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&auto=format&fit=crop&q=60"
};

const initialProducts = [
  {
    id: 1,
    name: "Áo khoác da cao cấp",
    sku: "SKU-001",
    category: "Áo khoác",
    price: 299.99,
    stock: 45,
    image: images.jacket,
  },
  {
    id: 2,
    name: "Áo thun trắng cổ điển",
    sku: "SKU-002",
    category: "Đồ cơ bản",
    price: 29.99,
    stock: 3,
    image: images.tshirt,
  },
  {
    id: 3,
    name: "Quần jeans xanh Denim",
    sku: "SKU-003",
    category: "Quần",
    price: 79.99,
    stock: 87,
    image: images.jeans,
  },
  {
    id: 4,
    name: "Đầm hoa mùa hè",
    sku: "SKU-004",
    category: "Váy đầm",
    price: 89.99,
    stock: 2,
    image: images.dress,
  },
  {
    id: 5,
    name: "Giày thể thao Canvas",
    sku: "SKU-005",
    category: "Giày dép",
    price: 69.99,
    stock: 124,
    image: images.sneakers,
  },
  {
    id: 6,
    name: "Bốt da màu đen",
    sku: "SKU-006",
    category: "Giày dép",
    price: 149.99,
    stock: 1,
    image: images.boots,
  },
];

const categories = ["Tất cả", "Áo khoác", "Đồ cơ bản", "Quần", "Váy đầm", "Giày dép"];

const ProductManagement = () => {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("Áo khoác");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  const handleOpenAddModal = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("Áo khoác");
    setFormPrice("");
    setFormStock("");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setCurrentProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setIsEditModalOpen(true);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!formName || !formSku || !formPrice || !formStock) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: formName,
      sku: formSku,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock, 10),
      image: images.placeholder,
    };

    setProducts([newProduct, ...products]);
    setIsAddModalOpen(false);
    toast.success("Thêm sản phẩm thành công!");
  };

  const handleEditProduct = (e) => {
    e.preventDefault();
    if (!formName || !formSku || !formPrice || !formStock) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setProducts(
      products.map((p) =>
        p.id === currentProduct.id
          ? {
              ...p,
              name: formName,
              sku: formSku,
              category: formCategory,
              price: parseFloat(formPrice),
              stock: parseInt(formStock, 10),
            }
          : p
      )
    );
    setIsEditModalOpen(false);
    toast.success("Cập nhật sản phẩm thành công!");
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) {
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Đã xóa sản phẩm!");
    }
  };

  // Filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tất cả" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý sản phẩm</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Toolbar (Search + Category Filter + Add Product Button) */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm hoặc SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Tất cả" ? "Tất cả danh mục" : cat}
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
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá cả</th>
                <th className="px-6 py-4 text-center">Kho hàng</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-6 py-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover shadow-sm border border-slate-200/60 dark:border-slate-700/60"
                        onError={(e) => {
                          e.target.src = images.placeholder;
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold max-w-[200px] truncate">
                      {product.name}
                    </td>

                    {/* SKU */}
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">
                      {product.sku}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {product.category}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                      ${product.price.toFixed(2)}
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
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                          title="Sửa sản phẩm"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id, product.name)
                          }
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700 transition"
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
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    {categories
                      .filter((c) => c !== "Tất cả")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá cả ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition"
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
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                  >
                    {categories
                      .filter((c) => c !== "Tất cả")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">
                    Giá cả ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition"
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
