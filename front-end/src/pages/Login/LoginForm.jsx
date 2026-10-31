import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { loginService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { addCartItemService } from "@/services/cartItem.service";
import trackingService from "@/services/tracking.service";

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

  // Đường dẫn chuyển hướng trước đó hoặc mặc định "/"
  const fromPath = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState(() => ({
    email: localStorage.getItem("rememberedEmail") || "",
    passWord: "",
  }));
  const [rememberMe, setRememberMe] = useState(() =>
    Boolean(localStorage.getItem("rememberedEmail"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const blockedMsg = sessionStorage.getItem("blockedMessage");
    if (blockedMsg) {
      toast.error(blockedMsg);
      sessionStorage.removeItem("blockedMessage");
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: null,
      general: null,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Địa chỉ email không đúng định dạng.";
    }

    if (!formData.passWord) {
      nextErrors.passWord = "Vui lòng nhập mật khẩu.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginService({
        email: formData.email.trim(),
        passWord: formData.passWord,
      });
      const token = response?.data?.accessToken;
      if (token) {
        login(token);
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email.trim());
        } else {
          localStorage.removeItem("rememberedEmail");
        }

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

        // Khôi phục giỏ hàng chờ sau khi đăng nhập và phát add_to_cart nếu thành công
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
              trackingService.trackAddToCart(
                parsed.product,
                parsed.quantity || 1,
                parsed.variant
              );
            }
          } catch (restoreErr) {
            console.error(
              "Không thể khôi phục giỏ hàng sau đăng nhập:",
              restoreErr
            );
          }
        }

        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate(fromPath, { replace: true });
        }
      } else {
        toast.error("Đăng nhập thất bại: Không tìm thấy token xác thực.");
      }
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:col-span-6 lg:px-12 xl:px-16 bg-background text-foreground">
      <div className="mx-auto w-full max-w-md space-y-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="group inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" className="transition-transform group-hover:-translate-x-1" />
          <span>Về trang chủ</span>
        </button>

        <header className="space-y-2 border-b border-border pb-6">
          <p className="text-[11px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {siteName} · ĐỊNH DANH
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground uppercase sm:text-5xl">
            Đăng nhập
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Nhập thông tin xác thực để tiếp cận không gian quản lý đơn hàng.
          </p>
        </header>

        <div aria-live="polite" aria-atomic="true">
          {errors.general && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border border-destructive bg-destructive/10 p-3.5 text-xs text-destructive"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
            >
              Địa chỉ Email <span aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                errors.email ? "border-destructive" : "border-border"
              }`}
            />
            {errors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="mt-1.5 text-[11px] font-medium text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Mật khẩu <span aria-hidden="true">*</span>
              </label>
              <Link
                to="/reset-password"
                className="inline-flex min-h-[44px] items-center text-[11px] font-mono tracking-wider uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
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
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.passWord)}
                aria-describedby={
                  errors.passWord ? "login-password-error" : undefined
                }
                className={`min-h-[44px] w-full border bg-background pl-3.5 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.passWord ? "border-destructive" : "border-border"
                }`}
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
            {errors.passWord && (
              <p
                id="login-password-error"
                role="alert"
                className="mt-1.5 text-[11px] font-medium text-destructive"
              >
                {errors.passWord}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 cursor-pointer rounded-none border border-border accent-foreground"
              />
              <span className="font-sans">Ghi nhớ email trên thiết bị này</span>
            </label>
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
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>ĐĂNG NHẬP</span>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center py-2">
          <div className="w-full border-t border-border" />
          <span className="bg-background px-3 text-[10px] font-mono tracking-[0.24em] uppercase text-muted-foreground shrink-0">
            HOẶC TIẾP TỤC VỚI
          </span>
          <div className="w-full border-t border-border" />
        </div>

        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="border-t border-border pt-6 text-center text-xs text-muted-foreground font-sans">
          Chưa có tài khoản thành viên?{" "}
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center font-semibold text-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground"
          >
            Khởi tạo hồ sơ mới
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
