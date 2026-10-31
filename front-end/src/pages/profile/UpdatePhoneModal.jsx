import React, { useState, useEffect } from "react";
import { X, Phone, RefreshCw, LoaderCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  sendUpdatePhoneOtpService,
  verifyAndUpdatePhoneService,
  resendOtpService,
} from "@/services/auth.service";

const RESEND_COOLDOWN = 60;

export const UpdatePhoneModal = ({ isOpen, onClose, currentPhone, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: input phone, 2: input OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPhone("");
      setOtp("");
      setError("");
      setCountdown(RESEND_COOLDOWN);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    if (!cleanPhone) {
      setError("Vui lòng nhập số điện thoại mới.");
      return;
    }
    if (!/^(0|\+?84)(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      setError("Số điện thoại không đúng định dạng di động Việt Nam (03x, 05x, 07x, 08x, 09x).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await sendUpdatePhoneOtpService({ phone: cleanPhone });
      setMaskedPhone(res?.data?.phone || cleanPhone);
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setStep(2);
      toast.success("Mã OTP xác thực đã được gửi đến số điện thoại mới.");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Không thể gửi mã OTP xác thực số điện thoại.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    const targetOtp = code || otp;
    if (!targetOtp || targetOtp.length < 6) {
      setError("Vui lòng nhập đầy đủ 6 chữ số mã OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const cleanPhone = phone.trim().replace(/\s+/g, "");
      const res = await verifyAndUpdatePhoneService({
        phone: cleanPhone,
        otp: targetOtp,
      });

      toast.success("Cập nhật số điện thoại thành công!");
      if (onSuccess) onSuccess(res?.data || cleanPhone);
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    try {
      setIsResending(true);
      setError("");
      const cleanPhone = phone.trim().replace(/\s+/g, "");
      const res = await resendOtpService({
        identifier: cleanPhone,
        purpose: "verify_phone",
      });
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setOtp("");
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi lại mã OTP lúc này.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md border border-border bg-background p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-foreground" />
            <h2 id="phone-modal-title" className="font-display text-lg font-semibold uppercase tracking-wider">
              {currentPhone ? "Đổi số điện thoại" : "Thêm số điện thoại"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 border border-destructive bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Nhập số điện thoại di động Việt Nam mới. Hệ thống sẽ gửi mã OTP để xác thực quyền sở hữu.
            </p>

            <div>
              <label
                htmlFor="new-phone-input"
                className="mb-1.5 block text-[11px] font-semibold tracking-wider uppercase text-foreground"
              >
                Số điện thoại mới <span aria-hidden="true">*</span>
              </label>
              <input
                id="new-phone-input"
                type="tel"
                inputMode="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[44px] w-full border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 bg-foreground text-background text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    <span>Đang gửi mã...</span>
                  </>
                ) : (
                  <span>Gửi mã OTP</span>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="border border-border p-3 bg-muted/20 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground">Mã OTP gửi đến</p>
                <p className="font-semibold font-mono text-foreground">{maskedPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Đổi số
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-foreground">
                Nhập mã 6 chữ số <span aria-hidden="true">*</span>
              </label>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setError("");
                }}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={isSubmitting}
                hasError={Boolean(error)}
                autoFocus={true}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground font-mono">
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Chưa nhận được mã?"}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
                className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80 disabled:opacity-40"
              >
                {isResending ? "Đang gửi lại..." : "Gửi lại OTP"}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="min-h-[44px] px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => handleVerifyOtp(otp)}
                disabled={isSubmitting || otp.length < 6}
                className="min-h-[44px] px-5 bg-foreground text-background text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <span>Xác nhận cập nhật</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatePhoneModal;
