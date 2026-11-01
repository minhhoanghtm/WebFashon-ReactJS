import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  Phone,
  KeyRound,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { toast } from "react-toastify";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  loginService,
  sendLoginOtpService,
  verifyLoginOtpService,
  resendOtpService,
} from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { addCartItemService } from "@/services/cartItem.service";
import trackingService from "@/services/tracking.service";

const RESEND_COOLDOWN = 60;

const maskPhoneDisplay = (phone = "") => {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 9) return phone;
  const last2 = clean.slice(-2);
  let prefix = clean.slice(0, 3);
  if (clean.startsWith("84")) prefix = "+84 " + clean.slice(2, 4);
  else if (clean.startsWith("0")) prefix = "+84 " + clean.slice(1, 3);
  return `${prefix}*** ***${last2}`;
};

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

  const rawFrom = location.state?.from?.pathname || "/";
  const fromPath = ["/login", "/register", "/verify-otp", "/reset-password"].includes(rawFrom)
    ? "/"
    : rawFrom;

  // Login Mode: "password" (Email/Phone + PW) or "otp" (Phone + SMS OTP)
  const [loginMode, setLoginMode] = useState("password");

  // Password Login state
  const [formData, setFormData] = useState(() => ({
    identifier: localStorage.getItem("rememberedEmail") || "",
    passWord: "",
  }));
  const [rememberMe, setRememberMe] = useState(() =>
    Boolean(localStorage.getItem("rememberedEmail"))
  );
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login state
  const [otpPhone, setOtpPhone] = useState("");
  const [otpStep, setOtpStep] = useState(1); // 1: input phone, 2: input OTP
  const [loginOtp, setLoginOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const blockedMsg = sessionStorage.getItem("blockedMessage");
    if (blockedMsg) {
      toast.error(blockedMsg);
      sessionStorage.removeItem("blockedMessage");
    }
  }, []);

  // Countdown timer for OTP login
  useEffect(() => {
    if (loginMode !== "otp" || otpStep !== 2 || countdown <= 0) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loginMode, otpStep, countdown]);

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "email" || name === "identifier") {
        next.identifier = value;
        next.email = value;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: null, general: null }));
  };

  const handleAfterLoginSuccess = async (token) => {
    login(token);

    let userRole = "";
    try {
      const userRes = await userApi.getMe();
      if (userRes?.success && userRes?.data) {
        setUser(userRes.data);
        userRole = userRes.data.role || userRes.data.data?.role || "";
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông tin user sau khi đăng nhập:", err);
    }

    toast.success("Đăng nhập thành công!");

    // Khôi phục giỏ hàng chờ sau khi đăng nhập
    const pendingCart = sessionStorage.getItem("pending_add_to_cart");
    if (pendingCart && userRole !== "admin") {
      try {
        sessionStorage.removeItem("pending_add_to_cart");
        const parsed = JSON.parse(pendingCart);
        const addRes = await addCartItemService({
          product_id: parsed.productId,
          variant_id: parsed.variantId,
          quantity: parsed.quantity || 1,
          price: parsed.product?.new_price || parsed.product?.price || 0,
        });
        if (addRes && addRes.success !== false) {
          trackingService.trackAddToCart(parsed.product, parsed.quantity || 1, parsed.variant);
        }
      } catch (restoreErr) {
        console.error("Không thể khôi phục giỏ hàng sau đăng nhập:", restoreErr);
      }
    }

    if (userRole === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate(fromPath, { replace: true });
    }
  };

  // ── Password Login Submit ────────────────────────────────────────────────
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const nextErrors = {};
    const trimmedIdentifier = formData.identifier.trim();

    if (!trimmedIdentifier) {
      nextErrors.identifier = "Vui lòng nhập Email hoặc Số điện thoại.";
    }

    if (!formData.passWord) {
      nextErrors.passWord = "Vui lòng nhập mật khẩu.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);
      const payload = isEmail
        ? { email: trimmedIdentifier, passWord: formData.passWord }
        : { phone: trimmedIdentifier, emailOrPhone: trimmedIdentifier, passWord: formData.passWord };


      const response = await loginService(payload);
      const token = response?.data?.accessToken;

      if (token) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", trimmedIdentifier);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        await handleAfterLoginSuccess(token);
      } else {
        toast.error("Đăng nhập thất bại: Không tìm thấy token xác thực.");
      }
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập và mật khẩu.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP Login Step 1: Send Login OTP ─────────────────────────────────────
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    const cleanPhone = otpPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      setErrors({ phone: "Vui lòng nhập số điện thoại." });
      return;
    }
    if (!/^(0|\+?84)(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      setErrors({ phone: "Số điện thoại di động không hợp lệ (03x, 05x, 07x, 08x, 09x)." });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await sendLoginOtpService({ phone: cleanPhone });
      setMaskedPhone(res?.data?.phone || maskPhoneDisplay(cleanPhone));
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setOtpStep(2);
      toast.success("Mã OTP đăng nhập đã được gửi đến số điện thoại của bạn.");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Không thể gửi mã OTP đăng nhập.";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP Login Step 2: Verify Login OTP ───────────────────────────────────
  const handleVerifyLoginOtp = async (otpCode) => {
    const code = otpCode || loginOtp;
    if (!code || code.length < 6) {
      setErrors({ otp: "Vui lòng nhập đầy đủ 6 chữ số OTP." });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      const cleanPhone = otpPhone.trim().replace(/\s+/g, "");
      const res = await verifyLoginOtpService({
        phone: cleanPhone,
        otp: code,
      });

      const token = res?.data?.accessToken;
      if (token) {
        await handleAfterLoginSuccess(token);
      } else {
        toast.error("Đăng nhập thất bại: Thiếu token xác thực.");
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

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    if (countdown > 0 || isResending) return;
    try {
      setIsResending(true);
      setErrors({});
      const cleanPhone = otpPhone.trim().replace(/\s+/g, "");
      const res = await resendOtpService({
        identifier: cleanPhone,
        purpose: "login",
      });
      setCountdown(res?.data?.cooldown || RESEND_COOLDOWN);
      setLoginOtp("");
      toast.success("Mã OTP mới đã được gửi!");
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể gửi lại mã lúc này.";
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col justify-center px-4 py-6 sm:px-8 lg:col-span-6 lg:h-full lg:overflow-hidden lg:px-12 lg:py-4 xl:px-16 bg-background text-foreground">
      <div className="auth-form-content mx-auto w-full max-w-md space-y-4 lg:space-y-3">
        <button
          type="button"
          onClick={() => (loginMode === "otp" && otpStep === 2 ? setOtpStep(1) : navigate("/"))}
          className="group inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>{loginMode === "otp" && otpStep === 2 ? "Quay lại đổi số điện thoại" : "Về trang chủ"}</span>
        </button>

        <header className="space-y-1 border-b border-border pb-3 lg:pb-2.5">
          <p className="text-[10px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · ĐỊNH DANH
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground uppercase sm:text-4xl leading-[1.15]">
            Đăng nhập
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Tiếp cận không gian quản lý đơn hàng và ưu đãi dành riêng cho bạn.
          </p>
        </header>

        {/* Tab Switcher: Mật khẩu vs SMS OTP */}
        <div className="grid grid-cols-2 border border-border p-0.5 bg-muted/20">
          <button
            type="button"
            onClick={() => {
              setLoginMode("password");
              setErrors({});
            }}
            className={`min-h-[40px] flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase transition-all ${
              loginMode === "password"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <KeyRound size={13} />
            <span>MẬT KHẨU</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("otp");
              setErrors({});
            }}
            className={`min-h-[40px] flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase transition-all ${
              loginMode === "otp"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone size={13} />
            <span>MÃ OTP SMS</span>
          </button>
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

        {/* ── MODE 1: PASSWORD LOGIN (EMAIL OR PHONE) ─────────────────────── */}
        {loginMode === "password" && (
          <form onSubmit={handlePasswordLoginSubmit} noValidate className="space-y-3.5 lg:space-y-3">
            <div>
              <label
                htmlFor="login-identifier"
                className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Email hoặc Số điện thoại <span aria-hidden="true">*</span>
              </label>
              <input
                id="login-identifier"
                name="email"
                type="text"
                autoComplete="username"
                placeholder="0912345678 hoặc name@example.com"
                value={formData.identifier}
                onChange={handlePasswordInputChange}
                disabled={isSubmitting}
                className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                  errors.identifier ? "border-destructive" : "border-border"
                }`}
              />
              {errors.identifier && (
                <p className="mt-1 text-[10px] font-medium text-destructive">{errors.identifier}</p>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                >
                  Mật khẩu <span aria-hidden="true">*</span>
                </label>
                <Link
                  to="/reset-password"
                  className="inline-flex min-h-[36px] items-center text-[10px] font-mono tracking-wider uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="passWord"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={formData.passWord}
                  onChange={handlePasswordInputChange}
                  disabled={isSubmitting}
                  className={`min-h-[42px] w-full border bg-background pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                    errors.passWord ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ẩn" : "Hiện"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.passWord && (
                <p className="mt-1 text-[10px] font-medium text-destructive">{errors.passWord}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 select-none text-xs text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 cursor-pointer rounded-none border border-border accent-foreground"
                />
                <span className="font-sans text-[11px]">Ghi nhớ thông tin</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>ĐANG XÁC THỰC...</span>
                </>
              ) : (
                <span>ĐĂNG NHẬP</span>
              )}
            </button>
          </form>
        )}

        {/* ── MODE 2: OTP LOGIN VIA SMS ───────────────────────────────────── */}
        {loginMode === "otp" && (
          <div className="space-y-3.5 lg:space-y-3">
            {otpStep === 1 && (
              <form onSubmit={handleSendLoginOtp} noValidate className="space-y-3.5 lg:space-y-3">
                <div>
                  <label
                    htmlFor="otp-phone"
                    className="mb-1 block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground"
                  >
                    Số điện thoại đã đăng ký <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="otp-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0912345678"
                    value={otpPhone}
                    onChange={(e) => {
                      setOtpPhone(e.target.value);
                      setErrors((prev) => ({ ...prev, phone: null, general: null }));
                    }}
                    disabled={isSubmitting}
                    className={`min-h-[42px] w-full border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none ${
                      errors.phone ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-[10px] font-medium text-destructive">{errors.phone}</p>
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
                    <span>GỬI MÃ OTP ĐĂNG NHẬP</span>
                  )}
                </button>
              </form>
            )}

            {otpStep === 2 && (
              <div className="space-y-3.5">
                <div className="border border-border p-3 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">Mã OTP gửi đến</p>
                      <p className="text-xs font-semibold font-mono text-foreground">{maskedPhone}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    <Edit2 size={12} />
                    <span>Đổi số</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-foreground">
                    Nhập mã 6 chữ số <span aria-hidden="true">*</span>
                  </label>
                  <OtpInput
                    value={loginOtp}
                    onChange={(val) => {
                      setLoginOtp(val);
                      setErrors((prev) => ({ ...prev, otp: null }));
                    }}
                    onComplete={(code) => handleVerifyLoginOtp(code)}
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
                    onClick={handleResendLoginOtp}
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
                  onClick={() => handleVerifyLoginOtp(loginOtp)}
                  disabled={isSubmitting || loginOtp.length < 6}
                  className="group flex min-h-[44px] w-full items-center justify-center gap-2 border border-foreground bg-foreground px-5 py-3 text-xs font-semibold tracking-[0.24em] uppercase text-background transition-all hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      <span>ĐANG XÁC THỰC...</span>
                    </>
                  ) : (
                    <span>XÁC THỰC VÀ ĐĂNG NHẬP</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── GOOGLE LOGIN ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center py-0.5">
          <div className="w-full border-t border-border" />
          <span className="bg-background px-3 text-[10px] font-mono tracking-[0.24em] uppercase text-muted-foreground shrink-0">
            HOẶC TIẾP TỤC VỚI
          </span>
          <div className="w-full border-t border-border" />
        </div>

        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground font-sans">
          Chưa có tài khoản thành viên?{" "}
          <Link
            to="/register"
            className="inline-flex min-h-[40px] items-center font-semibold text-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          >
            Khởi tạo hồ sơ mới
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
