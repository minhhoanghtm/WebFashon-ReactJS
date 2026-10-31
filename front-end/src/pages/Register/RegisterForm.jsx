import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  Phone,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { toast } from "react-toastify";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  sendRegisterOtpService,
  verifyRegisterService,
  resendOtpService,
} from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const RESEND_COOLDOWN = 60;

const initialFormData = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  passWord: "",
  confirmPassword: "",
};

// Mask Vietnamese phone for privacy display: +84 90*** ***67
const maskPhoneDisplay = (phone = "") => {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 9) return phone;
  const last2 = clean.slice(-2);
  let prefix = clean.slice(0, 3);
  if (clean.startsWith("84")) prefix = "+84 " + clean.slice(2, 4);
  else if (clean.startsWith("0")) prefix = "+84 " + clean.slice(1, 3);
  return `${prefix}*** ***${last2}`;
};

// Password strength calculation
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

const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

  const rawFrom = location.state?.from?.pathname || "/";
  const fromPath = ["/login", "/register", "/verify-otp", "/reset-password"].includes(rawFrom)
    ? "/"
    : rawFrom;

  // Step 1: Input details -> Step 2: OTP verification
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 OTP states
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");

  const pwStrength = calculatePasswordStrength(formData.passWord);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step !== 2 || countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null, general: null }));
  };

  const validateStep1 = () => {
    const nextErrors = {};
    const trimmedName = formData.fullName.trim();
    const cleanPhone = formData.phone.trim().replace(/\s+/g, "");

    if (!trimmedName) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    } else if (trimmedName.length < 2) {
      nextErrors.fullName = "Họ và tên phải có ít nhất 2 ký tự.";
    }

    if (!cleanPhone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^(0|\+?84)(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      nextErrors.phone = "Số điện thoại di động Việt Nam không hợp lệ (03x, 05x, 07x, 08x, 09x).";
    }

    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        nextErrors.email = "Địa chỉ email không đúng định dạng.";
      }
    }

    if (!formData.passWord) {
      nextErrors.passWord = "Vui lòng nhập mật khẩu.";
    } else if (formData.passWord.length < 8) {
      nextErrors.passWord = "Mật khẩu phải có tối thiểu 8 ký tự.";
    } else if (!/[a-zA-Z]/.test(formData.passWord) || !/\d/.test(formData.passWord)) {
      nextErrors.passWord = "Mật khẩu phải bao gồm cả chữ cái và chữ số.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
    } else if (formData.confirmPassword !== formData.passWord) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Vui lòng đồng ý với điều khoản sử dụng.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Submit Step 1: Send Register OTP to phone
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep1()) return;

    try {
      setIsSubmitting(true);
      const res = await sendRegisterOtpService({
        phone: formData.phone.trim(),
        channel: "sms",
      });

      const displayPhone = res?.data?.phone || maskPhoneDisplay(formData.phone);
      setMaskedPhone(displayPhone);
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setStep(2);
      toast.success("Mã OTP xác thực đã được gửi đến số điện thoại của bạn.");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Step 2: Verify OTP and Register user
  const handleVerifyAndRegister = async (otpCode) => {
    const code = otpCode || otp;
    if (!code || code.length < 6) {
      setErrors({ otp: "Vui lòng nhập đầy đủ 6 chữ số OTP." });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const payload = {
        phone: formData.phone.trim(),
        otp: code,
        fullName: formData.fullName.trim(),
        passWord: formData.passWord,
        email: formData.email.trim() || undefined,
        birthday: formData.dateOfBirth || undefined,
        sex: formData.gender || undefined,
      };

      const res = await verifyRegisterService(payload);
      const token = res?.data?.accessToken;

      if (token) {
        login(token);

        try {
          const userRes = await userApi.getMe();
          if (userRes?.success && userRes?.data) {
            setUser(userRes.data);
          }
        } catch (uErr) {
          console.error("Lỗi lấy thông tin tài khoản:", uErr);
        }

        toast.success("Đăng ký tài khoản thành công!");
        navigate(fromPath, { replace: true });
      } else {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      setErrors({ otp: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    try {
      setIsResending(true);
      setErrors({});
      const res = await resendOtpService({
        identifier: formData.phone.trim(),
        purpose: "register",
      });
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setOtp("");
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi lại OTP lúc này.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col justify-center px-4 py-6 sm:px-8 lg:col-span-7 lg:h-full lg:overflow-hidden lg:px-12 lg:py-4 xl:px-16 bg-background text-foreground">
      <div className="auth-form-content mx-auto w-full max-w-lg space-y-4 lg:space-y-3">
        <button
          type="button"
          onClick={() => (step === 2 ? setStep(1) : navigate("/"))}
          className="group inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>{step === 2 ? "Quay lại chỉnh sửa số điện thoại" : "Về trang chủ"}</span>
        </button>

        <header className="space-y-1 border-b border-border pb-3 lg:pb-3">
          <p className="text-[10px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · HỒ SƠ THÀNH VIÊN
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground uppercase sm:text-4xl leading-[1.15]">
            {step === 1 ? "Đăng ký tài khoản" : "Xác thực OTP"}
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            {step === 1
              ? "Tạo tài khoản để nhận đặc quyền thành viên và ưu đãi định kỳ."
              : `Nhập mã 6 chữ số đã được gửi tới ${maskedPhone || formData.phone}`}
          </p>
        </header>

        {errors.general && (
          <div
            role="alert"
            className="flex items-start gap-2.5 border border-destructive bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* ── BƯỚC 1: NHẬP THÔNG TIN ────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate className="space-y-3.5 lg:space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-2.5">
              <div>
                <label
                  htmlFor="reg-fullName"
                  className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                >
                  Họ và tên <span aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                    errors.fullName ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-[10px] font-medium text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-phone"
                  className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                >
                  Số điện thoại <span aria-hidden="true">*</span>
                </label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                    errors.phone ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-[10px] font-medium text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Địa chỉ Email <span className="text-muted-foreground font-normal">(Tùy chọn)</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                  errors.email ? "border-destructive" : "border-border"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-[10px] font-medium text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-2.5">
              <div>
                <label
                  htmlFor="reg-password"
                  className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                >
                  Mật khẩu <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    name="passWord"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự (chữ + số)"
                    value={formData.passWord}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`min-h-[42px] w-full border bg-background pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                      errors.passWord ? "border-destructive" : "border-border"
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
                {formData.passWord && (
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
                {errors.passWord && (
                  <p className="mt-1 text-[10px] font-medium text-destructive">{errors.passWord}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-confirmPassword"
                  className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                >
                  Xác nhận mật khẩu <span aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="reg-terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded-none border border-border accent-foreground"
              />
              <label htmlFor="reg-terms" className="text-[11px] text-muted-foreground cursor-pointer select-none">
                Tôi đồng ý với{" "}
                <Link to="/policy" className="underline underline-offset-4 text-foreground">
                  Điều khoản dịch vụ
                </Link>{" "}
                &{" "}
                <Link to="/policy" className="underline underline-offset-4 text-foreground">
                  Chính sách bảo mật
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-[10px] font-medium text-destructive">{errors.terms}</p>
            )}

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
                <span>TIẾP TỤC VỚI OTP SMS</span>
              )}
            </button>
          </form>
        )}

        {/* ── BƯỚC 2: XÁC THỰC MÃ OTP ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border border-border p-3.5 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Mã gửi đến</p>
                  <p className="text-xs font-semibold font-mono text-foreground">{maskedPhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                <Edit2 size={12} />
                <span>Đổi số</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
                Mã xác thực 6 chữ số <span aria-hidden="true">*</span>
              </label>
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  setErrors((prev) => ({ ...prev, otp: null }));
                }}
                onComplete={(code) => handleVerifyAndRegister(code)}
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
                {countdown > 0 ? (
                  `Gửi lại sau ${countdown}s`
                ) : (
                  "Chưa nhận được mã OTP?"
                )}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isResending}
                className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-foreground underline underline-offset-4 hover:opacity-80 disabled:opacity-40 disabled:no-underline"
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
              onClick={() => handleVerifyAndRegister(otp)}
              disabled={isSubmitting || otp.length < 6}
              className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>ĐANG XÁC THỰC...</span>
                </>
              ) : (
                <span>HOÀN TẤT ĐĂNG KÝ</span>
              )}
            </button>
          </div>
        )}

        {/* Hoặc tiếp tục với Google */}
        {step === 1 && (
          <>
            <div className="relative flex items-center justify-center py-0.5">
              <div className="w-full border-t border-border" />
              <span className="bg-background px-3 text-[10px] font-mono tracking-[0.24em] uppercase text-muted-foreground shrink-0">
                HOẶC
              </span>
              <div className="w-full border-t border-border" />
            </div>

            <div className="flex justify-center">
              <GoogleLoginButton />
            </div>
          </>
        )}

        <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground font-sans">
          Đã có tài khoản thành viên?{" "}
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center font-semibold text-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
