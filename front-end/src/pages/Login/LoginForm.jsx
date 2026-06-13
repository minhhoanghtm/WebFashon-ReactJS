import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { toast } from "react-toastify";

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

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    passWord: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.email) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Email không đúng định dạng.";
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
        email: formData.email,
        passWord: formData.passWord,
      });
      const token = response.data?.accessToken;
      if (token) {
        login(token);
        try {
          const userRes = await userApi.getMe();
          if (userRes.success && userRes.data) {
            setUser(userRes.data);
          }
        } catch (err) {
          console.error("Lỗi khi lấy thông tin user sau khi đăng nhập:", err);
        }
        toast.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        toast.error("Đăng nhập thất bại: Không tìm thấy token");
      }
    } catch (err) {
      console.error(err);
      setErrors({
        general:
          err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      });
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-form-section">
      <div className="login-form-container">
        <button
          onClick={() => navigate("/")}
          className="login-back-btn"
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Quay lại trang chủ</span>
        </button>

        <header className="login-header">
          <span className="login-header__eyebrow">WebFashion</span>
          <h1 className="login-header__title">Đăng nhập</h1>
          <p className="login-header__desc">
            Vui lòng nhập thông tin tài khoản của bạn.
          </p>
        </header>

        {errors.general && (
          <div className="login-general-error">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-field-group">
            <div className="login-field">
              <label htmlFor="email" className="login-field__label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập email"
                className={`login-input ${errors.email ? "login-input--error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.email && <span className="login-error">{errors.email}</span>}
            </div>

            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="passWord" className="login-field__label">
                  Mật khẩu
                </label>
                <Link to="/reset-password" className="login-field__link">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="login-input-wrapper">
                <input
                  id="passWord"
                  name="passWord"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  className={`login-input ${errors.passWord ? "login-input--error" : ""}`}
                  value={formData.passWord}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-input-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.passWord && (
                <span className="login-error">{errors.passWord}</span>
              )}
            </div>

            <div className="login-options-row">
              <label className="login-checkbox-row">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="login-checkbox-label">Ghi nhớ đăng nhập</span>
              </label>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin h-5 w-5" aria-hidden="true" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="login-divider">Hoặc tiếp tục với</div>

        <div className="login-social-grid">
          <button className="login-social-btn" type="button" title="Đăng nhập với Google">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span>Google</span>
          </button>
          <button className="login-social-btn" type="button" title="Đăng nhập với Facebook">
            <FacebookIcon />
            <span>Facebook</span>
          </button>
          <button className="login-social-btn" type="button" title="Đăng nhập với X">
            <XIcon />
            <span>X</span>
          </button>
        </div>

        <p className="login-footer-desc">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
