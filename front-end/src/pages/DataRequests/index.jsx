import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Shield, ArrowLeft, Download, Ban, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import privacyApi from "@/api/privacyApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const unwrap = (response) => response?.data?.data || response?.data || response;

export default function DataRequests() {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`Quản lý quyền dữ liệu cá nhân — ${siteName}`);
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const loadRequests = () =>
    privacyApi
      .getDataRequests()
      .then((response) => setRequests(unwrap(response) || []))
      .catch(() => {});

  useEffect(() => {
    loadRequests();
  }, []);

  const requirePassword = () => {
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại để xác thực an toàn.");
      return false;
    }
    return true;
  };

  const download = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `du-lieu-ca-nhan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    if (!requirePassword()) return;
    try {
      setLoading(true);
      const res = await privacyApi.exportPersonalData(currentPassword);
      download(unwrap(res));
      toast.success("Xuất dữ liệu cá nhân JSON thành công!");
      setCurrentPassword("");
      loadRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xuất dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const request = async (type) => {
    if (!requirePassword()) return;
    if (
      type === "ERASURE" &&
      !window.confirm(
        "Cảnh báo: Dữ liệu tài khoản của bạn sẽ được ẩn danh hóa và bạn sẽ bị đăng xuất ngay lập tức. Bạn có chắc chắn muốn tiếp tục?"
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      await privacyApi.submitDataRequest({ type, currentPassword, reason });
      toast.success(
        type === "ERASURE"
          ? "Tài khoản của bạn đã được ẩn danh hóa an toàn."
          : "Yêu cầu quyền dữ liệu đã được ghi nhận."
      );
      setCurrentPassword("");
      setReason("");
      loadRequests();
      if (type === "ERASURE") navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xử lý yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="mb-6">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Trở về tài khoản cá nhân</span>
          </Link>
        </div>

        <section className="mx-auto max-w-2xl border border-border bg-card p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 border border-border px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase mb-4">
            <Shield size={13} strokeWidth={1.5} />
            <span>Quyền kiểm soát dữ liệu cá nhân · GDPR/PDPA</span>
          </div>

          <h1 className="font-condensed text-3xl sm:text-4xl font-bold uppercase tracking-tight text-foreground">
            Quản Lý Dữ Liệu Cá Nhân
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
            Mật khẩu hiện tại đóng vai trò xác thực lại danh tính trước khi xử lý các thao tác dữ liệu nhạy cảm.
            Lưu ý: Các dữ liệu giao dịch đơn hàng cần lưu trữ theo nghĩa vụ kế toán pháp luật sẽ được ẩn danh hóa thay vì xóa bỏ hoàn toàn.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Mật khẩu hiện tại <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu để xác thực"
                autoComplete="current-password"
                className="w-full border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Lý do yêu cầu (không bắt buộc)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ghi chú thêm về lý do hoặc phạm vi yêu cầu..."
                className="w-full border border-border bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-foreground"
              />
            </div>

            <div className="pt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={exportData}
                className="btn-cta inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-4 py-3 text-xs font-semibold uppercase tracking-wider text-background transition-all hover:bg-transparent hover:text-foreground cursor-pointer"
              >
                <Download size={14} />
                <span>Xuất dữ liệu JSON</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => request("RESTRICT")}
                className="btn-cta inline-flex items-center justify-center gap-2 border border-border bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground transition-all hover:border-foreground cursor-pointer"
              >
                <Ban size={14} />
                <span>Hạn chế xử lý dữ liệu</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => request("OBJECT")}
                className="btn-cta inline-flex items-center justify-center gap-2 border border-border bg-card px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground transition-all hover:border-foreground cursor-pointer"
              >
                <AlertTriangle size={14} />
                <span>Phản đối xử lý tiếp thị</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => request("ERASURE")}
                className="btn-cta inline-flex items-center justify-center gap-2 border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-destructive transition-all hover:bg-destructive hover:text-white cursor-pointer"
              >
                <AlertTriangle size={14} />
                <span>Ẩn danh hóa tài khoản</span>
              </button>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <h2 className="font-condensed text-lg font-bold uppercase tracking-wide text-foreground mb-4">
              Lịch sử các yêu cầu đã gửi
            </h2>

            {requests.length > 0 ? (
              <ul className="space-y-2.5" role="list">
                {requests.map((item) => (
                  <li
                    key={item._id || item.id}
                    className="flex flex-wrap items-center justify-between border border-border bg-background/50 p-3.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <span className="font-bold uppercase tracking-wider text-foreground">
                        {item.type}
                      </span>
                      <span className="text-muted-foreground">· {item.status}</span>
                    </div>
                    <time className="text-muted-foreground font-mono text-[11px]">
                      {new Date(item.requested_at || Date.now()).toLocaleString("vi-VN")}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có yêu cầu nào được ghi nhận.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
