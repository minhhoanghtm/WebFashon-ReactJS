import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, AlertCircle } from "lucide-react";
import { sendOTPServive } from "@/services/auth.service";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const initialFormData = {
  fullName: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  passWord: "",
  confirmPassword: "",
};

const splitFullName = (fullName) => {
  const normalizedName = fullName.trim().replace(/\s+/g, " ");
  const nameParts = normalizedName.split(" ");
  const firstName = nameParts.pop() || normalizedName;
  const lastName = nameParts.length > 0 ? nameParts.join(" ") : normalizedName;

  return { firstName, lastName };
};

const normalizeBackendMessage = (error) => {
  const rawMessage = error?.response?.data?.message || error?.message || "";
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(" ")
    : String(rawMessage);
  const comparableMessage = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    comparableMessage.includes("email") &&
    (comparableMessage.includes("exist") ||
      comparableMessage.includes("already") ||
      comparableMessage.includes("ton tai") ||
      comparableMessage.includes("da duoc su dung"))
  ) {
    return "Email đã tồn tại.";
  }

  if (
    (comparableMessage.includes("phone") ||
      comparableMessage.includes("so dien thoai")) &&
    (comparableMessage.includes("exist") ||
      comparableMessage.includes("already") ||
      comparableMessage.includes("ton tai") ||
      comparableMessage.includes("da duoc su dung"))
  ) {
    return "Số điện thoại đã tồn tại.";
  }

  return message || "Không thể tạo tài khoản. Vui lòng thử lại.";
};

const RegisterForm = () => {
  const navigate = useNavigate();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";

  const [formData, setFormData] = useState(initialFormData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleTermsChange = (event) => {
    setAcceptedTerms(event.target.checked);
    setErrors((prev) => ({
      ...prev,
      terms: null,
      general: null,
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const email = formData.email.trim();

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Vui lòng nhập họ và tên.";
    }

    if (!email) {
      nextErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không đúng định dạng.";
    }

    if (!formData.dateOfBirth) {
      nextErrors.dateOfBirth = "Vui lòng chọn ngày sinh.";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      if (dob > minAge) {
        nextErrors.dateOfBirth = "Bạn phải từ đủ 18 tuổi trở lên.";
      }
    }

    if (!formData.gender) {
      nextErrors.gender = "Vui lòng chọn giới tính.";
    }

    if (!formData.passWord) {
      nextErrors.passWord = "Vui lòng nhập mật khẩu.";
    } else if (formData.passWord.length < 6) {
      nextErrors.passWord = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận lại mật khẩu.";
    } else if (formData.confirmPassword !== formData.passWord) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Vui lòng đồng ý với điều khoản và chính sách bảo mật.";
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

    const { firstName, lastName } = splitFullName(formData.fullName);
    const nextFormData = {
      email: formData.email.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      passWord: formData.passWord,
      confirmPassword: formData.confirmPassword,
      firstName,
      lastName,
    };

    try {
      setIsSubmitting(true);
      await sendOTPServive({
        email: nextFormData.email,
      });
      navigate("/verify-otp", { state: { formData: nextFormData } });
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const msg = normalizeBackendMessage(error);
      if (msg === "Email đã tồn tại.") {
        setErrors({ email: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:col-span-7 lg:px-12 xl:px-16 bg-background text-foreground">
      <div className="mx-auto w-full max-w-lg space-y-8">
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
            {siteName} · HỒ SƠ THÀNH VIÊN
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground uppercase sm:text-5xl">
            Đăng ký tài khoản
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Hoàn thiện thông tin để nhận mã xác thực một lần (OTP) bảo mật.
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

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="reg-fullName"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
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
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? "reg-fullName-error" : undefined
                }
                className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.fullName ? "border-destructive" : "border-border"
                }`}
              />
              {errors.fullName && (
                <p
                  id="reg-fullName-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="sm:col-span-2">
              <label
                htmlFor="reg-email"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Địa chỉ Email <span aria-hidden="true">*</span>
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
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "reg-email-error" : undefined}
                className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.email ? "border-destructive" : "border-border"
                }`}
              />
              {errors.email && (
                <p
                  id="reg-email-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="reg-dateOfBirth"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Ngày sinh <span aria-hidden="true">*</span>
              </label>
              <input
                id="reg-dateOfBirth"
                name="dateOfBirth"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={
                  errors.dateOfBirth ? "reg-dob-error" : undefined
                }
                className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.dateOfBirth ? "border-destructive" : "border-border"
                }`}
              />
              {errors.dateOfBirth && (
                <p
                  id="reg-dob-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="reg-gender"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Giới tính <span aria-hidden="true">*</span>
              </label>
              <select
                id="reg-gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={
                  errors.gender ? "reg-gender-error" : undefined
                }
                className={`min-h-[44px] w-full border bg-background px-3.5 text-xs text-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                  errors.gender ? "border-destructive" : "border-border"
                }`}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              {errors.gender && (
                <p
                  id="reg-gender-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-passWord"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
              >
                Mật khẩu <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-passWord"
                  name="passWord"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.passWord}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.passWord)}
                  aria-describedby={
                    errors.passWord ? "reg-password-error" : undefined
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
                  id="reg-password-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.passWord}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirmPassword"
                className="mb-2 block text-[11px] font-semibold tracking-[0.2em] uppercase text-foreground"
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
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={
                    errors.confirmPassword
                      ? "reg-confirm-password-error"
                      : undefined
                  }
                  className={`min-h-[44px] w-full border bg-background pl-3.5 pr-12 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none disabled:opacity-50 ${
                    errors.confirmPassword
                      ? "border-destructive"
                      : "border-border"
                  }`}
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
                  id="reg-confirm-password-error"
                  role="alert"
                  className="mt-1.5 text-[11px] font-medium text-destructive"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Terms Checkbox */}
          <div>
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2.5 select-none text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={handleTermsChange}
                disabled={isSubmitting}
                className="h-4 w-4 cursor-pointer rounded-none border border-border accent-foreground"
              />
              <span className="font-sans">
                Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của {siteName}
              </span>
            </label>
            {errors.terms && (
              <p
                role="alert"
                className="mt-1 text-[11px] font-medium text-destructive"
              >
                {errors.terms}
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
                <span>Đang gửi mã xác thực OTP...</span>
              </>
            ) : (
              <span>TIẾP TỤC XÁC THỰC OTP</span>
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
          Đã sở hữu tài khoản?{" "}
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
