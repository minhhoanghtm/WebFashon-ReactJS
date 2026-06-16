import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  RotateCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Calendar,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Shield,
  UserCheck2,
  Edit,
  Key,
  Lock,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllUsersApi, updateUserApi } from "../../api/adminUserApi";

// Rich Mock Customers Data for fallback
const mockCustomers = [];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Active Dropdown Action Menu ID
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit User Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editStatus, setEditStatus] = useState("active");

  // Change Password Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsersApi();
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
        setIsUsingMock(false);
      } else {
        setUsers([]);
        setIsUsingMock(false);
        toast.error("Không thể tải danh sách tài khoản từ server.");
      }
    } catch (err) {
      setUsers([]);
      setIsUsingMock(false);
      console.error("Failed to load user list from API:", err);
      toast.error("Lỗi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle click outside action menus to close them, avoiding toggle buttons
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!activeActionMenuId) return;

      // Do nothing if click is inside the open menu
      if (event.target.closest(".action-dropdown-menu")) {
        return;
      }

      // Do nothing if click is on the trigger button (let toggle onClick handle it)
      if (event.target.closest(".action-menu-trigger")) {
        return;
      }

      setActiveActionMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeActionMenuId]);

  // Handle Refresh Action
  const handleRefresh = () => {
    fetchUsers();
    setActiveActionMenuId(null);
    toast.info("Đã làm mới danh sách khách hàng!");
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Determine metadata presence in dataset
  const hasStatus = users.some(
    (u) => u.status !== undefined && u.status !== null,
  );
  const hasRole = users.some((u) => u.role !== undefined && u.role !== null);

  // Calculations for Statistics Cards
  const totalUsersCount = users.length;

  // Calculate new users (registered in last 30 days)
  const getNewUsersCount = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return users.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo,
    ).length;
  };

  const newUsersCount = getNewUsersCount();
  const activeCount = users.filter((u) => u.status === "active").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter(
    (u) => !u.role || u.role === "user",
  ).length;

  // Search and Filter Logic
  const filteredUsers = users.filter((u) => {
    const name = (u.fullName || u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || u.addresses?.[0]?.phone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      name.includes(query) || email.includes(query) || phone.includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === "all") return true;
    if (activeFilter === "active" && hasStatus) return u.status === "active";
    if (activeFilter === "blocked" && hasStatus) return u.status === "blocked";
    if (activeFilter === "admin" && hasRole) return u.role === "admin";
    if (activeFilter === "customer" && hasRole)
      return !u.role || u.role === "user";

    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
    setActiveActionMenuId(null);
  }, [searchQuery, activeFilter]);

  // Actions Handlers
  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditName(user.fullName || user.name || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || user.addresses?.[0]?.phone || "");
    setEditRole(user.role || "user");
    setEditStatus(user.status || "active");
    setIsEditModalOpen(true);
  };

  const handleOpenPassword = (user) => {
    setPasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }
    if (editPhone && !/^[0-9]{9,11}$/.test(editPhone)) {
      toast.error("Số điện thoại không hợp lệ (yêu cầu 9 đến 11 chữ số)!");
      return;
    }

    setSubmitLoading(true);
    try {
      if (isUsingMock) {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === editUser._id
              ? {
                  ...u,
                  fullName: editName,
                  email: editEmail,
                  role: editRole,
                  status: editStatus,
                  phone: editPhone,
                  addresses: [
                    {
                      fullName: editName,
                      phone: editPhone,
                    },
                  ],
                }
              : u,
          ),
        );
        toast.success("Cập nhật thông tin khách hàng giả lập thành công!");
        setIsEditModalOpen(false);
      } else {
        const existingAddress = editUser.addresses?.[0] || {};
        const payload = {
          fullName: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
          gender: editUser.sex || editUser.gender || "other",
          dateOfBirth: editUser.birthday || editUser.dateOfBirth || "",
          avatar_url: editUser.avatar_url || editUser.avatar || "",
          addresses: [
            {
              ...existingAddress,
              fullName: editName,
              phone: editPhone,
            },
          ],
        };

        const response = await updateUserApi(editUser._id, payload);
        if (response.ok) {
          toast.success("Cập nhật thông tin khách hàng thành công!");
          setIsEditModalOpen(false);
          fetchUsers();
        } else {
          const errData = await response.json();
          toast.error(errData.message || "Không thể cập nhật tài khoản.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi cập nhật thông tin.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập mật khẩu!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu không trùng khớp!");
      return;
    }

    setSubmitLoading(true);
    try {
      if (isUsingMock) {
        toast.success("Đổi mật khẩu khách hàng giả lập thành công!");
        setIsPasswordModalOpen(false);
      } else {
        const payload = {
          fullName: passwordUser.fullName || passwordUser.name || "",
          email: passwordUser.email || "",
          role: passwordUser.role || "user",
          status: passwordUser.status || "active",
          gender: passwordUser.sex || passwordUser.gender || "other",
          dateOfBirth: passwordUser.birthday || passwordUser.dateOfBirth || "",
          avatar_url: passwordUser.avatar_url || passwordUser.avatar || "",
          addresses: passwordUser.addresses || [],
          passWord: newPassword,
        };

        const response = await updateUserApi(passwordUser._id, payload);
        if (response.ok) {
          toast.success("Đổi mật khẩu khách hàng thành công!");
          setIsPasswordModalOpen(false);
          fetchUsers();
        } else {
          const errData = await response.json();
          toast.error(errData.message || "Không thể thay đổi mật khẩu.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi cập nhật mật khẩu.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Khách hàng</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : users.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {hasStatus ? "Tổng khách hàng" : "Tổng tài khoản"}
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {totalUsersCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Khách hàng mới
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {newUsersCount}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Đăng ký trong 30 ngày qua
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {hasStatus ? "Đang hoạt động" : "Khách hàng"}
              </span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 dark:border-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {hasStatus ? (
                <UserCheck className="h-6 w-6" />
              ) : (
                <UserCheck2 className="h-6 w-6" />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {hasStatus ? "Bị khóa" : "Quản trị viên"}
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {hasStatus ? blockedCount : adminCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
              {hasStatus ? (
                <UserX className="h-6 w-6" />
              ) : (
                <Shield className="h-6 w-6" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 mt-4 rounded" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center space-y-5 transition duration-300 min-h-[380px]">
          <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              Chưa có khách hàng
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dữ liệu khách hàng sẽ hiển thị tại đây khi hệ thống ghi nhận người
              dùng.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:-translate-y-0.5 transition cursor-pointer"
          >
            <RotateCw className="h-4.5 w-4.5" />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Toolbar: Search & Filter Tabs */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4 transition duration-300 font-semibold text-xs">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="w-full lg:w-auto flex items-center overflow-x-auto gap-1.5 scrollbar-thin pb-1 lg:pb-0">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Tất cả
              </button>

              {hasStatus && (
                <>
                  <button
                    onClick={() => setActiveFilter("active")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      activeFilter === "active"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Đang hoạt động
                  </button>
                  <button
                    onClick={() => setActiveFilter("blocked")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      activeFilter === "blocked"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Bị khóa
                  </button>
                </>
              )}

              {hasRole && (
                <>
                  <button
                    onClick={() => setActiveFilter("admin")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      activeFilter === "admin"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Quản trị viên
                  </button>
                  <button
                    onClick={() => setActiveFilter("customer")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                      activeFilter === "customer"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Khách hàng
                  </button>
                </>
              )}
            </div>
          </div>

          {/* List Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Tìm thấy {filteredUsers.length} khách hàng trùng khớp</span>
            {isUsingMock && (
              <span className="text-amber-500 font-bold bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-full">
                Mock Data Fallback
              </span>
            )}
          </div>

          {/* Table List (Desktop & Tablet) */}
          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden max-md:hidden transition duration-300">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/60 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Họ và Tên</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4 max-lg:hidden">Số điện thoại</th>
                    <th className="px-6 py-4 max-lg:hidden">Ngày tham gia</th>
                    {hasRole && <th className="px-6 py-4">Vai trò</th>}
                    {hasStatus && <th className="px-6 py-4">Trạng thái</th>}
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasStatus ? 7 : 6}
                        className="px-6 py-12 text-center text-slate-400 italic"
                      >
                        Không tìm thấy khách hàng trùng khớp.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((u) => {
                      const name =
                        u.fullName ||
                        u.name ||
                        u.userName ||
                        u.email ||
                        "Khách hàng";
                      const phone = u.phone || u.addresses?.[0]?.phone || "-";
                      const roleLabel =
                        u.role === "admin" ? "Quản trị viên" : "Khách hàng";
                      const firstChar = name.charAt(0).toUpperCase();

                      return (
                        <tr
                          key={u._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            {u.avatar_url || u.avatar ? (
                              <img
                                src={u.avatar_url || u.avatar}
                                alt="avatar"
                                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 uppercase text-sm">
                                {firstChar}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-slate-850 dark:text-slate-100 truncate max-w-[150px]">
                              {name}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            <span className="truncate max-w-[180px] block">
                              {u.email}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-lg:hidden">
                            {phone}
                          </td>

                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-lg:hidden">
                            {formatDate(u.createdAt)}
                          </td>

                          {hasRole && (
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${
                                  u.role === "admin"
                                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                }`}
                              >
                                {roleLabel}
                              </span>
                            </td>
                          )}

                          {hasStatus && (
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${
                                  u.status === "active"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {u.status === "active"
                                  ? "Hoạt động"
                                  : "Bị khóa"}
                              </span>
                            </td>
                          )}

                          {/* Actions column with Dropdown Ellipsis Menu */}
                          <td className="px-6 py-4 text-center relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(
                                  activeActionMenuId === u._id ? null : u._id,
                                );
                              }}
                              className="action-menu-trigger p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                              aria-label="More Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>

                            {activeActionMenuId === u._id && (
                              <div className="action-dropdown-menu absolute right-6 top-10 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155">
                                <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenDetail(u);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 text-slate-400" />
                                  <span>Xem chi tiết</span>
                                </button>
                                {/* <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenEdit(u);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 text-slate-400" />
                                  <span>Chỉnh sửa</span>
                                </button> */}
                                {/* <button
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenPassword(u);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                                >
                                  <Key className="h-4 w-4 text-slate-400" />
                                  <span>Đổi mật khẩu</span>
                                </button> */}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards List (Mobile Layout Only) */}
          <div className="md:hidden space-y-4">
            {currentItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 italic">
                Không tìm thấy khách hàng trùng khớp.
              </div>
            ) : (
              currentItems.map((u) => {
                const name =
                  u.fullName || u.name || u.userName || u.email || "Khách hàng";
                const phone = u.phone || u.addresses?.[0]?.phone || "-";
                const roleLabel =
                  u.role === "admin" ? "Quản trị viên" : "Khách hàng";
                const firstChar = name.charAt(0).toUpperCase();

                return (
                  <div
                    key={u._id}
                    className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col space-y-3 text-left relative transition duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {u.avatar_url || u.avatar ? (
                          <img
                            src={u.avatar_url || u.avatar}
                            alt="avatar"
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 uppercase text-xs">
                            {firstChar}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-850 dark:text-white truncate max-w-[130px]">
                            {name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Ellipsis menu button for Mobile card */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(
                              activeActionMenuId === u._id ? null : u._id,
                            );
                          }}
                          className="action-menu-trigger p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                        >
                          <MoreHorizontal className="h-4.5 w-4.5" />
                        </button>

                        {activeActionMenuId === u._id && (
                          <div className="action-dropdown-menu absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155">
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleOpenDetail(u);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                            >
                              <Eye className="h-4 w-4 text-slate-400" />
                              <span>Xem chi tiết</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleOpenEdit(u);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-slate-400" />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                handleOpenPassword(u);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                            >
                              <Key className="h-4 w-4 text-slate-400" />
                              <span>Đổi mật khẩu</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[190px]">
                          {u.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Điện thoại:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {hasRole && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                          ${
                            u.role === "admin"
                              ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          {roleLabel}
                        </span>
                      )}

                      {hasStatus && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                          ${
                            u.status === "active"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 font-semibold text-xs text-slate-400 transition duration-300">
              <span>
                Hiển thị {indexOfFirstItem + 1} -{" "}
                {Math.min(indexOfLastItem, filteredUsers.length)} trong số{" "}
                {filteredUsers.length} khách hàng
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Chi tiết khách hàng
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              {selectedUser.avatar_url || selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar_url || selectedUser.avatar}
                  alt="avatar"
                  className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm uppercase text-xl">
                  {(
                    selectedUser.fullName ||
                    selectedUser.name ||
                    selectedUser.userName ||
                    selectedUser.email ||
                    "K"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-800 dark:text-white truncate">
                  {selectedUser.fullName ||
                    selectedUser.name ||
                    selectedUser.userName ||
                    selectedUser.email ||
                    "Khách hàng"}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  ID: {selectedUser._id}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {hasRole && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                      ${
                        selectedUser.role === "admin"
                          ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {selectedUser.role === "admin"
                        ? "Quản trị viên"
                        : "Khách hàng"}
                    </span>
                  )}

                  {hasStatus && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                      ${
                        selectedUser.status === "active"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {selectedUser.status === "active"
                        ? "Hoạt động"
                        : "Bị khóa"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
                Thông tin cơ bản
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <div className="space-y-1">
                  <span className="text-slate-400 block">Email liên hệ:</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200 break-all">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    {selectedUser.phone ||
                      selectedUser.addresses?.[0]?.phone ||
                      "-"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">Ngày gia nhập:</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    {formatDate(selectedUser.createdAt)}
                  </span>
                </div>
                {selectedUser.birthday && (
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Ngày sinh:</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {formatDate(selectedUser.birthday)}
                    </span>
                  </div>
                )}
              </div>

              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pt-2 pb-1">
                Địa chỉ liên lạc
              </h5>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-2">
                {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                  selectedUser.addresses.map((addr, idx) => {
                    const fullAddr = [
                      addr.addressDetail,
                      addr.wardCode,
                      addr.districtCode,
                      addr.provinceCode,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3 rounded-xl space-y-1 flex items-start gap-2.5"
                      >
                        <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-800 dark:text-slate-100 font-bold">
                            {addr.fullName} ({addr.phone})
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                            {fullAddr || "Chưa cập nhật chi tiết"}
                          </p>
                          {addr.isDefault && (
                            <span className="inline-block bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 border border-indigo-100 dark:border-indigo-900/40">
                              Mặc định
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 italic">
                    Chưa ghi nhận địa chỉ liên lạc.
                  </p>
                )}
              </div>

              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pt-2 pb-1">
                Hoạt động mua hàng
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 p-3.5 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-indigo-500" />
                  <div className="text-left font-bold">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Đơn hàng hoàn tất
                    </span>
                    <span className="text-base text-indigo-600 dark:text-indigo-400">
                      {selectedUser.orderCount !== undefined
                        ? selectedUser.orderCount
                        : 0}{" "}
                      đơn
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/10 p-3.5 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div className="text-left font-bold">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Tổng chi tiêu
                    </span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                      {(selectedUser.totalSpend !== undefined
                        ? selectedUser.totalSpend
                        : 0
                      ).toLocaleString("vi-VN")}{" "}
                      đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Sửa thông tin khách hàng
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                {hasRole && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Vai trò
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="user">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                )}

                {hasStatus && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Trạng thái
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="blocked">Bị khóa</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4.5 py-2 text-sm font-semibold text-black bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="text-left">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Thay đổi mật khẩu khách hàng
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đặt lại mật khẩu cho tài khoản:{" "}
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    {passwordUser.fullName ||
                      passwordUser.name ||
                      passwordUser.email}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0 align-top self-start"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                      placeholder="Xác nhận lại mật khẩu mới"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4.5 py-2 text-sm font-semibold text-black bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
