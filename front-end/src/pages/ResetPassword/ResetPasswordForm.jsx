import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const siteName = settings?.general?.siteName || "WebFashion";
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
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Email không đúng định dạng.";
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
    <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6 min-h-[44px]"
          type="button"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>
            {step === 3
              ? "Quay lại nhập OTP"
              : step === 2
              ? "Quay lại nhập email"
              : "Quay lại đăng nhập"}
          </span>
        </button>

        <header className="mb-8">
          <span className="atelier-eyebrow block mb-2">
            {siteName} · Bước {step}/3
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {step === 3 ? "Đặt mật khẩu mới" : "Khôi phục mật khẩu"}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
            {step === 1 &&
              "Nhập địa chỉ email đã đăng ký để nhận mã xác minh OTP khôi phục tài khoản."}
            {step === 2 &&
              `Mã OTP đã được gửi. Hãy kiểm tra hộp thư email ${email}.`}
            {step === 3 && `Thiết lập mật khẩu mới cho tài khoản ${email}.`}
          </p>
        </header>

        <div aria-live="polite" aria-atomic="true">
          {errors.general && (
            <div
              role="alert"
              className="mb-6 p-3 border border-[var(--color-danger)] text-[var(--color-danger)] text-xs font-medium"
            >
              {errors.general}
            </div>
          )}
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
              >
                Email tài khoản
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                placeholder="example@gmail.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "reset-email-error" : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border transition-colors focus:outline-none ${
                  errors.email
                    ? "border-[var(--color-danger)]"
                    : "border-[var(--color-border)] focus:border-[var(--color-text)]"
                }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p
                  id="reset-email-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[var(--color-danger)]"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    className="animate-spin h-4 w-4"
                    aria-hidden="true"
                  />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                "Gửi mã xác minh OTP"
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="reset-otp"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
              >
                Mã xác minh OTP
              </label>
              <input
                id="reset-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                placeholder="Nhập 6 chữ số OTP"
                maxLength={6}
                aria-invalid={Boolean(errors.otp)}
                aria-describedby={errors.otp ? "reset-otp-error" : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm font-mono tracking-widest bg-[var(--color-bg)] border transition-colors focus:outline-none ${
                  errors.otp
                    ? "border-[var(--color-danger)]"
                    : "border-[var(--color-border)] focus:border-[var(--color-text)]"
                }`}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  if (errors.otp) {
                    setErrors((prev) => ({ ...prev, otp: null }));
                  }
                }}
                disabled={isSubmitting}
              />
              {errors.otp && (
                <p
                  id="reset-otp-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[var(--color-danger)]"
                >
                  {errors.otp}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    className="animate-spin h-4 w-4"
                    aria-hidden="true"
                  />
                  <span>Đang xác thực OTP...</span>
                </>
              ) : (
                "Xác nhận mã OTP"
              )}
            </button>

            {/* Gửi lại OTP Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-2">
              <span className="text-[var(--color-text-muted)]">
                Không nhận được mã?
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 font-medium min-h-[44px] px-2 text-[var(--color-text)] underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isResending ? "Đang gửi lại…" : "Gửi lại mã"}</span>
              </button>
              {!canResend && (
                <span className="font-mono text-[11px] px-2 py-1 border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {countdown}s
                </span>
              )}
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-5">
            {/* New Password Field */}
            <div>
              <label
                htmlFor="reset-new-password"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
              >
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby={
                    errors.newPassword ? "reset-new-password-error" : undefined
                  }
                  className={`w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-sm bg-[var(--color-bg)] border transition-colors focus:outline-none ${
                    errors.newPassword
                      ? "border-[var(--color-danger)]"
                      : "border-[var(--color-border)] focus:border-[var(--color-text)]"
                  }`}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors((prev) => ({ ...prev, newPassword: null }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p
                  id="reset-new-password-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[var(--color-danger)]"
                >
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
              >
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu mới"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? "reset-confirm-password-error"
                      : undefined
                  }
                  className={`w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-sm bg-[var(--color-bg)] border transition-colors focus:outline-none ${
                    errors.confirmPassword
                      ? "border-[var(--color-danger)]"
                      : "border-[var(--color-border)] focus:border-[var(--color-text)]"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="reset-confirm-password-error"
                  role="alert"
                  className="mt-1.5 text-xs text-[var(--color-danger)]"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    className="animate-spin h-4 w-4"
                    aria-hidden="true"
                  />
                  <span>Đang đặt lại mật khẩu...</span>
                </>
              ) : (
                "Khôi phục mật khẩu"
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
          Nhớ mật khẩu của bạn?{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--color-text)] underline underline-offset-4 ml-1 inline-flex items-center min-h-[44px]"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
