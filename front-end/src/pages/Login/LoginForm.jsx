import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { login, setUser } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

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
          navigate("/admin");
        } else {
          navigate("/");
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
    <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:col-span-6 lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-md space-y-7">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="touch-target -ml-2 inline-flex items-center gap-2 px-2 text-xs font-medium tracking-[0.16em] uppercase text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>Quay lại trang chủ</span>
        </button>

        <header className="space-y-2 border-b border-border pb-5">
          <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
            {siteName} · Tài khoản
          </p>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            Đăng nhập
          </h1>
          <p className="text-xs text-muted-foreground">
            Nhập thông tin định danh của bạn để truy cập hệ thống.
          </p>
        </header>

        <div aria-live="polite" aria-atomic="true">
          {errors.general && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border border-destructive/50 bg-destructive/10 p-3.5 text-xs text-destructive"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-[11px] font-semibold tracking-[0.16em] uppercase text-foreground"
            >
              Địa chỉ Email
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
              className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none disabled:opacity-50 ${
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
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-[11px] font-semibold tracking-[0.16em] uppercase text-foreground"
              >
                Mật khẩu
              </label>
              <Link
                to="/reset-password"
                className="text-[11px] font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
                placeholder="Nhập mật khẩu của bạn"
                value={formData.passWord}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.passWord)}
                aria-describedby={
                  errors.passWord ? "login-password-error" : undefined
                }
                className={`min-h-[44px] w-full border bg-background pl-3.5 pr-11 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none disabled:opacity-50 ${
                  errors.passWord ? "border-destructive" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="touch-target absolute top-1/2 right-1 -translate-y-1/2 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
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
            <label className="touch-target -my-2 inline-flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 cursor-pointer border-border accent-foreground"
              />
              <span className="text-xs text-muted-foreground">
                Ghi nhớ email đăng nhập
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center py-1">
          <div className="w-full border-t border-border" />
          <span className="bg-background px-3 text-[10px] tracking-[0.2em] uppercase text-muted-foreground shrink-0">
            Hoặc tiếp tục với
          </span>
          <div className="w-full border-t border-border" />
        </div>

        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="border-t border-border pt-5 text-center text-xs text-muted-foreground">
          Chưa có tài khoản tại {siteName}?{" "}
          <Link
            to="/register"
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
