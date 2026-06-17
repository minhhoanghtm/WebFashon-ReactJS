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
import { getAllUsersApi, updateUserApi, addUserApi } from "../../api/adminUserApi";

// Rich Mock Customers Data for fallback
<<<<<<< HEAD
const mockCustomers = [
  {
    _id: "mock-1",
    fullName: "Lê Minh Hoàng",
    email: "hoanglm@gmail.com",
    phone: "0987654321",
    createdAt: "2026-05-10T08:30:00.000Z",
    status: "active",
    role: "admin",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Lê Minh Hoàng", phone: "0987654321", addressDetail: "12 Lý Tự Trọng", provinceCode: "TP. Hồ Chí Minh" }],
    orderCount: 15,
    totalSpend: 12500000,
  },
  {
    _id: "mock-2",
    fullName: "Nguyễn Thị Mai",
    email: "maiant@gmail.com",
    phone: "0912345678",
    createdAt: "2026-06-01T14:22:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Nguyễn Thị Mai", phone: "0912345678", addressDetail: "45 Lê Lợi", provinceCode: "Hà Nội" }],
    orderCount: 8,
    totalSpend: 4200000,
  },
  {
    _id: "mock-3",
    fullName: "Phạm Văn Nam",
    email: "nampv@gmail.com",
    phone: "0905123456",
    createdAt: "2026-05-20T10:15:00.000Z",
    status: "blocked",
    role: "user",
    avatar_url: "",
    addresses: [{ fullName: "Phạm Văn Nam", phone: "0905123456", addressDetail: "78 Hùng Vương", provinceCode: "Đà Nẵng" }],
    orderCount: 3,
    totalSpend: 1500000,
  },
  {
    _id: "mock-4",
    fullName: "Trần Anh Tuấn",
    email: "tuan.tran@gmail.com",
    phone: "0934567890",
    createdAt: "2026-06-05T09:12:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Trần Anh Tuấn", phone: "0934567890", addressDetail: "101 Trần Hưng Đạo", provinceCode: "Cần Thơ" }],
    orderCount: 12,
    totalSpend: 9800000,
  },
  {
    _id: "mock-5",
    fullName: "Hoàng Lê Vy",
    email: "vyhl@gmail.com",
    phone: "0978123456",
    createdAt: "2026-06-12T16:40:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Hoàng Lê Vy", phone: "0978123456", addressDetail: "15 Nguyễn Trãi", provinceCode: "Hà Nội" }],
    orderCount: 5,
    totalSpend: 2350000,
  },
  {
    _id: "mock-6",
    fullName: "Đỗ Quốc Bảo",
    email: "baodq@gmail.com",
    phone: "0868999888",
    createdAt: "2026-04-18T11:05:00.000Z",
    status: "active",
    role: "staff",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Đỗ Quốc Bảo", phone: "0868999888", addressDetail: "99 Cách Mạng Tháng 8", provinceCode: "TP. Hồ Chí Minh" }],
    orderCount: 0,
    totalSpend: 0,
  },
  {
    _id: "mock-7",
    fullName: "Vũ Phương Thảo",
    email: "thaovp@gmail.com",
    phone: "0945678912",
    createdAt: "2026-05-30T07:50:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    addresses: [{ fullName: "Vũ Phương Thảo", phone: "0945678912", addressDetail: "222 Kim Mã", provinceCode: "Hà Nội" }],
    orderCount: 7,
    totalSpend: 5400000,
  },
  {
    _id: "mock-8",
    fullName: "Phan Văn Đức",
    email: "ducpv@gmail.com",
    phone: "0915666777",
    createdAt: "2026-06-10T13:10:00.000Z",
    status: "blocked",
    role: "user",
    avatar_url: "",
    addresses: [],
    orderCount: 1,
    totalSpend: 450000,
  },
  {
    _id: "mock-9",
    fullName: "Nguyễn Hồng Nhung",
    email: "nhungnh@gmail.com",
    phone: "0933445566",
    createdAt: "2026-06-14T15:20:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "",
    addresses: [{ fullName: "Nguyễn Hồng Nhung", phone: "0933445566", addressDetail: "88 Điện Biên Phủ", provinceCode: "Đà Nẵng" }],
    orderCount: 2,
    totalSpend: 990000,
  },
  {
    _id: "mock-10",
    fullName: "Bùi Anh Tuấn",
    email: "tuanba@gmail.com",
    phone: "0988777666",
    createdAt: "2026-03-25T17:35:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "",
    addresses: [{ fullName: "Bùi Anh Tuấn", phone: "0988777666", addressDetail: "34 Nguyễn Hữu Thọ", provinceCode: "TP. Hồ Chí Minh" }],
    orderCount: 22,
    totalSpend: 24500000,
  },
  {
    _id: "mock-11",
    fullName: "Trần Thế Vinh",
    email: "vinhtt@gmail.com",
    phone: "0909111222",
    createdAt: "2026-06-03T11:45:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "",
    addresses: [{ fullName: "Trần Thế Vinh", phone: "0909111222", addressDetail: "56 Nguyễn Đình Chiểu", provinceCode: "TP. Hồ Chí Minh" }],
    orderCount: 4,
    totalSpend: 1800000,
  },
  {
    _id: "mock-12",
    fullName: "Đặng Thu Thảo",
    email: "thaodt@gmail.com",
    phone: "0922888999",
    createdAt: "2026-06-11T10:30:00.000Z",
    status: "active",
    role: "user",
    avatar_url: "",
    addresses: [{ fullName: "Đặng Thu Thảo", phone: "0922888999", addressDetail: "77 Lê Văn Sỹ", provinceCode: "TP. Hồ Chí Minh" }],
    orderCount: 9,
    totalSpend: 6200000,
  }
];
=======
const mockCustomers = [];
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
<<<<<<< HEAD
  
=======

>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Active Dropdown Action Menu ID
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Add User Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("admin");
  const [addGender, setAddGender] = useState("other");
  const [addDateOfBirth, setAddDateOfBirth] = useState("");

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
<<<<<<< HEAD
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setIsUsingMock(false);
        } else {
          setUsers(mockCustomers);
          setIsUsingMock(true);
        }
      } else {
        setUsers(mockCustomers);
        setIsUsingMock(true);
        console.warn("API returned error status. Using mock data fallback.");
      }
    } catch (err) {
      setUsers(mockCustomers);
      setIsUsingMock(true);
      console.error("Failed to load user list from API. Fallback to mock data:", err);
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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

<<<<<<< Updated upstream
  // Determine metadata presence in dataset
<<<<<<< HEAD
  const hasStatus = users.some((u) => u.status !== undefined && u.status !== null);
=======
  const hasStatus = users.some(
    (u) => u.status !== undefined && u.status !== null,
  );
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
  const hasRole = users.some((u) => u.role !== undefined && u.role !== null);
=======
  const hasStatus = true;
  const hasRole = true;
>>>>>>> Stashed changes

  // Calculations for Statistics Cards
  const totalUsersCount = users.length;
<<<<<<< HEAD
  
=======

>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
  // Calculate new users (registered in last 30 days)
  const getNewUsersCount = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
<<<<<<< HEAD
    return users.filter((u) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo).length;
=======
    return users.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo,
    ).length;
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
  };

  const newUsersCount = getNewUsersCount();
  const activeCount = users.filter((u) => u.status !== "blocked").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  const adminCount = users.filter((u) => u.role === "admin").length;
<<<<<<< HEAD
  const staffCount = users.filter((u) => u.role === "staff").length;
  const customerCount = users.filter((u) => !u.role || u.role === "user").length;
=======
  const customerCount = users.filter(
    (u) => !u.role || u.role === "user",
  ).length;
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde

  // Search and Filter Logic
  const filteredUsers = users.filter((u) => {
    const name = (u.fullName || u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
<<<<<<< HEAD
    const phone = (u.phone || (u.addresses?.[0]?.phone) || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query) || phone.includes(query);
=======
    const phone = (u.phone || u.addresses?.[0]?.phone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      name.includes(query) || email.includes(query) || phone.includes(query);
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde

    if (!matchesSearch) return false;

    if (activeFilter === "all") return true;
    if (activeFilter === "active" && hasStatus) return u.status !== "blocked";
    if (activeFilter === "blocked" && hasStatus) return u.status === "blocked";
    if (activeFilter === "admin" && hasRole) return u.role === "admin";
<<<<<<< HEAD
    if (activeFilter === "customer" && hasRole) return !u.role || u.role === "user";
=======
    if (activeFilter === "customer" && hasRole)
      return !u.role || u.role === "user";
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde

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
<<<<<<< HEAD
              : u
          )
=======
              : u,
          ),
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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

  const handleToggleBlock = async (user) => {
    const isCurrentlyBlocked = user.status === "blocked";
    const newStatus = isCurrentlyBlocked ? "active" : "blocked";
    const actionText = isCurrentlyBlocked ? "Mở khóa" : "Khóa";

    try {
      setSubmitLoading(true);
      const payload = {
        fullName: user.fullName || user.name || "",
        email: user.email || "",
        role: user.role || "user",
        status: newStatus,
        gender: user.sex || user.gender || "other",
        dateOfBirth: user.birthday || user.dateOfBirth || "",
        avatar_url: user.avatar_url || user.avatar || "",
        addresses: user.addresses || [],
      };

      const response = await updateUserApi(user._id, payload);
      if (response.ok) {
        toast.success(`${actionText} tài khoản thành công!`);
        fetchUsers();
      } else {
        const errData = await response.json();
        toast.error(errData.message || `Không thể ${actionText.toLowerCase()} tài khoản.`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Lỗi khi ${actionText.toLowerCase()} tài khoản.`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenAddUser = () => {
    setAddName("");
    setAddEmail("");
    setAddPhone("");
    setAddPassword("111111");
    setAddRole("admin");
    setAddGender("other");
    setAddDateOfBirth("");
    setIsAddModalOpen(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!addName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }
    if (!addEmail.trim()) {
      toast.error("Email không được để trống!");
      return;
    }
    if (addPhone && !/^[0-9]{9,11}$/.test(addPhone)) {
      toast.error("Số điện thoại không hợp lệ (yêu cầu 9 đến 11 chữ số)!");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        fullName: addName,
        email: addEmail,
        passWord: addPassword || "111111",
        role: addRole,
        gender: addGender,
        dateOfBirth: addDateOfBirth || null,
        addresses: addPhone ? [{ fullName: addName, phone: addPhone }] : [],
      };

      const response = await addUserApi(payload);
      if (response.ok) {
        toast.success("Thêm người dùng mới thành công!");
        setIsAddModalOpen(false);
        fetchUsers();
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Không thể tạo tài khoản mới.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi tạo tài khoản.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative pb-10">
      {/* Header */}
<<<<<<< Updated upstream
<<<<<<< HEAD
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Quản lý khách hàng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Quản lý thông tin và hoạt động của khách hàng trên hệ thống.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:-translate-y-0.5 transition cursor-pointer self-start sm:self-center"
        >
          <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl animate-pulse" />
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
              <p className="text-[10px] text-slate-400 font-medium">Đăng ký trong 30 ngày qua</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {hasStatus ? "Đang hoạt động" : "Nhân viên"}
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {hasStatus ? activeCount : staffCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 dark:border-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {hasStatus ? <UserCheck className="h-6 w-6" /> : <UserCheck2 className="h-6 w-6" />}
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
              {hasStatus ? <UserX className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </div>
          </div>
        </div>
=======
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Khách hàng</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
        </p>
=======
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Khách hàng</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Quản lý hoạt động kinh doanh thương mại điện tử thời trang của bạn
          </p>
        </div>
        <button
          onClick={handleOpenAddUser}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:-translate-y-0.5 transition cursor-pointer"
        >
          <Users className="h-4.5 w-4.5" />
          <span>Thêm người dùng</span>
        </button>
>>>>>>> Stashed changes
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
                Tổng tài khoản
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
                Khách hàng
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {customerCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/30 dark:border-emerald-900/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <UserCheck2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quản trị viên
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {adminCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex items-center justify-between transition duration-300">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tài khoản bị khóa
              </span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                {blockedCount}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <UserX className="h-6 w-6" />
            </div>
          </div>
        </div>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Chưa có khách hàng</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dữ liệu khách hàng sẽ hiển thị tại đây khi hệ thống ghi nhận người dùng.
=======
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              Chưa có khách hàng
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Dữ liệu khách hàng sẽ hiển thị tại đây khi hệ thống ghi nhận người
              dùng.
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                      <td colSpan={hasStatus ? 7 : 6} className="px-6 py-12 text-center text-slate-400 italic">
=======
                      <td
                        colSpan={hasStatus ? 7 : 6}
                        className="px-6 py-12 text-center text-slate-400 italic"
                      >
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                        Không tìm thấy khách hàng trùng khớp.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((u) => {
<<<<<<< HEAD
                      const name = u.fullName || u.name || u.userName || u.email || "Khách hàng";
                      const phone = u.phone || u.addresses?.[0]?.phone || "-";
                      const roleLabel = u.role === "admin" ? "Quản trị viên" : (u.role === "staff" ? "Nhân viên" : "Khách hàng");
                      const firstChar = name.charAt(0).toUpperCase();

                      return (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition">
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                            <span className="truncate max-w-[180px] block">{u.email}</span>
=======
                            <span className="truncate max-w-[180px] block">
                              {u.email}
                            </span>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                          </td>

                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-lg:hidden">
                            {phone}
                          </td>

                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-lg:hidden">
                            {formatDate(u.createdAt)}
                          </td>

                          {hasRole && (
                            <td className="px-6 py-4">
<<<<<<< HEAD
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${u.role === "admin"
                                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                  : u.role === "staff"
                                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"}`}
=======
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${
                                  u.role === "admin"
                                    ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                }`}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                              >
                                {roleLabel}
                              </span>
                            </td>
                          )}

                          {hasStatus && (
                            <td className="px-6 py-4">
<<<<<<< HEAD
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${u.status === "active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"}`}
                              >
                                {u.status === "active" ? "Hoạt động" : "Bị khóa"}
=======
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold leading-5
                                ${
                                  u.status !== "blocked"
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                {u.status !== "blocked"
                                  ? "Hoạt động"
                                  : "Bị khóa"}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                              </span>
                            </td>
                          )}

                          {/* Actions column with Dropdown Ellipsis Menu */}
                          <td className="px-6 py-4 text-center relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
<<<<<<< HEAD
                                setActiveActionMenuId(activeActionMenuId === u._id ? null : u._id);
=======
                                setActiveActionMenuId(
                                  activeActionMenuId === u._id ? null : u._id,
                                );
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                              }}
                              className="action-menu-trigger p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                              aria-label="More Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>

                            {activeActionMenuId === u._id && (
<<<<<<< HEAD
                              <div
                                className="action-dropdown-menu absolute right-6 top-10 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155"
                              >
=======
                              <div className="action-dropdown-menu absolute right-6 top-10 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155">
<<<<<<< Updated upstream
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
=======
                                {(!u.role || u.role === "user") && (
                                  <button
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleToggleBlock(u);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                                  >
                                    <Lock className="h-4 w-4 text-red-500" />
                                    <span>{u.status === "blocked" ? "Mở khóa TK" : "Khóa tài khoản"}</span>
                                  </button>
                                )}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
<<<<<<< HEAD
                                <button
=======
                                {/* <button
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenEdit(u);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 text-slate-400" />
                                  <span>Chỉnh sửa</span>
<<<<<<< HEAD
                                </button>
                                <button
=======
                                </button> */}
                                {/* <button
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenPassword(u);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
                                >
                                  <Key className="h-4 w-4 text-slate-400" />
                                  <span>Đổi mật khẩu</span>
<<<<<<< HEAD
                                </button>
=======
                                </button> */}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
=======
>>>>>>> Stashed changes
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
<<<<<<< HEAD
                const name = u.fullName || u.name || u.userName || u.email || "Khách hàng";
                const phone = u.phone || u.addresses?.[0]?.phone || "-";
                const roleLabel = u.role === "admin" ? "Quản trị viên" : (u.role === "staff" ? "Nhân viên" : "Khách hàng");
                const firstChar = name.charAt(0).toUpperCase();

                return (
                  <div key={u._id} className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs flex flex-col space-y-3 text-left relative transition duration-300">
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                          <span className="text-[10px] text-slate-400 font-semibold">{formatDate(u.createdAt)}</span>
=======
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {formatDate(u.createdAt)}
                          </span>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                        </div>
                      </div>

                      {/* Ellipsis menu button for Mobile card */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
<<<<<<< HEAD
                            setActiveActionMenuId(activeActionMenuId === u._id ? null : u._id);
=======
                            setActiveActionMenuId(
                              activeActionMenuId === u._id ? null : u._id,
                            );
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                          }}
                          className="action-menu-trigger p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                        >
                          <MoreHorizontal className="h-4.5 w-4.5" />
                        </button>

                        {activeActionMenuId === u._id && (
<<<<<<< HEAD
                          <div
                            className="action-dropdown-menu absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155"
                          >
=======
                          <div className="action-dropdown-menu absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-155">
<<<<<<< Updated upstream
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
=======
                            {(!u.role || u.role === "user") && (
                              <button
                                onClick={() => {
                                  setActiveActionMenuId(null);
                                  handleToggleBlock(u);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                              >
                                <Lock className="h-4 w-4 text-red-500" />
                                <span>{u.status === "blocked" ? "Mở khóa TK" : "Khóa tài khoản"}</span>
                              </button>
                            )}
>>>>>>> Stashed changes
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
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Email:</span>
<<<<<<< HEAD
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[190px]">{u.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Điện thoại:</span>
                        <span className="text-slate-700 dark:text-slate-300">{phone}</span>
=======
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[190px]">
                          {u.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Điện thoại:</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {phone}
                        </span>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      {hasRole && (
<<<<<<< HEAD
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                          ${u.role === "admin"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                            : u.role === "staff"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"}`}
                      >
                        {roleLabel}
                      </span>
                      )}

                      {hasStatus && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                          ${u.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"}`}
                      >
                        {u.status === "active" ? "Hoạt động" : "Bị khóa"}
                      </span>
=======
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
                            u.status !== "blocked"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {u.status !== "blocked" ? "Hoạt động" : "Bị khóa"}
                        </span>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} trong số {filteredUsers.length} khách hàng
=======
                Hiển thị {indexOfFirstItem + 1} -{" "}
                {Math.min(indexOfLastItem, filteredUsers.length)} trong số{" "}
                {filteredUsers.length} khách hàng
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

<<<<<<< HEAD
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                ))}
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde

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
<<<<<<< HEAD
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chi tiết khách hàng</h3>
=======
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Chi tiết khách hàng
              </h3>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  {(selectedUser.fullName || selectedUser.name || selectedUser.userName || selectedUser.email || "K").charAt(0).toUpperCase()}
=======
                  {(
                    selectedUser.fullName ||
                    selectedUser.name ||
                    selectedUser.userName ||
                    selectedUser.email ||
                    "K"
                  )
                    .charAt(0)
                    .toUpperCase()}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-800 dark:text-white truncate">
<<<<<<< HEAD
                  {selectedUser.fullName || selectedUser.name || selectedUser.userName || selectedUser.email || "Khách hàng"}
=======
                  {selectedUser.fullName ||
                    selectedUser.name ||
                    selectedUser.userName ||
                    selectedUser.email ||
                    "Khách hàng"}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  ID: {selectedUser._id}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {hasRole && (
<<<<<<< HEAD
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                      ${selectedUser.role === "admin"
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        : selectedUser.role === "staff"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"}`}
                    >
                      {selectedUser.role === "admin" ? "Quản trị viên" : (selectedUser.role === "staff" ? "Nhân viên" : "Khách hàng")}
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                    </span>
                  )}

                  {hasStatus && (
<<<<<<< HEAD
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                      ${selectedUser.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"}`}
                    >
                      {selectedUser.status === "active" ? "Hoạt động" : "Bị khóa"}
=======
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold leading-5
                      ${
                        selectedUser.status !== "blocked"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {selectedUser.status !== "blocked"
                        ? "Hoạt động"
                        : "Bị khóa"}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <span className="text-sm text-slate-800 dark:text-slate-200 break-all">{selectedUser.email}</span>
=======
                  <span className="text-sm text-slate-800 dark:text-slate-200 break-all">
                    {selectedUser.email}
                  </span>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="text-sm text-slate-800 dark:text-slate-200">
<<<<<<< HEAD
                    {selectedUser.phone || selectedUser.addresses?.[0]?.phone || "-"}
=======
                    {selectedUser.phone ||
                      selectedUser.addresses?.[0]?.phone ||
                      "-"}
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                      addr.provinceCode
                    ].filter(Boolean).join(", ");

                    return (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3 rounded-xl space-y-1 flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-800 dark:text-slate-100 font-bold">{addr.fullName} ({addr.phone})</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">{fullAddr || "Chưa cập nhật chi tiết"}</p>
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <p className="text-slate-400 italic">Chưa ghi nhận địa chỉ liên lạc.</p>
=======
                  <p className="text-slate-400 italic">
                    Chưa ghi nhận địa chỉ liên lạc.
                  </p>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                )}
              </div>

              <h5 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pt-2 pb-1">
                Hoạt động mua hàng
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 p-3.5 rounded-xl">
                  <ShoppingBag className="h-5 w-5 text-indigo-500" />
                  <div className="text-left font-bold">
<<<<<<< HEAD
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Đơn hàng hoàn tất</span>
                    <span className="text-base text-indigo-600 dark:text-indigo-400">
                      {selectedUser.orderCount !== undefined ? selectedUser.orderCount : 0} đơn
=======
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Đơn hàng hoàn tất
                    </span>
                    <span className="text-base text-indigo-600 dark:text-indigo-400">
                      {selectedUser.orderCount !== undefined
                        ? selectedUser.orderCount
                        : 0}{" "}
                      đơn
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/10 p-3.5 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div className="text-left font-bold">
<<<<<<< HEAD
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tổng chi tiêu</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                      {(selectedUser.totalSpend !== undefined ? selectedUser.totalSpend : 0).toLocaleString("vi-VN")} đ
=======
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Tổng chi tiêu
                    </span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                      {(selectedUser.totalSpend !== undefined
                        ? selectedUser.totalSpend
                        : 0
                      ).toLocaleString("vi-VN")}{" "}
                      đ
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sửa thông tin khách hàng</h3>
=======
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Sửa thông tin khách hàng
              </h3>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Họ và tên</label>
=======
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
=======
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email
                  </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</label>
=======
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Vai trò</label>
=======
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Vai trò
                    </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="user">Khách hàng</option>
<<<<<<< HEAD
                      <option value="staff">Nhân viên</option>
=======
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                )}

                {hasStatus && (
                  <div>
<<<<<<< HEAD
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Trạng thái</label>
=======
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Trạng thái
                    </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
=======
                  className="px-4.5 py-2 text-sm font-semibold text-black bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Thay đổi mật khẩu khách hàng</h3>
                <p className="text-xs text-slate-400 mt-0.5">Đặt lại mật khẩu cho tài khoản: <span className="font-bold text-slate-600 dark:text-slate-300">{passwordUser.fullName || passwordUser.name || passwordUser.email}</span></p>
=======
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
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mật khẩu mới</label>
=======
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Mật khẩu mới
                  </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Xác nhận mật khẩu mới</label>
=======
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Xác nhận mật khẩu mới
                  </label>
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
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
<<<<<<< HEAD
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
=======
                  className="px-4.5 py-2 text-sm font-semibold text-black bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
>>>>>>> f588986fa7ab26197632558656c2d6a4f0ae3fde
                >
                  {submitLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Thêm người dùng mới
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
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
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    placeholder="Nhập email"
                    required
                  />
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Giới tính
                    </label>
                    <select
                      value={addGender}
                      onChange={(e) => setAddGender(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="other">Khác</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      value={addDateOfBirth}
                      onChange={(e) => setAddDateOfBirth(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Số điện thoại (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
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
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="admin">Quản trị viên</option>
                      <option value="user">Khách hàng</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4.5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Đang tạo..." : "Thêm người dùng"}
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
