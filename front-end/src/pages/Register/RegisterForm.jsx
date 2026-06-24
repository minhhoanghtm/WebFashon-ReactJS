import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { sendOTPServive } from "@/services/auth.service";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="currentColor"
    />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.807-5.974 6.807H2.882l7.432-8.491L1.227 2.25h6.836l4.713 6.231 5.45-6.231zM17.002 18.807h1.646L6.154 4.556H4.382l12.62 14.251z"
      fill="currentColor"
    />
  </svg>
);

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
  const message = Array.isArray(rawMessage) ? rawMessage.join(" ") : String(rawMessage);
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
    (comparableMessage.includes("phone") || comparableMessage.includes("so dien thoai")) &&
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
  const [formData, setFormData] = useState(initialFormData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isFormIncomplete = 
    !formData.fullName.trim() ||
    !formData.email.trim() ||
    !formData.dateOfBirth ||
    !formData.gender ||
    !formData.passWord ||
    !formData.confirmPassword ||
    !acceptedTerms;
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
      nextErrors.fullName = "Vui lòng nhập họ tên.";
    }

    if (!email) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không đúng định dạng.";
    }

    if (!formData.dateOfBirth) {
      nextErrors.dateOfBirth = "Vui lòng nhập ngày sinh.";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 10);
      if (dob > minAge) {
        nextErrors.dateOfBirth = "Bạn phải ít nhất 10 tuổi.";
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
      nextErrors.confirmPassword = "Vui lòng nhập lại mật khẩu.";
    } else if (formData.confirmPassword !== formData.passWord) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Vui lòng đồng ý với điều khoản sử dụng.";
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

      // Nếu lỗi liên quan đến email đã tồn tại → hiển thị thẳng dưới field email
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
    <div className="register-form-section">
      <div className="register-form-container">
        <button
          onClick={() => navigate("/")}
          className="register-back-btn"
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Quay lại trang chủ</span>
        </button>

        <header className="register-header">
          <span className="register-header__eyebrow">404Studio</span>
          <h1 className="register-header__title">Đăng ký</h1>
          <p className="register-header__desc">
            Tạo tài khoản để bắt đầu trải nghiệm mua sắm.
          </p>
        </header>

        {errors.general && (
          <div className="register-general-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="register-field-group">
            <div className="register-field register-field--full">
              <label htmlFor="fullName" className="register-field__label">
                Họ và tên
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Nhập họ và tên"
                className={`register-input ${errors.fullName ? "register-input--error" : ""}`}
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.fullName)}
              />
              {errors.fullName && (
                <span className="register-error">{errors.fullName}</span>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="email" className="register-field__label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập email"
                className={`register-input ${errors.email ? "register-input--error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <span className="register-error">{errors.email}</span>}
            </div>


            <div className="register-field">
              <label htmlFor="dateOfBirth" className="register-field__label">
                Ngày sinh
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className={`register-input ${errors.dateOfBirth ? "register-input--error" : ""}`}
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.dateOfBirth)}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateOfBirth && (
                <span className="register-error">{errors.dateOfBirth}</span>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="gender" className="register-field__label">
                Giới tính
              </label>
              <select
                id="gender"
                name="gender"
                className={`register-input register-select ${errors.gender ? "register-input--error" : ""}`}
                value={formData.gender}
                onChange={handleChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.gender)}
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              {errors.gender && (
                <span className="register-error">{errors.gender}</span>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="passWord" className="register-field__label">
                Mật khẩu
              </label>
              <div className="register-input-wrapper">
                <input
                  id="passWord"
                  name="passWord"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  className={`register-input ${errors.passWord ? "register-input--error" : ""}`}
                  value={formData.passWord}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.passWord)}
                />
                <button
                  type="button"
                  className="register-input-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.passWord && (
                <span className="register-error">{errors.passWord}</span>
              )}
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword" className="register-field__label">
                Xác nhận mật khẩu
              </label>
              <div className="register-input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className={`register-input ${errors.confirmPassword ? "register-input--error" : ""}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                <button
                  type="button"
                  className="register-input-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="register-error">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="register-field register-field--full">
              <label className="register-checkbox-row">
                <input
                  type="checkbox"
                  className="register-checkbox"
                  checked={acceptedTerms}
                  onChange={handleTermsChange}
                  disabled={isSubmitting}
                />
                <span className="register-checkbox-label">
                  Tôi đồng ý với điều khoản và chính sách bảo mật
                </span>
              </label>
              {errors.terms && <span className="register-error">{errors.terms}</span>}
            </div>
          </div>

          <button type="submit" className="register-button" disabled={isSubmitting || isFormIncomplete}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="register-button__spinner" aria-hidden="true" />
                <span>Đang tạo tài khoản...</span>
              </>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        <div className="register-divider">Hoặc tiếp tục với</div>

        <div className="flex justify-center mb-2">
          <GoogleLoginButton />
        </div>

        <p className="register-footer-desc">
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
