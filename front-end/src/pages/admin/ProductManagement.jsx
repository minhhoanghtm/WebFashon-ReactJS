import React, { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  PackageOpen,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Info,
  DollarSign,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getAllProductService,
  addProductService,
  updateProductService,
  deleteProductService,
} from '@/services/product.service';
import { getAllCategoriesService } from '@/services/category.service';
import { getProductVariantByProductIdService } from '@/services/productItem.service';
import Swal from 'sweetalert2';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  AdminPageHeader,
  AdminCard,
  AdminBadge,
  AdminModal,
  AdminPagination,
  AdminEmptyState,
  TableSkeleton,
} from '@/components/admin/ui';

const defaultProductImage =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500';

const ProductManagement = () => {
  useDocumentTitle('Quản lý sản phẩm — 404Studio Admin');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'media' | 'variants' | 'description'
  const [currentProduct, setCurrentProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formOldPrice, setFormOldPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImages, setFormImages] = useState(['']);
  const [formDescription, setFormDescription] = useState('');
  const [formWeight, setFormWeight] = useState('0.5');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // Variant States
  const [formVariants, setFormVariants] = useState([]);
  const [varColor, setVarColor] = useState('');
  const [varSize, setVarSize] = useState('');
  const [varStock, setVarStock] = useState('');
  const [varImage, setVarImage] = useState('');
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats] = await Promise.all([
        getAllProductService(),
        getAllCategoriesService(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      if (cats?.length > 0 && !formCategoryId) {
        setFormCategoryId(cats[0]._id);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Không thể tải danh sách sản phẩm từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formVariants.length > 0) {
      const totalStock = formVariants.reduce(
        (sum, v) => sum + (v.stock || 0),
        0
      );
      setFormStock(totalStock.toString());
    }
  }, [formVariants]);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormCategoryId(categories[0]?._id || '');
    setFormPrice('');
    setFormOldPrice('');
    setFormStock('');
    setFormImages(['']);
    setFormDescription('');
    setFormVariants([]);
    setVarColor('');
    setVarSize('');
    setVarStock('');
    setVarImage('');
    setEditingVariantIndex(null);
    setFormWeight('0.5');
    setFormIsFeatured(false);
    setModalTab('basic');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = async (product) => {
    setCurrentProduct(product);
    setFormName(product.name || '');
    const catId =
      typeof product.category_id === 'object'
        ? product.category_id?._id
        : product.category_id;
    setFormCategoryId(catId || categories[0]?._id || '');
    setFormPrice((product.new_price ?? product.price ?? 0).toString());
    setFormOldPrice((product.old_price ?? product.price ?? 0).toString());
    setFormStock((product.stock ?? 0).toString());
    const displayImgs =
      Array.isArray(product.displayProduct) && product.displayProduct.length > 0
        ? product.displayProduct
        : product.image
        ? [product.image]
        : [''];
    setFormImages(displayImgs);
    setFormDescription(product.description || '');
    setFormVariants([]);
    setVarColor('');
    setVarSize('');
    setVarStock('');
    setVarImage('');
    setEditingVariantIndex(null);
    setFormWeight((product.weight ?? 0.5).toString());
    setFormIsFeatured(Boolean(product.is_featured));
    setModalTab('basic');
    setIsEditModalOpen(true);

    try {
      const vars = await getProductVariantByProductIdService(product._id);
      setFormVariants(vars || []);
    } catch {
      setFormVariants(product.variants || []);
    }
  };

  const handleStartEditVariant = (index) => {
    const v = formVariants[index];
    setVarColor(v.color || '');
    setVarSize(v.size || '');
    setVarStock((v.stock || 0).toString());
    setVarImage(v.image_url || '');
    setEditingVariantIndex(index);
  };

  const handleCancelEditVariant = () => {
    setVarColor('');
    setVarSize('');
    setVarStock('');
    setVarImage('');
    setEditingVariantIndex(null);
  };

  const handleAddVariantToList = (e) => {
    e.preventDefault();
    if (!varColor.trim()) {
      toast.error('Vui lòng điền Màu sắc biến thể!');
      return;
    }

    const finalImage =
      varImage.trim() ||
      formImages.find((img) => img.trim() !== '') ||
      defaultProductImage;
    const sizesStr = varSize.trim();

    if (editingVariantIndex !== null) {
      const updated = {
        color: varColor.trim(),
        size: sizesStr || '',
        stock: parseInt(varStock || '0', 10),
        image_url: finalImage,
      };

      const isDuplicate = formVariants.some(
        (existingV, idx) =>
          idx !== editingVariantIndex &&
          existingV.color.toLowerCase() === updated.color.toLowerCase() &&
          existingV.size.toLowerCase() === updated.size.toLowerCase()
      );

      if (isDuplicate) {
        toast.warning(
          `Biến thể màu ${updated.color} - kích cỡ ${
            updated.size || 'K/C'
          } đã tồn tại!`
        );
        return;
      }

      const newList = [...formVariants];
      newList[editingVariantIndex] = updated;
      setFormVariants(newList);
      setEditingVariantIndex(null);
      toast.success('Đã cập nhật biến thể!');
    } else {
      if (sizesStr.includes(',')) {
        const parts = sizesStr
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);

        const newVariants = [];
        for (const part of parts) {
          if (part.includes(':')) {
            const [sz, st] = part.split(':').map((x) => x.trim());
            if (sz) {
              newVariants.push({
                color: varColor.trim(),
                size: sz,
                stock: parseInt(st || '0', 10),
                image_url: finalImage,
              });
            }
          } else {
            newVariants.push({
              color: varColor.trim(),
              size: part,
              stock: parseInt(varStock || '0', 10),
              image_url: finalImage,
            });
          }
        }

        if (newVariants.length > 0) {
          const filteredNewVariants = newVariants.filter(
            (newV) =>
              !formVariants.some(
                (existingV) =>
                  existingV.color.toLowerCase() === newV.color.toLowerCase() &&
                  existingV.size.toLowerCase() === newV.size.toLowerCase()
              )
          );
          setFormVariants([...formVariants, ...filteredNewVariants]);
        }
      } else {
        const newVar = {
          color: varColor.trim(),
          size: sizesStr || '',
          stock: parseInt(varStock || '0', 10),
          image_url: finalImage,
        };

        const isDuplicate = formVariants.some(
          (existingV) =>
            existingV.color.toLowerCase() === newVar.color.toLowerCase() &&
            existingV.size.toLowerCase() === newVar.size.toLowerCase()
        );

        if (isDuplicate) {
          toast.warning(
            `Biến thể màu ${newVar.color} - kích cỡ ${
              newVar.size || 'K/C'
            } đã tồn tại!`
          );
          return;
        }

        setFormVariants([...formVariants, newVar]);
      }
    }

    setVarColor('');
    setVarSize('');
    setVarStock('');
    setVarImage('');
  };

  const handleRemoveVariantFromList = (index) => {
    setFormVariants(formVariants.filter((_, i) => i !== index));
  };

  const getFinalVariants = () => {
    if (!varColor.trim()) return formVariants;
    const finalImage =
      varImage.trim() ||
      formImages.find((img) => img.trim() !== '') ||
      defaultProductImage;
    const newVar = {
      color: varColor.trim(),
      size: varSize.trim() || '',
      stock: parseInt(varStock || '0', 10),
      image_url: finalImage,
    };
    return [...formVariants, newVar];
  };

  const handleAddImageUrl = () => {
    setFormImages([...formImages, '']);
  };

  const handleRemoveImageUrl = (index) => {
    setFormImages(formImages.filter((_, idx) => idx !== index));
  };

  const handleImageChange = (index, value) => {
    const nextImages = [...formImages];
    nextImages[index] = value;
    setFormImages(nextImages);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const finalVars = getFinalVariants();
    const totalStock =
      finalVars.length > 0
        ? finalVars.reduce((sum, v) => sum + (v.stock || 0), 0)
        : parseInt(formStock || '0', 10);

    if (!formName.trim() || !formCategoryId || !formPrice) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const cleanedImages = formImages.filter((img) => img.trim() !== '');
    const displayProduct =
      cleanedImages.length > 0 ? cleanedImages : [defaultProductImage];

    setSubmitting(true);
    try {
      await addProductService({
        name: formName.trim(),
        category_id: formCategoryId,
        new_price: parseFloat(formPrice),
        old_price: parseFloat(formOldPrice || formPrice),
        stock: totalStock,
        displayProduct,
        description: formDescription,
        variants: finalVars,
        weight: parseFloat(formWeight || '0.5'),
        is_featured: formIsFeatured,
      });
      toast.success('Thêm sản phẩm thành công!');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Không thể thêm sản phẩm!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const finalVars = getFinalVariants();
    const totalStock =
      finalVars.length > 0
        ? finalVars.reduce((sum, v) => sum + (v.stock || 0), 0)
        : parseInt(formStock || '0', 10);

    if (!formName.trim() || !formCategoryId || !formPrice) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const cleanedImages = formImages.filter((img) => img.trim() !== '');
    const displayProduct =
      cleanedImages.length > 0 ? cleanedImages : [defaultProductImage];

    setSubmitting(true);
    try {
      await updateProductService(currentProduct._id, {
        name: formName.trim(),
        category_id: formCategoryId,
        new_price: parseFloat(formPrice),
        old_price: parseFloat(formOldPrice || formPrice),
        stock: totalStock,
        displayProduct,
        description: formDescription,
        variants: finalVars,
        weight: parseFloat(formWeight || '0.5'),
        is_featured: formIsFeatured,
      });
      toast.success('Cập nhật sản phẩm thành công!');
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật sản phẩm!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    const result = await Swal.fire({
      title: 'Xóa sản phẩm này?',
      text: `Sản phẩm "${name}" sẽ bị xóa vĩnh viễn khỏi danh mục.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Đồng ý xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await deleteProductService(id);
        toast.success('Đã xóa sản phẩm thành công!');
        fetchData();
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || 'Không thể xóa sản phẩm!';
        toast.warning(errorMsg);
      }
    }
  };

  // Filtered & Paginated Products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.slug?.toLowerCase().includes(search.toLowerCase());
    const pCatId =
      typeof product.category_id === 'object'
        ? product.category_id?._id
        : product.category_id;
    const matchesCategory =
      selectedCategoryId === 'all' || pCatId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const totalFiltered = filteredProducts.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý sản phẩm"
        description="Quản lý kho hàng thời trang, bảng giá, biến thể màu sắc và kích cỡ"
        breadcrumbs={[{ label: 'Sản phẩm' }]}
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
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        }
      />

      {/* Main Card */}
      <AdminCard noPadding>
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã sản phẩm..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
            Tổng cộng: <strong className="text-slate-900 dark:text-white">{totalFiltered}</strong> sản phẩm
          </span>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
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
        ) : paginatedProducts.length === 0 ? (
          <AdminEmptyState
            icon={PackageOpen}
            title={search || selectedCategoryId !== 'all' ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
            description={
              search
                ? `Không có sản phẩm nào khớp với từ khóa "${search}".`
                : 'Bắt đầu tạo sản phẩm thời trang đầu tiên để mở bán trên cửa hàng.'
            }
            action={
              !search && selectedCategoryId === 'all' && (
                <button
                  onClick={handleOpenAddModal}
                  className="bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  Tạo sản phẩm ngay
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 w-16">Ảnh</th>
                    <th className="px-6 py-3.5">Tên sản phẩm</th>
                    <th className="px-6 py-3.5">Danh mục</th>
                    <th className="px-6 py-3.5">Giá bán</th>
                    <th className="px-6 py-3.5 text-center">Tồn kho</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {paginatedProducts.map((p) => {
                    const pCatId =
                      typeof p.category_id === 'object'
                        ? p.category_id?._id
                        : p.category_id;
                    const cat = categories.find((c) => c._id === pCatId);
                    const stock = p.stock ?? 0;
                    const currentPrice = p.new_price ?? p.price ?? 0;
                    const oldPrice = p.old_price ?? p.price ?? 0;

                    return (
                      <tr
                        key={p._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Thumbnail */}
                        <td className="px-6 py-3.5">
                          <img
                            src={
                              p.displayProduct?.[0] ||
                              p.image ||
                              defaultProductImage
                            }
                            alt={p.name}
                            className="h-11 w-11 object-cover rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs"
                            onError={(e) => {
                              e.target.src = defaultProductImage;
                            }}
                          />
                        </td>

                        {/* Name */}
                        <td className="px-6 py-3.5 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {p.is_featured && (
                              <AdminBadge variant="warning" size="sm">
                                Nổi bật
                              </AdminBadge>
                            )}
                            <span className="text-[11px] text-slate-400 font-mono">
                              #{p._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                          {cat ? cat.name : 'Chưa phân loại'}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                            {currentPrice.toLocaleString('vi-VN')} đ
                          </div>
                          {oldPrice > currentPrice && (
                            <del className="text-[11px] text-slate-400 tabular-nums">
                              {oldPrice.toLocaleString('vi-VN')} đ
                            </del>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-3.5 text-center">
                          {stock <= 0 ? (
                            <AdminBadge variant="danger" dot size="sm">
                              Hết hàng
                            </AdminBadge>
                          ) : stock <= 5 ? (
                            <AdminBadge variant="warning" dot size="sm">
                              Còn {stock} SP
                            </AdminBadge>
                          ) : (
                            <AdminBadge variant="success" dot size="sm">
                              {stock} SP
                            </AdminBadge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              aria-label={`Sửa ${p.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id, p.name)}
                              aria-label={`Xóa ${p.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <AdminPagination
              page={currentPage}
              limit={itemsPerPage}
              total={totalFiltered}
              totalPages={totalPages}
              onPageChange={(newPage) => setCurrentPage(newPage)}
            />
          </>
        )}
      </AdminCard>

      {/* Product Form Modal (Shared for Add & Edit with Tabs) */}
      <AdminModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
        description="Điền thông tin hàng hóa, cấu hình giá bán và các biến thể kích cỡ / màu sắc"
        size="2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {submitting
                ? 'Đang lưu...'
                : isAddModalOpen
                ? 'Tạo sản phẩm'
                : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Section Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 pb-1">
            {[
              { id: 'basic', label: '1. Thông tin chung', icon: Info },
              { id: 'media', label: '2. Thư viện ảnh', icon: ImageIcon },
              { id: 'variants', label: '3. Biến thể & Kho', icon: Layers },
              { id: 'description', label: '4. Mô tả chi tiết', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = modalTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    isActive
                      ? 'bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <form
            id="product-form"
            onSubmit={isAddModalOpen ? handleAddProduct : handleEditProduct}
            className="space-y-4"
          >
            {/* TAB 1: BASIC INFO */}
            {modalTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tên sản phẩm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Áo Blazer Nam Linen Cổ Bẻ..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Trọng lượng vận chuyển (kg)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Giá bán hiện tại (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="550000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Giá gốc niêm yết (VNĐ)
                    </label>
                    <input
                      type="number"
                      placeholder="650000"
                      value={formOldPrice}
                      onChange={(e) => setFormOldPrice(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#05251C] focus:ring-[#05251C] cursor-pointer"
                  />
                  <label
                    htmlFor="is_featured"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Đánh dấu là Sản phẩm nổi bật (Hiển thị trang chủ)
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA / IMAGES */}
            {modalTab === 'media' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Danh sách URL hình ảnh sản phẩm
                  </span>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="text-xs font-bold text-[#05251C] dark:text-[#F5DD20] hover:underline"
                  >
                    + Thêm ảnh
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formImages.map((imgUrl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={imgUrl}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        className="flex-1 h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
                      />
                      {formImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(idx)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Previews */}
                <div className="pt-3">
                  <span className="block text-xs font-semibold text-slate-500 mb-2">
                    Xem trước ảnh:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {formImages
                      .filter((img) => img.trim() !== '')
                      .map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="preview"
                          className="h-20 w-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                          onError={(e) => {
                            e.target.src = defaultProductImage;
                          }}
                        />
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VARIANTS & STOCK */}
            {modalTab === 'variants' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {editingVariantIndex !== null ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      placeholder="Màu sắc (vd: Đen)"
                      value={varColor}
                      onChange={(e) => setVarColor(e.target.value)}
                      className="h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Size (vd: S, M, L)"
                      value={varSize}
                      onChange={(e) => setVarSize(e.target.value)}
                      className="h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder="Tồn kho"
                      value={varStock}
                      onChange={(e) => setVarStock(e.target.value)}
                      className="h-9 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddVariantToList}
                        className="flex-1 h-9 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-semibold text-xs rounded-lg transition"
                      >
                        {editingVariantIndex !== null ? 'Cập nhật' : 'Thêm'}
                      </button>
                      {editingVariantIndex !== null && (
                        <button
                          type="button"
                          onClick={handleCancelEditVariant}
                          className="h-9 px-2 text-xs text-slate-500 hover:bg-slate-200 rounded-lg"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* List of current variants */}
                {formVariants.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Màu</th>
                          <th className="px-4 py-2">Kích cỡ</th>
                          <th className="px-4 py-2 text-center">Tồn kho</th>
                          <th className="px-4 py-2 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {formVariants.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-2">{v.color}</td>
                            <td className="px-4 py-2 font-mono">{v.size || 'K/C'}</td>
                            <td className="px-4 py-2 text-center font-bold">{v.stock}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleStartEditVariant(i)}
                                className="text-slate-600 hover:text-slate-900 mr-2 text-xs"
                              >
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantFromList(i)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Sản phẩm chưa có biến thể cụ thể. Nếu không có biến thể, hãy nhập tổng tồn kho bên dưới.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tổng tồn kho ({formVariants.length > 0 ? 'Tự tính từ các biến thể' : 'Tồn kho chung'})
                  </label>
                  <input
                    type="number"
                    disabled={formVariants.length > 0}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100 disabled:opacity-60 font-mono font-bold"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: DESCRIPTION */}
            {modalTab === 'description' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mô tả sản phẩm (chất liệu, form dáng, hướng dẫn bảo quản)
                </label>
                <textarea
                  rows={6}
                  placeholder="Mô tả chi tiết sản phẩm thời trang..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </form>
        </div>
      </AdminModal>
    </div>
  );
};

export default ProductManagement;
