import { useEffect, useMemo, useState } from "react";
import { Pagination } from "antd";
import {
  addUserApi,
  deleteUserApi,
  getAllUsersApi,
  initializeAdminUserApi,
  updateUserApi,
} from "../../api/adminUserApi";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "@/services/location.service";
import { uploadImageService } from "@/services/upload.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";

const defaultFormData = {
  email: "",
  passWord: "111111111",
  fullName: "",
  gender: "other",
  dateOfBirth: "",
  role: "staff",
  avatar_url: "",
  addressFullName: "",
  addressPhone: "",
  province: "",
  district: "",
  ward: "",
  addressDetail: "",
};

const phonePattern = /^0\d{9}$/;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const getSavedAddress = (user) =>
  user?.addresses?.[0] || user?.address?.[0] || user?.address || null;

const getAddressDisplayText = (address = {}) => {
  const parts = [
    address.addressDetail || address.detail || "",
    address.wardName || address.ward || "",
    address.districtName || address.district || "",
    address.provinceName || address.city || address.province || "",
  ];

  return parts.filter(Boolean).join(", ");
};
const toFormData = (user) => ({
  email: user.email || user.userName || "",
  passWord: user.passWord || "111111111",
  fullName: user.fullName || "",
  gender: user.gender || "other",
  dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
  role: user.role || "staff",
  avatar_url: user.avatar_url || "",
  addressFullName: getSavedAddress(user)?.fullName || "",
  addressPhone: getSavedAddress(user)?.phone || "",
  province:
    getSavedAddress(user)?.provinceCode ||
    getSavedAddress(user)?.city ||
    "",
  district:
    getSavedAddress(user)?.districtCode ||
    getSavedAddress(user)?.district ||
    "",
  ward:
    getSavedAddress(user)?.wardCode ||
    getSavedAddress(user)?.ward ||
    "",
  addressDetail:
    getSavedAddress(user)?.addressDetail ||
    getSavedAddress(user)?.detail ||
    "",
});

const normalizePayload = (formData) => ({
  email: formData.email.trim(),
  userName: formData.email.trim(),
  passWord: formData.passWord.trim(),
  fullName: formData.fullName.trim(),
  gender: formData.gender,
  dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
  role: formData.role,
  avatar_url: formData.avatar_url.trim(),
  addresses: [
    {
      fullName: formData.addressFullName.trim(),
      phone: formData.addressPhone.trim(),
      provinceCode: formData.province,
      districtCode: formData.district,
      wardCode: formData.ward,
      addressDetail: formData.addressDetail.trim(),
    },
  ],
});

const AdminUserManagement = () => {
  useDocumentTitle("Quản lý tài khoản");
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // 10 người dùng mỗi trang
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const resolveLocationData = async (address) => {
    if (!address || !provinces.length) {
      return { districts: [], wards: [], provinceCode: "", districtCode: "" };
    }

    const provinceValue = address.province || "";
    const districtValue = address.district || "";
    const wardValue = address.ward || "";

    const provinceMatch = provinces.find(
      (province) =>
        String(province.code) === String(provinceValue) ||
        province.name === provinceValue,
    );

    if (!provinceMatch) {
      return { districts: [], wards: [], provinceCode: provinceValue, districtCode: districtValue, wardCode: wardValue };
    }

    const provinceCode = String(provinceMatch.code);
    const districtsResponse = await getDistrictsService(provinceMatch.code);
    const nextDistricts = districtsResponse?.districts || [];

    const districtMatch = nextDistricts.find(
      (district) =>
        String(district.code) === String(districtValue) ||
        district.name === districtValue,
    );

    if (!districtMatch) {
      return { districts: nextDistricts, wards: [], provinceCode, districtCode: districtValue, wardCode: wardValue };
    }

    const districtCode = String(districtMatch.code);
    const wardsResponse = await getWardsService(districtMatch.code);
    const nextWards = wardsResponse?.wards || [];

    return {
      districts: nextDistricts,
      wards: nextWards,
      provinceCode,
      districtCode,
      wardCode: wardValue,
    };
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await initializeAdminUserApi();
      const response = await getAllUsersApi();
      const userData = await response.json();
      setUsers(userData);
      
      const provincesData = await getProvincesService();
      setProvinces(provincesData);

      const usersWithAddressNames = await Promise.all(
        userData.map(async (user) => {
          const address = getSavedAddress(user);

          if (!address) {
            return { ...user, displayAddress: "" };
          }

          const provinceMatch = provincesData.find(
            (province) =>
              String(province.code) === String(address.provinceCode || address.city || address.province) ||
              province.name === (address.provinceCode || address.city || address.province),
          );

          if (!provinceMatch) {
            return {
              ...user,
              displayAddress: getAddressDisplayText(address),
            };
          }

          const districtResponse = await getDistrictsService(provinceMatch.code);
          const districtsData = districtResponse?.districts || [];
          const districtMatch = districtsData.find(
            (district) =>
              String(district.code) === String(address.districtCode || address.district) ||
              district.name === (address.districtCode || address.district),
          );

          if (!districtMatch) {
            return {
              ...user,
              displayAddress: getAddressDisplayText({
                ...address,
                provinceName: provinceMatch.name,
              }),
            };
          }

          const wardResponse = await getWardsService(districtMatch.code);
          const wardsData = wardResponse?.wards || [];
          const wardMatch = wardsData.find(
            (ward) =>
              String(ward.code) === String(address.wardCode || address.ward) ||
              ward.name === (address.wardCode || address.ward),
          );

          return {
            ...user,
            displayAddress: getAddressDisplayText({
              ...address,
              provinceName: provinceMatch.name,
              districtName: districtMatch.name,
              wardName: wardMatch?.name || address.ward || "",
            }),
          };
        }),
      );

      setUsers(usersWithAddressNames);
    } catch {
      setErrorMessage("Không thể tải danh sách tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset về trang 1 khi lọc hoặc tìm kiếm thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, filterRole]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesKeyword =
        user.email?.toLowerCase().includes(keyword.toLowerCase()) ||
        user.userName?.toLowerCase().includes(keyword.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(keyword.toLowerCase());

      const matchesRole = filterRole === "all" || user.role === filterRole;

      return matchesKeyword && matchesRole;
    });
  }, [filterRole, keyword, users]);

  const userStats = useMemo(() => {
    const adminCount = users.filter((item) => item.role === "admin").length;
    const userCount = users.length - adminCount;

    return {
      total: users.length,
      admin: adminCount,
      user: userCount,
    };
  }, [users]);

  // Phân trang
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingUserId(null);
    setIsFormOpen(false);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData(defaultFormData);
    setAvatarFile(null);
    setAvatarPreview("");
    setDistricts([]);
    setWards([]);
  };

  const openCreateForm = () => {
    setEditingUserId(null);
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData(defaultFormData);
    setAvatarFile(null);
    setAvatarPreview("");
    setDistricts([]);
    setWards([]);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleInputChange = async ({ target }) => {
    const { name, value } = target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "province" && value) {
      const districtsData = await getDistrictsService(value);
      setDistricts(districtsData?.data || districtsData?.districts || []);
      setFormData((prev) => ({ ...prev, district: "", ward: "" }));
      setWards([]);
    }
    
    if (name === "district" && value && formData.province) {
      const wardsData = await getWardsService(value);
      setWards(wardsData?.data || wardsData?.wards || []);
      setFormData((prev) => ({ ...prev, ward: "" }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditUser = async (user) => {
    if (user.role === "user") {
      setErrorMessage("Không được phép chỉnh sửa thông tin khách hàng.");
      setSuccessMessage("");
      return;
    }

    setEditingUserId(user._id);
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
    const formDataUser = toFormData(user);
    setFormData(formDataUser);
    setAvatarPreview(user.avatar_url || "");

    try {
      const resolvedAddress = await resolveLocationData(getSavedAddress(user));
      setDistricts(resolvedAddress.districts);
      setWards(resolvedAddress.wards);
      setFormData((prev) => ({
        ...prev,
        province: resolvedAddress.provinceCode || prev.province,
        district: resolvedAddress.districtCode || prev.district,
        ward: resolvedAddress.wardCode || prev.ward,
      }));
    } catch (err) {
      console.error("Lỗi load thông tin tài khoản:", err);
      setDistricts([]);
      setWards([]);
    }
    
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa tài khoản này?");

    if (!confirmDelete) {
      return;
    }

    const targetUser = users.find((item) => item._id === userId);

    if (targetUser?.role === "user") {
      setErrorMessage("Không được phép xóa tài khoản khách hàng.");
      setSuccessMessage("");
      return;
    }

    const response = await deleteUserApi(userId);
    const result = await response.json();

    if (!response.ok) {
      setErrorMessage(result.message || "Xóa tài khoản thất bại.");
      return;
    }

    setUsers((prev) => prev.filter((item) => item._id !== userId));
    setSuccessMessage(`Đã xóa tài khoản "${result.userName}".`);
    setCurrentPage(1); // Reset về trang 1

    if (editingUserId === userId) {
      resetForm();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    let avatarUrl = formData.avatar_url;
    if (avatarFile) {
      try {
        avatarUrl = await uploadImageService(avatarFile);
      } catch {
        setErrorMessage("Upload ảnh đại diện thất bại.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload = normalizePayload({ ...formData, avatar_url: avatarUrl });

    if (
      !payload.email ||
      !payload.passWord ||
      !payload.fullName ||
      !payload.avatar_url ||
      !payload.addresses[0].fullName ||
      !payload.addresses[0].phone ||
      !payload.addresses[0].provinceCode ||
      !payload.addresses[0].districtCode ||
      !payload.addresses[0].wardCode ||
      !payload.addresses[0].addressDetail
    ) {
      setErrorMessage("Vui lòng nhập đầy đủ tất cả thông tin bắt buộc.");
      setIsSubmitting(false);
      return;
    }

    if (!phonePattern.test(payload.addresses[0].phone)) {
      setErrorMessage("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = editingUserId
        ? await updateUserApi(editingUserId, payload)
        : await addUserApi(payload);
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.message || "Không thể lưu tài khoản.");
        return;
      }

      if (editingUserId) {
        setUsers((prev) =>
          prev.map((item) => (item._id === editingUserId ? result : item)),
        );
        setSuccessMessage(`Đã cập nhật tài khoản "${result.email || result.userName}".`);
      } else {
        setUsers((prev) => [result, ...prev]);
        setCurrentPage(1); // Reset về trang 1 khi thêm tài khoản mới
        setSuccessMessage(`Đã thêm tài khoản "${result.email || result.userName}".`);
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
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Quản lý tài khoản người dùng
            </h1>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-130">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Tổng tài khoản
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {userStats.total}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-600">
                Nhân viên
              </p>
              <p className="mt-1 text-2xl font-semibold text-orange-700">
                {userStats.admin}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                Khách hàng
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {userStats.user}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Danh sách tài khoản
            </h2>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:rounded-full lg:bg-slate-50 lg:p-2">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo email hoặc họ tên"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:min-w-80 lg:border-white"
            />
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="user">Khách hàng</option>
            </select>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-500 hover:to-orange-400"
            >
              Thêm tài khoản
            </button>
          </div>
        </div>

        {isFormOpen ? (
          <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50/70 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                {editingUserId ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
              </p>
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
              noValidate
            >
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Họ tên
                </span>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ tên"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Giới tính
                </span>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Ngày sinh
                </span>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Vai trò
                </span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Ảnh đại diện
                </span>
                <div className="flex items-center gap-4">
                  {avatarPreview && (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-20 w-20 rounded-2xl object-cover border border-slate-200"
                    />
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 cursor-pointer font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Chọn ảnh
                  </label>
                </div>
              </label>

  

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Số điện thoại
                </span>
                <input
                  type="tel"
                  name="addressPhone"
                  value={formData.addressPhone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Thành phố
                </span>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="">Chọn thành phố</option>
                  {provinces?.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Quận/Huyện
                </span>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  disabled={!formData.province}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 disabled:bg-slate-100"
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts?.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Phường/Xã
                </span>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  disabled={!formData.district}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 disabled:bg-slate-100"
                >
                  <option value="">Chọn phường/xã</option>
                  {wards?.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Địa chỉ chi tiết
                </span>
                <input
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ chi tiết"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
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
                    : editingUserId
                      ? "Lưu cập nhật"
                      : "Thêm tài khoản"}
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

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100">
          <div className="hidden grid-cols-[1.2fr_1fr_0.9fr_1.2fr_0.9fr] gap-4 bg-slate-900 px-5 py-4 text-sm font-semibold text-white lg:grid">
            <span>Tài khoản</span>
            <span>Email</span>
            <span>Vai trò</span>
            <span>Địa chỉ</span>
            <span>Thao tác</span>
          </div>

          {isLoading ? (
            <div className="px-4 py-10 text-center text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500">
              {filteredUsers.length === 0 
                ? "Không có tài khoản nào phù hợp bộ lọc hiện tại."
                : "Không có tài khoản nào trên trang này."}
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <article
                key={user._id}
                className="grid gap-4 border-t border-slate-100 px-5 py-5 lg:grid-cols-[1.2fr_1fr_0.9fr_1.2fr_0.9fr] lg:items-center"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={user.avatar_url}
                    alt={user.fullName}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {user.fullName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}                      {user.dateOfBirth && " · " + formatDate(user.dateOfBirth)}                    </p>                    <p className="text-sm text-slate-500">                      Tạo ngày {formatDate(user.createdAt)}                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-900">{user.email}</p>
                  <p className="text-sm text-slate-500">{user.passWord}</p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-orange-100 text-orange-700"
                        : user.role === "staff"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.role === "admin" ? "Quản trị viên" : user.role === "staff" ? "Nhân viên" : "Khách hàng"}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  <p>{user.displayAddress || getAddressDisplayText(getSavedAddress(user) || {}) || "Chưa có địa chỉ"}</p>
                  <p>{user.addresses?.[0]?.phone || user.address?.[0]?.phone}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditUser(user)}
                    disabled={user.role === "user"}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    {user.role === "user"
                      ? "Chỉ xem"
                      : user._id === editingUserId
                        ? "Đang chỉnh sửa"
                        : "Chỉnh sửa"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={user.role === "user"}
                    className="flex-1 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                   
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Phân trang */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredUsers.length}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={[10, 20, 50]}
              onShowSizeChange={(_, size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminUserManagement;
