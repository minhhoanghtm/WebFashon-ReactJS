import { useEffect, useMemo, useState } from "react";
import {
  addUserApi,
  deleteUserApi,
  getAllUsersApi,
  initializeAdminUserApi,
  updateUserApi,
} from "../../api/adminUserApi";

const defaultFormData = {
  userName: "",
  passWord: "",
  fullName: "",
  role: "user",
  avatar_url: "",
  addressFullName: "",
  addressPhone: "",
  addressCity: "",
  addressDistrict: "",
  addressDetail: "",
};

const phonePattern = /^0\d{9}$/;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const toFormData = (user) => ({
  userName: user.userName || "",
  passWord: user.passWord || "",
  fullName: user.fullName || "",
  role: user.role || "user",
  avatar_url: user.avatar_url || "",
  addressFullName: user.address?.[0]?.fullName || "",
  addressPhone: user.address?.[0]?.phone || "",
  addressCity: user.address?.[0]?.city || "",
  addressDistrict: user.address?.[0]?.district || "",
  addressDetail: user.address?.[0]?.detail || "",
});

const normalizePayload = (formData) => ({
  userName: formData.userName.trim(),
  passWord: formData.passWord.trim(),
  fullName: formData.fullName.trim(),
  role: formData.role,
  avatar_url: formData.avatar_url.trim(),
  address: [
    {
      fullName: formData.addressFullName.trim(),
      phone: formData.addressPhone.trim(),
      city: formData.addressCity.trim(),
      district: formData.addressDistrict.trim(),
      detail: formData.addressDetail.trim(),
    },
  ],
});

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await initializeAdminUserApi();
      const response = await getAllUsersApi();
      const userData = await response.json();
      setUsers(userData);
    } catch {
      setErrorMessage("Không thể tải danh sách tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesKeyword =
        user.userName.toLowerCase().includes(keyword.toLowerCase()) ||
        user.fullName.toLowerCase().includes(keyword.toLowerCase());

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

  const resetForm = () => {
    setEditingUserId(null);
    setIsFormOpen(false);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData(defaultFormData);
  };

  const openCreateForm = () => {
    setEditingUserId(null);
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData(defaultFormData);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleInputChange = ({ target }) => {
    const { name, value } = target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUser = (user) => {
    setEditingUserId(user._id);
    setIsFormOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFormData(toFormData(user));
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa tài khoản này?");

    if (!confirmDelete) {
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

    if (editingUserId === userId) {
      resetForm();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = normalizePayload(formData);

    if (
      !payload.userName ||
      !payload.passWord ||
      !payload.fullName ||
      !payload.avatar_url ||
      !payload.address[0].fullName ||
      !payload.address[0].phone ||
      !payload.address[0].city ||
      !payload.address[0].district ||
      !payload.address[0].detail
    ) {
      setErrorMessage("Vui lòng nhập đầy đủ tất cả thông tin bắt buộc.");
      setIsSubmitting(false);
      return;
    }

    if (!phonePattern.test(payload.address[0].phone)) {
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
        setSuccessMessage(`Đã cập nhật tài khoản "${result.userName}".`);
      } else {
        setUsers((prev) => [result, ...prev]);
        setSuccessMessage(`Đã thêm tài khoản "${result.userName}".`);
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
              Admin Account Management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Quản lý tài khoản người dùng
            </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
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
                Quản trị viên
              </p>
              <p className="mt-1 text-2xl font-semibold text-orange-700">
                {userStats.admin}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">
                Người dùng
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
              User List
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Danh sách tài khoản
            </h2>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:rounded-full lg:bg-slate-50 lg:p-2">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên đăng nhập hoặc họ tên"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:min-w-80 lg:border-white"
            />
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400 lg:border-white"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="user">Người dùng</option>
            </select>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-orange-500 hover:to-orange-400"
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
                  Tên đăng nhập
                </span>
                <input
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên đăng nhập"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Mật khẩu
                </span>
                <input
                  name="passWord"
                  value={formData.passWord}
                  onChange={handleInputChange}
                  placeholder="Nhập mật khẩu"
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
                  Vai trò
                </span>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </label>

              <label className="grid gap-2 lg:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Ảnh đại diện
                </span>
                <input
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="Nhập URL ảnh đại diện"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Người nhận
                </span>
                <input
                  name="addressFullName"
                  value={formData.addressFullName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người nhận"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
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
                <input
                  name="addressCity"
                  value={formData.addressCity}
                  onChange={handleInputChange}
                  placeholder="Nhập thành phố"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Quận/Huyện
                </span>
                <input
                  name="addressDistrict"
                  value={formData.addressDistrict}
                  onChange={handleInputChange}
                  placeholder="Nhập quận hoặc huyện"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-400"
                />
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
            <span>Tên đăng nhập</span>
            <span>Vai trò</span>
            <span>Địa chỉ</span>
            <span>Thao tác</span>
          </div>

          {isLoading ? (
            <div className="px-4 py-10 text-center text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500">
              Không có tài khoản nào phù hợp bộ lọc hiện tại.
            </div>
          ) : (
            filteredUsers.map((user) => (
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
                      Tạo ngày {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-slate-900">{user.userName}</p>
                  <p className="text-sm text-slate-500">{user.passWord}</p>
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  <p>{user.address?.[0]?.detail}</p>
                  <p>
                    {user.address?.[0]?.district}, {user.address?.[0]?.city}
                  </p>
                  <p>{user.address?.[0]?.phone}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditUser(user)}
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user._id)}
                    className="flex-1 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminUserManagement;
