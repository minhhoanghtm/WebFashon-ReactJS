import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Shield,
  Lock,
  Unlock,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getAllUsersApi, updateUserApi } from '../../api/adminUserApi';
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

const UserManagement = () => {
  useDocumentTitle('Quản lý người dùng — 404Studio Admin');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals States
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);

  // Add Admin state
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState([]);
  const [selectedAdminCandidate, setSelectedAdminCandidate] = useState(null);
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllUsersApi();
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        const errData = await response.json();
        const errMsg =
          typeof errData === 'string'
            ? errData
            : errData?.message || `Không thể tải danh sách tài khoản (Mã: ${response.status})`;
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Không thể kết nối đến máy chủ API người dùng.');
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter candidates for Add Admin
  const handleSearchAdminCandidate = (q) => {
    setAdminSearchQuery(q);
    if (!q.trim()) {
      setAdminSearchResults([]);
      return;
    }
    const query = q.toLowerCase();
    const results = users.filter((u) => {
      const name = (u.fullName || u.name || u.userName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return (name.includes(query) || email.includes(query)) && u.role !== 'admin';
    });
    setAdminSearchResults(results);
  };

  const handleConfirmAddAdmin = async () => {
    if (!selectedAdminCandidate) return;
    setAddAdminLoading(true);
    try {
      const response = await updateUserApi(selectedAdminCandidate._id, {
        ...selectedAdminCandidate,
        role: 'admin',
      });
      if (response.ok) {
        toast.success(
          `Đã nâng cấp "${selectedAdminCandidate.fullName || selectedAdminCandidate.email
          }" lên Quản trị viên!`
        );
        fetchUsers();
        setIsAddAdminModalOpen(false);
        setAdminSearchQuery('');
        setAdminSearchResults([]);
        setSelectedAdminCandidate(null);
      } else {
        const errData = await response.json();
        toast.error(errData.message || 'Không thể nâng cấp tài khoản.');
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi nâng cấp tài khoản.');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleLockAccount = async (targetUser) => {
    if (targetUser.role === 'admin') {
      toast.error('Không thể khóa tài khoản có vai trò Quản trị viên!');
      return;
    }

    const isCurrentlyActive = targetUser.status === 'active';
    const action = isCurrentlyActive ? 'khóa' : 'mở khóa';
    const newStatus = isCurrentlyActive ? 'blocked' : 'active';

    const result = await Swal.fire({
      title: `Bạn muốn ${action} tài khoản này?`,
      text: isCurrentlyActive
        ? 'Người dùng sẽ tạm thời không thể đăng nhập vào hệ thống.'
        : 'Người dùng sẽ có thể đăng nhập và mua sắm lại bình thường.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isCurrentlyActive ? '#DC2626' : '#16A34A',
      cancelButtonColor: '#64748B',
      confirmButtonText: isCurrentlyActive ? 'Đồng ý khóa' : 'Mở khóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        const response = await updateUserApi(targetUser._id, {
          ...targetUser,
          status: newStatus,
        });
        if (response.ok) {
          toast.success(`Đã ${action} tài khoản thành công!`);
          fetchUsers();
        } else {
          const errData = await response.json();
          toast.error(errData.message || `Không thể ${action} tài khoản.`);
        }
      } catch {
        toast.error(`Đã xảy ra lỗi khi ${action} tài khoản.`);
      }
    }
  };

  // Metrics
  const totalUsersCount = users.length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsersCount = users.filter(
    (u) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo
  ).length;
  const activeCount = users.filter((u) => u.status === 'active' || !u.status).length;
  const blockedCount = users.filter((u) => u.status === 'blocked').length;

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const name = (u.fullName || u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || u.addresses?.[0]?.phone || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      name.includes(query) || email.includes(query) || phone.includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return u.status === 'active' || !u.status;
    if (activeFilter === 'blocked') return u.status === 'blocked';
    if (activeFilter === 'admin') return u.role === 'admin';
    if (activeFilter === 'customer') return !u.role || u.role === 'user';

    return true;
  });

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <AdminPageHeader
        title="Quản lý người dùng"
        description="Theo dõi danh sách khách hàng, tài khoản nhân sự và phân quyền quản trị viên"
        breadcrumbs={[{ label: 'Người dùng' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchUsers}
              aria-label="Làm mới danh sách"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsAddAdminModalOpen(true)}
              className="flex items-center gap-2 bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] text-white font-semibold text-xs px-4 h-10 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Shield className="h-4 w-4" />
              <span>Thêm Quản trị viên</span>
            </button>
          </div>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng số tài khoản
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalUsersCount}
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Khách mới (30 ngày)
            </span>
            <div className="text-2xl font-extrabold text-[#05251C] dark:text-[#F5DD20] tabular-nums">
              {newUsersCount}
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] border border-[#05251C]/20 dark:border-[#F5DD20]/30 flex items-center justify-center shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đang hoạt động
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {activeCount}
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tài khoản bị khóa
            </span>
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
              {blockedCount}
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Content Table Card */}
      <AdminCard noPadding>
        {/* Filters Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Hoạt động' },
              { id: 'blocked', label: 'Bị khóa' },
              { id: 'admin', label: 'Quản trị viên' },
              { id: 'customer', label: 'Khách hàng' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFilter(f.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeFilter === f.id
                  ? 'bg-[#05251C] text-white dark:bg-[#F5DD20] dark:text-[#05251C] shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30"
            />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>
            <button
              onClick={fetchUsers}
              className="text-xs font-bold text-[#05251C] dark:text-[#F5DD20] hover:underline"
            >
              Tải lại trang
            </button>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="Không tìm thấy người dùng"
            description={
              searchQuery
                ? `Không có tài khoản nào phù hợp với từ khóa "${searchQuery}".`
                : 'Chưa có dữ liệu người dùng trong hệ thống.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Người dùng</th>
                    <th className="px-6 py-3.5">Số điện thoại</th>
                    <th className="px-6 py-3.5 text-center">Vai trò</th>
                    <th className="px-6 py-3.5 text-center">Trạng thái</th>
                    <th className="px-6 py-3.5">Ngày tham gia</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {paginatedUsers.map((u) => {
                    const name = u.fullName || u.name || u.userName || 'Chưa cập nhật';
                    const email = u.email || 'Chưa có email';
                    const phone = u.phone || u.addresses?.[0]?.phone || '—';
                    const role = u.role || 'user';
                    const status = u.status || 'active';
                    const initial = name.charAt(0).toUpperCase();

                    return (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Avatar & Name */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar_url || u.avatar ? (
                              <img
                                src={u.avatar_url || u.avatar}
                                alt={name}
                                className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                                {initial}
                              </div>
                            )}
                            <div className="truncate max-w-xs">
                              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                          {phone}
                        </td>

                        {/* Role */}
                        <td className="px-6 py-3.5 text-center">
                          {role === 'admin' ? (
                            <AdminBadge variant="primary" dot size="sm">
                              Quản trị viên
                            </AdminBadge>
                          ) : role === 'staff' ? (
                            <AdminBadge variant="info" dot size="sm">
                              Nhân viên
                            </AdminBadge>
                          ) : (
                            <AdminBadge variant="neutral" size="sm">
                              Khách hàng
                            </AdminBadge>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3.5 text-center">
                          {status === 'blocked' ? (
                            <AdminBadge variant="danger" dot size="sm">
                              Bị khóa
                            </AdminBadge>
                          ) : (
                            <AdminBadge variant="success" dot size="sm">
                              Hoạt động
                            </AdminBadge>
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setIsDetailModalOpen(true);
                              }}
                              aria-label={`Xem hồ sơ ${name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              title="Xem thông tin chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {role !== 'admin' && (
                              <button
                                onClick={() => handleLockAccount(u)}
                                aria-label={status === 'blocked' ? `Mở khóa ${name}` : `Khóa ${name}`}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${status === 'blocked'
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                                  }`}
                                title={status === 'blocked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {status === 'blocked' ? (
                                  <Unlock className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </button>
                            )}
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
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </AdminCard>

      {/* User Details Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Thông tin tài khoản"
          description={`Mã tài khoản: ${selectedUser._id}`}
          size="md"
          footer={
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#05251C]/10 text-[#05251C] dark:bg-[#F5DD20]/15 dark:text-[#F5DD20] font-bold text-base">
                {(selectedUser.fullName || selectedUser.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedUser.fullName || selectedUser.name || 'Chưa đặt tên'}
                </h4>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Số điện thoại</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedUser.phone || selectedUser.addresses?.[0]?.phone || 'Chưa cung cấp'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Vai trò</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {selectedUser.role || 'user'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Địa chỉ giao hàng mặc định</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {selectedUser.addresses?.[0]
                  ? `${selectedUser.addresses[0].address_detail || ''}, ${selectedUser.addresses[0].ward || ''}, ${selectedUser.addresses[0].district || ''}, ${selectedUser.addresses[0].city || ''}`
                  : 'Chưa lưu địa chỉ'}
              </p>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Add Admin Modal */}
      <AdminModal
        isOpen={isAddAdminModalOpen}
        onClose={() => {
          setIsAddAdminModalOpen(false);
          setAdminSearchQuery('');
          setAdminSearchResults([]);
          setSelectedAdminCandidate(null);
        }}
        title="Thêm Quản trị viên mới"
        description="Tìm kiếm người dùng hiện có trong hệ thống và phân quyền Quản trị viên (Admin)"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsAddAdminModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              disabled={!selectedAdminCandidate || addAdminLoading}
              onClick={handleConfirmAddAdmin}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
            >
              {addAdminLoading ? 'Đang cấp quyền...' : 'Xác nhận cấp quyền Admin'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tìm kiếm tài khoản (Nhập tên hoặc email)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập email ứng viên..."
                value={adminSearchQuery}
                onChange={(e) => handleSearchAdminCandidate(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Candidates Results */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500">Kết quả tìm kiếm:</span>
            {adminSearchResults.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {adminSearchResults.map((candidate) => {
                  const isSelected = selectedAdminCandidate?._id === candidate._id;
                  return (
                    <button
                      key={candidate._id}
                      type="button"
                      onClick={() => setSelectedAdminCandidate(candidate)}
                      className={`w-full p-2.5 flex items-center justify-between text-left transition cursor-pointer ${isSelected
                        ? 'bg-[#05251C]/10 dark:bg-[#F5DD20]/15 border-l-4 border-[#05251C] dark:border-[#F5DD20]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {candidate.fullName || candidate.name || 'Người dùng'}
                        </div>
                        <div className="text-[11px] text-slate-400">{candidate.email}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#05251C] dark:text-[#F5DD20]">
                        {isSelected ? '✓ Đã chọn' : 'Chọn'}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : adminSearchQuery ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Không tìm thấy tài khoản phù hợp hoặc đã là Admin.
              </p>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                Gõ email hoặc tên người dùng để tìm kiếm ứng viên.
              </p>
            )}
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default UserManagement;
