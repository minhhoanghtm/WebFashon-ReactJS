import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { AdminModal } from "./AdminModal";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";

function AdminProfileForm({ user, setUser, onClose }) {
  const [profileName, setProfileName] = useState(
    () => user?.fullname || user?.fullName || user?.name || ""
  );
  const [profilePhone, setProfilePhone] = useState(
    () => user?.phone_number || user?.phone || ""
  );
  const [profileGender, setProfileGender] = useState(
    () => user?.gender || "other"
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!profileName.trim()) {
      nextErrors.fullname = "Vui lòng nhập họ và tên quản trị viên.";
    }
    if (
      profilePhone.trim() &&
      !/^(0|\+84)[0-9]{8,10}$/.test(profilePhone.trim())
    ) {
      nextErrors.phone = "Số điện thoại không đúng định dạng.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const res = await userApi.updateProfile({
        fullname: profileName.trim(),
        phone_number: profilePhone.trim(),
        gender: profileGender,
      });
      if (res?.data) {
        setUser({ ...user, ...res.data });
      }
      toast.success("Cập nhật hồ sơ quản trị viên thành công.");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-xs" noValidate>
      <div>
        <label
          htmlFor="admin-profile-email"
          className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
        >
          Email tài khoản (Cố định)
        </label>
        <input
          id="admin-profile-email"
          type="email"
          disabled
          value={user?.email || ""}
          className="h-11 w-full cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text-muted)]"
        />
      </div>

      <div>
        <label
          htmlFor="admin-profile-fullname"
          className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
        >
          Họ và tên <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="admin-profile-fullname"
          type="text"
          value={profileName}
          onChange={(e) => {
            setProfileName(e.target.value);
            if (errors.fullname) {
              setErrors((prev) => ({ ...prev, fullname: "" }));
            }
          }}
          placeholder="Nhập họ và tên hiển thị..."
          className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
        />
        {errors.fullname && (
          <p
            role="alert"
            aria-live="polite"
            className="mt-1 text-[11px] text-[var(--color-danger)]"
          >
            {errors.fullname}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="admin-profile-phone"
            className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
          >
            Số điện thoại
          </label>
          <input
            id="admin-profile-phone"
            type="tel"
            value={profilePhone}
            onChange={(e) => {
              setProfilePhone(e.target.value);
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: "" }));
              }
            }}
            placeholder="09xx xxx xxx"
            className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
          />
          {errors.phone && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-[var(--color-danger)]"
            >
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="admin-profile-gender"
            className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
          >
            Giới tính
          </label>
          <select
            id="admin-profile-gender"
            value={profileGender}
            onChange={(e) => setProfileGender(e.target.value)}
            className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="touch-target border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={saving}
          className="touch-target inline-flex items-center gap-2 bg-[var(--color-text)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
        </button>
      </div>
    </form>
  );
}

export function AdminProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuthStore();

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Hồ sơ Quản trị viên"
      subtitle="Cập nhật thông tin định danh tài khoản quản trị"
      size="md"
    >
      {isOpen && (
        <AdminProfileForm
          key={user?._id || user?.id || "admin-profile"}
          user={user}
          setUser={setUser}
          onClose={onClose}
        />
      )}
    </AdminModal>
  );
}

export default AdminProfileModal;
