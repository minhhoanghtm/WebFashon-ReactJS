import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { AdminModal } from "./AdminModal";
import { userApi } from "@/api/user.api";

export function AdminPasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const resetAndClose = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    onClose?.();
  };

  const validate = () => {
    const nextErrors = {};
    if (!oldPassword) {
      nextErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại.";
    }
    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu mới phải có tối thiểu 6 ký tự.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Xác nhận mật khẩu mới không khớp.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      await userApi.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Đổi mật khẩu quản trị viên thành công.");
      resetAndClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Đổi mật khẩu bảo mật"
      subtitle="Thiết lập mật khẩu mới để bảo vệ tài khoản quản trị"
      size="md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs" noValidate>
        <div>
          <label
            htmlFor="admin-old-password"
            className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
          >
            Mật khẩu hiện tại <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="admin-old-password"
            type="password"
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              if (errors.oldPassword) {
                setErrors((prev) => ({ ...prev, oldPassword: "" }));
              }
            }}
            placeholder="Nhập mật khẩu hiện tại..."
            className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
          />
          {errors.oldPassword && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-[var(--color-danger)]"
            >
              {errors.oldPassword}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="admin-new-password"
            className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
          >
            Mật khẩu mới <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="admin-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) {
                setErrors((prev) => ({ ...prev, newPassword: "" }));
              }
            }}
            placeholder="Tối thiểu 6 ký tự..."
            className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
          />
          {errors.newPassword && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-[var(--color-danger)]"
            >
              {errors.newPassword}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="admin-confirm-password"
            className="mb-1.5 block font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
          >
            Xác nhận mật khẩu mới{" "}
            <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="admin-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            }}
            placeholder="Nhập lại mật khẩu mới..."
            className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 text-xs text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none"
          />
          {errors.confirmPassword && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-1 text-[11px] text-[var(--color-danger)]"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            onClick={resetAndClose}
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
            <span>{saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</span>
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

export default AdminPasswordModal;
