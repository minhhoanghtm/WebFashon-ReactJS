import React, { useState } from "react";
import { LayoutList, Search, Plus, Edit, Trash2, X, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

// Initial mock categories data
const initialCategories = [
  { id: 1, name: "Áo khoác", count: 45, status: "visible" },
  { id: 2, name: "Đồ cơ bản", count: 3, status: "visible" },
  { id: 3, name: "Quần", count: 87, status: "visible" },
  { id: 4, name: "Váy đầm", count: 2, status: "visible" },
  { id: 5, name: "Giày dép", count: 125, status: "visible" },
];

const CatalogManagement = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("visible");

  const handleOpenAddModal = () => {
    setFormName("");
    setFormStatus("visible");
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setCurrentCategory(cat);
    setFormName(cat.name);
    setFormStatus(cat.status);
    setIsEditModalOpen(true);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Vui lòng điền tên danh mục!");
      return;
    }

    const newCat = {
      id: Date.now(),
      name: formName,
      count: 0,
      status: formStatus,
    };

    setCategories([newCat, ...categories]);
    setIsAddModalOpen(false);
    toast.success("Thêm danh mục thành công!");
  };

  const handleEditCategory = (e) => {
    e.preventDefault();
    if (!formName) {
      toast.error("Vui lòng điền tên danh mục!");
      return;
    }

    setCategories(
      categories.map((c) =>
        c.id === currentCategory.id
          ? { ...c, name: formName, status: formStatus }
          : c
      )
    );
    setIsEditModalOpen(false);
    toast.success("Cập nhật danh mục thành công!");
  };

  const handleDeleteCategory = (id, name) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
      setCategories(categories.filter((c) => c.id !== id));
      toast.success("Đã xóa danh mục!");
    }
  };

  const toggleStatus = (id) => {
    setCategories(
      categories.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "visible" ? "hidden" : "visible" }
          : c
      )
    );
    toast.info("Đã thay đổi trạng thái hiển thị!");
  };

  // Filter categories
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Quản lý danh mục</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* Categories Catalog */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Danh sách danh mục</h2>
          <span className="text-xs text-slate-400">
            Hiển thị {filteredCategories.length} danh mục
          </span>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/80 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên danh mục</th>
                <th className="px-6 py-4 text-center">Số lượng sản phẩm</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-2">
                      <LayoutList className="h-4 w-4 text-blue-500" />
                      <span>{cat.name}</span>
                    </td>

                    {/* Product count */}
                    <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300">
                      {cat.count} sản phẩm
                    </td>

                    {/* Status Display Toggle */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:opacity-80 transition ${
                          cat.status === "visible"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                            : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {cat.status === "visible" ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Hiển thị</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Đang ẩn</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-slate-700 transition"
                          title="Sửa danh mục"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700 transition"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD CATEGORY MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold">Thêm danh mục mới</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Trạng thái mặc định
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                >
                  <option value="visible">Hiển thị</option>
                  <option value="hidden">Đang ẩn</option>
                </select>
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

      {/* ================= EDIT CATEGORY MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold">Chỉnh sửa danh mục</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditCategory} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-400">
                  Trạng thái
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                >
                  <option value="visible">Hiển thị</option>
                  <option value="hidden">Đang ẩn</option>
                </select>
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

export default CatalogManagement;
