import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Edit2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  forgotPasswordOtpService,
  resetPasswordWithOtpService,
  resendOtpService,
} from "@/services/auth.service";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const RESEND_COOLDOWN = 60;

const maskIdentifierDisplay = (val = "") => {
  const clean = val.trim();
  if (clean.includes("@")) {
    const [name, domain] = clean.split("@");
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  }
  const digits = clean.replace(/\D/g, "");
  if (digits.length < 9) return clean;
  const last2 = digits.slice(-2);
  let prefix = digits.slice(0, 3);
  if (digits.startsWith("84")) prefix = "+84 " + digits.slice(2, 4);
  else if (digits.startsWith("0")) prefix = "+84 " + digits.slice(1, 3);
  return `${prefix}*** ***${last2}`;
};

const calculatePasswordStrength = (pw = "") => {
  if (!pw) return { score: 0, label: "", color: "bg-border" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;

  if (score <= 2) return { score: 1, label: "Yếu", color: "bg-destructive" };
  if (score === 3) return { score: 2, label: "Trung bình", color: "bg-amber-500" };
  return { score: 3, label: "Mạnh", color: "bg-emerald-500" };
};

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

  // Step 1: Identifier -> Step 2: OTP -> Step 3: New Password
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const pwStrength = calculatePasswordStrength(newPassword);

  useEffect(() => {
    if (step !== 2 || countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrors({ identifier: "Vui lòng nhập số điện thoại hoặc email." });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await forgotPasswordOtpService({ identifier: cleanId });
      const display = res?.data?.identifier || maskIdentifierDisplay(cleanId);
      setMaskedTarget(display);
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setStep(2);
      toast.success(res?.message || "Nếu thông tin hợp lệ, mã OTP đã được gửi.");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Không thể gửi mã khôi phục lúc này.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Confirm OTP & move to Step 3
  const handleProceedToPassword = (code) => {
    const targetOtp = code || otp;
    if (!targetOtp || targetOtp.length < 6) {
      setErrors({ otp: "Vui lòng nhập đủ 6 chữ số mã OTP." });
      return;
    }
    setErrors({});
    setStep(3);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    try {
      setIsResending(true);
      setErrors({});
      const res = await resendOtpService({
        identifier: identifier.trim(),
        purpose: "reset_password",
      });
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setOtp("");
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi lại mã lúc này.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    const nextErrors = {};
    if (!newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới.";
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = "Mật khẩu mới phải có tối thiểu 8 ký tự.";
    } else if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      nextErrors.newPassword = "Mật khẩu phải bao gồm cả chữ cái và chữ số.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPasswordWithOtpService({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      toast.success("Đặt lại mật khẩu thành công! Toàn bộ phiên cũ đã được đăng xuất.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col justify-center px-4 py-6 sm:px-8 lg:col-span-6 lg:h-full lg:overflow-hidden lg:px-12 lg:py-4 xl:px-16 bg-background text-foreground">
      <div className="auth-form-content mx-auto w-full max-w-md space-y-4 lg:space-y-3">
        <button
          type="button"
          onClick={() => {
            if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else navigate("/login");
          }}
          className="group inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>
            {step === 3
              ? "Quay lại nhập mã OTP"
              : step === 2
              ? "Quay lại đổi tài khoản"
              : "Quay lại đăng nhập"}
          </span>
        </button>

        <header className="space-y-1 border-b border-border pb-3 lg:pb-2.5">
          <p className="text-[10px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · BẢO MẬT TÀI KHOẢN
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground uppercase sm:text-4xl leading-[1.15]">
            {step === 1
              ? "Quên mật khẩu"
              : step === 2
              ? "Xác minh mã OTP"
              : "Tạo mật khẩu mới"}
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            {step === 1 && "Nhập số điện thoại hoặc email đã đăng ký để nhận mã OTP khôi phục."}
            {step === 2 && `Nhập mã 6 chữ số đã được gửi tới ${maskedTarget || identifier}`}
            {step === 3 && "Thiết lập mật khẩu mới an toàn gồm chữ cái và số."}
          </p>
        </header>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          <span className={`px-2 py-0.5 border ${step >= 1 ? "border-foreground text-foreground font-bold" : "border-border"}`}>
            1. Tài khoản
          </span>
          <span>→</span>
          <span className={`px-2 py-0.5 border ${step >= 2 ? "border-foreground text-foreground font-bold" : "border-border"}`}>
            2. Mã OTP
          </span>
          <span>→</span>
          <span className={`px-2 py-0.5 border ${step === 3 ? "border-foreground text-foreground font-bold" : "border-border"}`}>
            3. Mật khẩu mới
          </span>
        </div>

        {errors.general && (
          <div
            role="alert"
            className="flex items-start gap-2.5 border border-destructive bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ── BƯỚC 1: NHẬP SĐT HOẶC EMAIL ─────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} noValidate className="space-y-3.5 lg:space-y-3">
            <div>
              <label
                htmlFor="forgot-identifier"
                className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Số điện thoại hoặc Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="forgot-identifier"
                type="text"
                autoComplete="username"
                placeholder="0912345678 hoặc name@example.com"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrors((prev) => ({ ...prev, identifier: null, general: null }));
                }}
                disabled={isSubmitting}
                className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                  errors.identifier ? "border-destructive" : "border-border"
                }`}
              />
              {errors.identifier && (
                <p className="mt-1 text-[10px] font-medium text-destructive">{errors.identifier}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>ĐANG GỬI MÃ OTP...</span>
                </>
              ) : (
                <span>GỬI MÃ OTP KHÔI PHỤC</span>
              )}
            </button>
          </form>
        )}

        {/* ── BƯỚC 2: NHẬP MÃ OTP ─────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="border border-border p-3 bg-muted/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase text-muted-foreground">Mã gửi đến</p>
                <p className="text-xs font-semibold font-mono text-foreground">{maskedTarget}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                <Edit2 size={12} />
                <span>Đổi</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
                Nhập mã 6 chữ số <span aria-hidden="true">*</span>
              </label>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setErrors((prev) => ({ ...prev, otp: null }));
                }}
                onComplete={(code) => handleProceedToPassword(code)}
                disabled={isSubmitting}
                hasError={Boolean(errors.otp)}
                autoFocus={true}
              />
              {errors.otp && (
                <p role="alert" className="mt-1 text-[11px] font-medium text-destructive">
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground font-mono">
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Chưa nhận được mã?"}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
                className="inline-flex min-h-[40px] items-center gap-1 font-semibold text-foreground underline underline-offset-4 hover:opacity-80 disabled:opacity-40 disabled:no-underline"
              >
                {isResending ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Đang gửi lại...</span>
                  </>
                ) : (
                  <span>Gửi lại mã OTP</span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleProceedToPassword(otp)}
              disabled={isSubmitting || otp.length < 6}
              className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>TIẾP TỤC ĐẶT MẬT KHẨU</span>
            </button>
          </div>
        )}

        {/* ── BƯỚC 3: THIẾT LẬP MẬT KHẨU MỚI ──────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate className="space-y-3.5 lg:space-y-3">
            <div>
              <label
                htmlFor="reset-newPassword"
                className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Mật khẩu mới <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="reset-newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 8 ký tự (chữ + số)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((p) => ({ ...p, newPassword: null, general: null }));
                  }}
                  disabled={isSubmitting}
                  className={`min-h-[42px] w-full border bg-background pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                    errors.newPassword ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ẩn" : "Hiện"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="h-1 flex-1 bg-border overflow-hidden">
                    <div
                      className={`h-full transition-all ${pwStrength.color}`}
                      style={{ width: `${(pwStrength.score / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {pwStrength.label}
                  </span>
                </div>
              )}
              {errors.newPassword && (
                <p className="mt-1 text-[10px] font-medium text-destructive">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="reset-confirmPassword"
                className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Xác nhận mật khẩu mới <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="reset-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((p) => ({ ...p, confirmPassword: null, general: null }));
                  }}
                  disabled={isSubmitting}
                  className={`min-h-[42px] w-full border bg-background pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                    errors.confirmPassword ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ẩn" : "Hiện"}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[10px] font-medium text-destructive">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="p-2.5 bg-muted/20 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-foreground" />
              <span>Đổi mật khẩu sẽ tự động đăng xuất tài khoản trên tất cả các thiết bị khác.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>ĐANG ĐẶT LẠI MẬT KHẨU...</span>
                </>
              ) : (
                <span>LƯU MẬT KHẨU MỚI</span>
              )}
            </button>
          </form>
        )}

        <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground font-sans">
          Nhớ lại mật khẩu?{" "}
          <Link
            to="/login"
            className="inline-flex min-h-[40px] items-center font-semibold text-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          >
            Quay lại Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
