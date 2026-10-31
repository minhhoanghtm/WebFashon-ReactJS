import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, RefreshCw } from "lucide-react";
import {
  sendResetOTPService,
  verifyOTPService,
  resetPasswordService,
} from "@/services/auth.service";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const RESEND_COOLDOWN = 60; // 60 seconds

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Enter New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Resend OTP
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const canResend = countdown <= 0;

  // Countdown timer effect
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, step]);

  const validateStep1 = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Địa chỉ email không đúng định dạng.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    if (!otp.trim()) {
      nextErrors.otp = "Vui lòng nhập mã OTP.";
    } else if (otp.trim().length < 4) {
      nextErrors.otp = "Mã OTP phải có ít nhất 4 ký tự.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors = {};
    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep1()) return;

    try {
      setIsSubmitting(true);
      await sendResetOTPService({ email: email.trim() });
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setCountdown(RESEND_COOLDOWN);
      setStep(2);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.";
      setErrors({ email: msg });
      toast.error(err.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep2()) return;

    try {
      setIsSubmitting(true);
      await verifyOTPService({ email: email.trim(), otp: otp.trim() });
      toast.success("Xác thực OTP thành công!");
      setStep(3);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.";
      setErrors({ otp: msg });
      toast.error(err.response?.data?.message || "Xác thực OTP thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;
    try {
      setIsResending(true);
      setErrors({});
      await sendResetOTPService({ email: email.trim() });
      toast.success("Mã OTP mới đã được gửi đến email của bạn!");
      setOtp("");
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi lại mã OTP thất bại");
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep3()) return;

    try {
      setIsSubmitting(true);
      await resetPasswordService({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success("Khôi phục mật khẩu thành công!");
      navigate("/login");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Khôi phục mật khẩu thất bại. Vui lòng kiểm tra lại.";
      setErrors({ general: msg });
      toast.error(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setErrors({});
    } else if (step === 2) {
      setStep(1);
      setErrors({});
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:col-span-6 lg:px-12 xl:px-16 bg-background text-foreground">
      <div className="mx-auto w-full max-w-md space-y-8">
        <button
          onClick={handleBack}
          className="group inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          type="button"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>
            {step === 3
              ? "Quay lại nhập OTP"
              : step === 2
              ? "Quay lại nhập email"
              : "Quay lại đăng nhập"}
          </span>
        </button>

        <header className="space-y-2 border-b border-border pb-6">
          <p className="text-[11px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · BƯỚC {step}/3
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground uppercase sm:text-5xl">
            {step === 3 ? "Mật khẩu mới" : "Khôi phục mật khẩu"}
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            {step === 1 &&
              "Nhập địa chỉ email để nhận mã OTP khôi phục tài khoản cá nhân."}
            {step === 2 &&
              `Nhập mã OTP vừa được gửi về hộp thư ${email}.`}
            {step === 3 && `Thiết lập mật khẩu mới an toàn cho tài khoản ${email}.`}
          </p>
        </header>

        <div aria-live="polite" aria-atomic="true">
          {errors.general && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border border-destructive bg-destructive/10 p-3.5 text-xs text-destructive"
            >
              <span>{errors.general}</span>
            </div>
          )}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="reset-email"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Địa chỉ Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "reset-email-error" : undefined}
                className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.email ? "border-destructive" : "border-border"
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p
                  id="reset-email-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="group flex min-h-[46px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                <span>TIẾP TỤC GỬI MÃ OTP</span>
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="reset-otp"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Mã xác thực OTP <span aria-hidden="true">*</span>
              </label>
              <input
                id="reset-otp"
                name="otp"
                type="text"
                placeholder="Nhập mã OTP"
                aria-invalid={Boolean(errors.otp)}
                aria-describedby={errors.otp ? "reset-otp-error" : undefined}
                className={`min-h-[44px] w-full border bg-background px-3.5 text-center font-mono text-base font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.otp ? "border-destructive" : "border-border"
                }`}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                }}
                disabled={isSubmitting}
              />
              {errors.otp && (
                <p
                  id="reset-otp-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-sans">
                Chưa nhận được mã?
              </span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
                className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
              >
                {isResending ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Gửi lại mã {!canResend && `(${countdown}s)`}</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="group flex min-h-[46px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span>Đang xác minh...</span>
                </>
              ) : (
                <span>XÁC THỰC MÃ OTP</span>
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Mật khẩu mới <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby={
                    errors.newPassword ? "new-password-error" : undefined
                  }
                  className={`min-h-[44px] w-full border bg-background pl-3.5 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                    errors.newPassword ? "border-destructive" : "border-border"
                  }`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword)
                      setErrors((prev) => ({ ...prev, newPassword: null }));
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  className="touch-target absolute top-1/2 right-1 -translate-y-1/2 inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p
                  id="new-password-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Xác nhận mật khẩu mới <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-new-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-new-password-error"
                      : undefined
                  }
                  className={`min-h-[44px] w-full border bg-background pl-3.5 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                    errors.confirmPassword
                      ? "border-destructive"
                      : "border-border"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={isSubmitting}
                  className="touch-target absolute top-1/2 right-1 -translate-y-1/2 inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
                  aria-label={
                    showConfirmPassword
                      ? "Ẩn mật khẩu xác nhận"
                      : "Hiện mật khẩu xác nhận"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirm-new-password-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="group flex min-h-[46px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-3.5 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  <span>Đang lưu mật khẩu...</span>
                </>
              ) : (
                <span>LƯU MẬT KHẨU MỚI</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;
