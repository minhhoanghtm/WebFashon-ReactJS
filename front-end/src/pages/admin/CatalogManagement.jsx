import React, { useState, useEffect } from 'react';
import {
  LayoutList,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAllCategoriesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from '@/services/category.service';
import { getAllProductService } from '@/services/product.service';
import Swal from 'sweetalert2';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  AdminModal,
  AdminEmptyState,
  TableSkeleton,
} from '@/components/admin/ui';

const defaultCategoryPlaceholder =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500';

const CatalogManagement = () => {
  useDocumentTitle('Quản lý danh mục — 404Studio Admin');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formImage, setFormImage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, prods] = await Promise.all([
        getAllCategoriesService(),
        getAllProductService(),
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError('Không thể kết nối đến máy chủ danh mục. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormImage('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setCurrentCategory(cat);
    setFormName(cat.name || '');
    setFormImage(cat.image || '');
    setIsEditModalOpen(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Vui lòng điền tên danh mục!');
      return;
    }

    setSubmitting(true);
    try {
      await createCategoryService({
        name: formName.trim(),
        image: formImage.trim() || defaultCategoryPlaceholder,
      });
      toast.success('Thêm danh mục mới thành công!');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Không thể thêm danh mục!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Vui lòng điền tên danh mục!');
      return;
    }

    setSubmitting(true);
    try {
      await updateCategoryService(currentCategory._id, {
        name: formName.trim(),
        image: formImage.trim() || defaultCategoryPlaceholder,
      });
      toast.success('Cập nhật danh mục thành công!');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật danh mục!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    const result = await Swal.fire({
      title: 'Xóa danh mục này?',
      text: `Danh mục "${name}" sẽ bị xóa. Các sản phẩm thuộc danh mục sẽ cần được gán lại.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await deleteCategoryService(id);
        toast.success(`Đã xóa danh mục "${name}"!`);
        fetchData();
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || 'Không thể xóa danh mục lúc này!';
        toast.warning(errorMsg);
      }
    }
  };

  const getProductCount = (categoryId) => {
    return products.filter((p) => {
      const pCatId =
        typeof p.category_id === 'object' ? p.category_id?._id : p.category_id;
      return pCatId === categoryId;
    }).length;
  };

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý danh mục"
        description="Tổ chức các phân loại sản phẩm thời trang trong hệ thống 404Studio"
        breadcrumbs={[{ label: 'Danh mục' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              aria-label="Làm mới danh sách"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-4 h-10 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm danh mục</span>
            </button>
          </div>
        }
      />

      {/* Main Content Card */}
      <AdminCard noPadding>
        {/* Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{filteredCategories.length}</strong> danh mục
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
            <button
              onClick={fetchData}
              className="text-xs font-bold text-[#05251C] dark:text-[#F5DD20] hover:underline"
            >
              Tải lại trang
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <AdminEmptyState
            icon={FolderOpen}
            title={search ? 'Không tìm thấy danh mục' : 'Chưa có danh mục nào'}
            description={
              search
                ? `Không có kết quả nào trùng với từ khóa "${search}".`
                : 'Bắt đầu bằng việc tạo danh mục sản phẩm đầu tiên cho cửa hàng.'
            }
            action={
              !search && (
                <button
                  onClick={handleOpenAddModal}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo danh mục ngay
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 w-20">Ảnh</th>
                  <th className="px-6 py-3.5">Tên danh mục</th>
                  <th className="px-6 py-3.5 text-center">Số sản phẩm</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredCategories.map((cat) => (
                  <tr
                    key={cat._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <td className="px-6 py-3.5">
                      <img
                        src={cat.image || defaultCategoryPlaceholder}
                        alt={cat.name}
                        className="h-11 w-11 object-cover rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                        onError={(e) => {
                          e.target.src = defaultCategoryPlaceholder;
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {cat.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {cat._id}
                      </div>
                    </td>

                    {/* Product Count */}
                    <td className="px-6 py-3.5 text-center">
                      <AdminBadge variant="neutral" size="sm">
                        {getProductCount(cat._id)} sản phẩm
                      </AdminBadge>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          aria-label={`Chỉnh sửa danh mục ${cat.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat._id, cat.name)}
                          aria-label={`Xóa danh mục ${cat.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Add Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm danh mục mới"
        description="Tạo phân loại sản phẩm mới cho danh mục thời trang của 404Studio"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="add-category-form"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang tạo...' : 'Tạo danh mục'}
            </button>
          </>
        }
      >
        <form id="add-category-form" onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Áo khoác mùa đông, Quần tây..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Đường dẫn hình ảnh (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Để trống sẽ sử dụng hình ảnh mặc định của hệ thống.
            </p>
          </div>

          {formImage && (
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Xem trước ảnh:</span>
              <img
                src={formImage}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
                onError={(e) => {
                  e.target.src = defaultCategoryPlaceholder;
                }}
              />
            </div>
          )}
        </form>
      </AdminModal>

      {/* Edit Modal */}
      <AdminModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa danh mục"
        description="Cập nhật thông tin phân loại sản phẩm"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="edit-category-form"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu cập nhật'}
            </button>
          </>
        }
      >
        <form id="edit-category-form" onSubmit={handleEditCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Đường dẫn hình ảnh (URL)
            </label>
            <input
              type="url"
              value={formImage}
              onChange={(e) => setFormImage(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
            />
          </div>

          {formImage && (
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">Xem trước ảnh:</span>
              <img
                src={formImage}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
                onError={(e) => {
                  e.target.src = defaultCategoryPlaceholder;
                }}
              />
            </div>
          )}
        </form>
      </AdminModal>
    </div>
  );
};

export default CatalogManagement;
