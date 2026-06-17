import { useState, useEffect } from "react";
import {
  getAllBannersService,
  createBannerService,
  updateBannerService,
  deleteBannerService,
  toggleBannerStatusService,
} from "../services/banner.service";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export const useBanners = (initialFilters = {}) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    position: "",
    status: "",
    ...initialFilters,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await getAllBannersService(filters);
      setBanners(res.items || []);
      setPagination(res.pagination || { page: 1, limit: 10, totalItems: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tải danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [filters]);

  const createBanner = async (bannerData) => {
    try {
      await createBannerService(bannerData);
      toast.success("Tạo banner mới thành công! 🚀");
      fetchBanners();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Tạo banner thất bại");
      return false;
    }
  };

  const updateBanner = async (id, bannerData) => {
    try {
      await updateBannerService(id, bannerData);
      toast.success("Cập nhật banner thành công!");
      fetchBanners();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật banner thất bại");
      return false;
    }
  };

  const deleteBanner = async (id, title) => {
    try {
      const result = await Swal.fire({
        title: "Xóa Banner?",
        text: `Bạn có chắc chắn muốn xóa banner "${title}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Đồng ý xóa",
        cancelButtonText: "Hủy bỏ",
      });

      if (result.isConfirmed) {
        await deleteBannerService(id);
        toast.success("Đã xóa banner!");
        fetchBanners();
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa banner thất bại");
    }
    return false;
  };

  const toggleBannerStatus = async (id) => {
    try {
      const updated = await toggleBannerStatusService(id);
      setBanners((prev) =>
        prev.map((b) => ((b._id || b.id) === id ? { ...b, isActive: updated.isActive } : b))
      );
      toast.info("Đã thay đổi trạng thái kích hoạt banner!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể thay đổi trạng thái");
    }
  };

  return {
    banners,
    loading,
    filters,
    setFilters,
    pagination,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    reload: fetchBanners,
  };
};

export default useBanners;
