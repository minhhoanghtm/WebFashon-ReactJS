import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/auth.store';
import { updateProfileService } from '@/services/user.service';
import AdminModal from './AdminModal';

export const AdminProfileModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBirthday, setProfileBirthday] = useState('');
  const [profileGender, setProfileGender] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setProfileName(user.fullName || user.name || '');
      const phone = user.addresses?.[0]?.phone || user.phone || '';
      setProfilePhone(phone);
      setProfileBirthday(user.birthday ? user.birthday.slice(0, 10) : '');
      setProfileGender(user.gender || 'other');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Họ và tên không được để trống!');
      return;
    }
    if (profilePhone && !/^[0-9]{9,11}$/.test(profilePhone)) {
      toast.error('Số điện thoại không hợp lệ (9–11 chữ số)!');
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
            birthday: profileBirthday,
            gender: profileGender,
          },
        ],
      };
      const response = await updateProfileService(payload);
      setUser(response);
      toast.success('Cập nhật thông tin thành công!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin cá nhân.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Thông tin cá nhân"
      description="Cập nhật hồ sơ tài khoản quản trị của bạn"
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="admin-profile-form"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#05251C] hover:bg-[#073D2A] dark:bg-[#F5DD20] dark:text-[#05251C] dark:hover:bg-[#e6cf1d] disabled:opacity-50 rounded-xl shadow-xs transition cursor-pointer"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <form id="admin-profile-form" onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 focus:border-[#05251C] dark:focus:border-[#F5DD20] text-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full h-10 px-3 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            placeholder="0912345678"
            className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 focus:border-[#05251C] dark:focus:border-[#F5DD20] text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày sinh
            </label>
            <input
              type="date"
              value={profileBirthday}
              onChange={(e) => setProfileBirthday(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 focus:border-[#05251C] dark:focus:border-[#F5DD20] text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Giới tính
            </label>
            <select
              value={profileGender}
              onChange={(e) => setProfileGender(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#05251C]/20 dark:focus:ring-[#F5DD20]/30 focus:border-[#05251C] dark:focus:border-[#F5DD20] text-slate-800 dark:text-slate-100"
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
      </form>
    </AdminModal>
  );
};

export default AdminProfileModal;
