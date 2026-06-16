import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LayoutList,
  Package,
  ShoppingCart,
  Tag,
  Users,
  User,
  Key,
  LogOut,
  X,
  Menu,
  Image,
  Settings,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuthStore } from "../../store/auth.store";
import { updateProfileService, updatePasswordService } from "../../services/user.service";
import { toast } from "react-toastify";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: LayoutList, label: "Quản lý danh mục", path: "/admin/categories" },
  { icon: Package, label: "Quản lý sản phẩm", path: "/admin/products" },
  { icon: ShoppingCart, label: "Quản lý đơn hàng", path: "/admin/orders" },
  { icon: Users, label: "Quản lý người dùng", path: "/admin/customers" },
  { icon: Tag, label: "Khuyến mãi", path: "/admin/coupons" },
  { icon: Image, label: "Quản lý Banner", path: "/admin/banners" },
  { icon: Settings, label: "Cài đặt hệ thống", path: "/admin/settings" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  
  const [collapsed, setCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dropdownRef = useRef(null);

  // Handle auto-collapse on tablet viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Profile form values when modal opens
  useEffect(() => {
    if (isProfileModalOpen && user) {
      setProfileName(user.fullName || user.name || "");
      const phone = user.addresses?.[0]?.phone || user.phone || "";
      setProfilePhone(phone);
    }
  }, [isProfileModalOpen, user]);

  // Derived attributes
  const adminName = user?.fullName || user?.name || user?.userName || user?.email || "Admin";
  const avatarUrl = user?.avatar_url || user?.avatar || "";
  const firstLetter = adminName.charAt(0).toUpperCase();
  const displayRole = user?.role === "admin" ? "Quản trị viên" : (user?.role === "staff" ? "Nhân viên" : "Người dùng");

  const handleLogout = () => {
    logout();
    toast.success("Đăng xuất thành công!");
    navigate("/login");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }
    if (profilePhone && !/^[0-9]{9,11}$/.test(profilePhone)) {
      toast.error("Số điện thoại không hợp lệ (yêu cầu 9 đến 11 chữ số)!");
      return;
    }

    setLoading(true);
    try {
      const existingAddress = user?.addresses?.[0] || {};
      const payload = {
        fullName: profileName,
        addresses: [
          {
            ...existingAddress,
            fullName: profileName,
            phone: profilePhone,
          }
        ]
      };
      const response = await updateProfileService(payload);
      
      // Update local state in Zustand store
      setUser(response);
      toast.success("Cập nhật thông tin thành công!");
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Chức năng cập nhật thông tin sẽ sớm được hỗ trợ.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải chứa ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setLoading(true);
    try {
      await updatePasswordService({ currentPassword, newPassword });
      toast.success("Đổi mật khẩu thành công!");
      setIsPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Chức năng đổi mật khẩu chưa được hỗ trợ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Drawer Trigger (Hamburger Menu) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 shadow-sm md:hidden hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label="Toggle Navigation Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Backdrop Overlay */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 z-35 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`sticky top-0 flex h-screen flex-col border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100
          transition-all duration-300 ease-in-out z-40 shrink-0
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl
          ${collapsed ? "w-16 max-md:-translate-x-full" : "w-64 max-md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-slate-800 overflow-hidden">
          {collapsed ? (
            <img src={logo} alt="logo" className="h-8 w-8 object-contain" />
          ) : (
            <img
              src={logo}
              alt="WebFashion logo"
              className="h-15 w-auto object-contain"
            />
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex flex-1 flex-col gap-1 p-2 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition
                  ${collapsed ? "justify-center" : ""}
                  ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Collapse Button (Only on Desktop/Tablet) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center
            rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400
            shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer max-md:hidden"
          aria-label={collapsed ? "Mở sidebar" : "Thu sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Profile Card Section at Bottom */}
        <div className="mt-auto border-t border-gray-200 dark:border-slate-800 p-3 relative" ref={dropdownRef}>
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left
              ${collapsed ? "left-2 w-48" : "left-3 right-3"}`}
            >
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer"
              >
                <Key className="h-4 w-4 text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {/* Profile Clickable Area */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer
              ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? adminName : undefined}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs uppercase text-sm">
                {firstLetter}
              </div>
            )}

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {adminName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                  {displayRole}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* MODAL: THÔNG TIN CÁ NHÂN */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Thông tin cá nhân</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex flex-col items-center space-y-2 pb-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md uppercase text-2xl">
                    {firstLetter}
                  </div>
                )}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/55 text-indigo-600 dark:text-indigo-400">
                  {displayRole}
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              {/* Status Note */}
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                Hệ thống hỗ trợ cập nhật thông tin cá nhân trực tiếp.
              </p>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐỔI MẬT KHẨU */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Đổi mật khẩu</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-3.5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Xác nhận mật khẩu mới"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
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
                  disabled={loading}
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Đang đổi..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
