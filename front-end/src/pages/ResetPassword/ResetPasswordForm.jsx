import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, CheckCircle2 } from "lucide-react";
import { sendOTPServive, resetPasswordService } from "@/services/auth.service";
import { toast } from "react-toastify";

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep1 = () => {
    const nextErrors = {};
    if (!email) {
      nextErrors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không đúng định dạng.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    if (!otp) {
      nextErrors.otp = "Vui lòng nhập mã OTP.";
    } else if (otp.length < 4) {
      nextErrors.otp = "Mã OTP không hợp lệ.";
    }

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
      // Gọi API gửi OTP (body dạng { email })
      await sendOTPServive({ email });
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (err) {
      console.error(err);
      setErrors({
        email: err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.",
      });
      toast.error(err.response?.data?.message || "Gửi OTP thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep2()) return;

    try {
      setIsSubmitting(true);
      // Gọi API resetPassword (body dạng { email, otp, newPassword })
      await resetPasswordService({
        email,
        otp,
        newPassword,
      });
      toast.success("Khôi phục mật khẩu thành công!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setErrors({
        general: err.response?.data?.message || "Khôi phục mật khẩu thất bại. Vui lòng kiểm tra lại.",
      });
      toast.error(err.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-form-section">
      <div className="reset-form-container">
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setErrors({});
            } else {
              navigate("/login");
            }
          }}
          className="reset-back-btn"
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>{step === 2 ? "Quay lại nhập email" : "Quay lại đăng nhập"}</span>
        </button>

        <header className="reset-header">
          <span className="reset-header__eyebrow">404Studio</span>
          <h1 className="reset-header__title">Đặt lại mật khẩu</h1>
          <p className="reset-header__desc">
            {step === 1
              ? "Nhập email của bạn để nhận mã xác minh OTP khôi phục tài khoản."
              : `Mã OTP đã được gửi. Hãy kiểm tra hộp thư email ${email}.`}
          </p>
        </header>

        {errors.general && (
          <div className="reset-general-error">{errors.general}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="reset-field-group">
              <div className="reset-field">
                <label htmlFor="email" className="reset-field__label">
                  Email tài khoản
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  className={`reset-input ${errors.email ? "reset-input--error" : ""}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  }}
                  disabled={isSubmitting}
                />
                {errors.email && <span className="reset-error">{errors.email}</span>}
              </div>
            </div>

            <button type="submit" className="reset-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin h-5 w-5" aria-hidden="true" />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                "Gửi mã xác minh OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="reset-field-group">
              {/* OTP Field */}
              <div className="reset-field">
                <label htmlFor="otp" className="reset-field__label">
                  Mã xác minh OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="Nhập 6 chữ số OTP"
                  maxLength={6}
                  className={`reset-input ${errors.otp ? "reset-input--error" : ""}`}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) setErrors((prev) => ({ ...prev, otp: null }));
                  }}
                  disabled={isSubmitting}
                />
                {errors.otp && <span className="reset-error">{errors.otp}</span>}
              </div>

              {/* New Password Field */}
              <div className="reset-field">
                <label htmlFor="newPassword" className="reset-field__label">
                  Mật khẩu mới
                </label>
                <div className="reset-input-wrapper">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`reset-input ${errors.newPassword ? "reset-input--error" : ""}`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: null }));
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="reset-input-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="reset-error">{errors.newPassword}</span>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="reset-field">
                <label htmlFor="confirmPassword" className="reset-field__label">
                  Xác nhận mật khẩu mới
                </label>
                <div className="reset-input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`reset-input ${errors.confirmPassword ? "reset-input--error" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="reset-input-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="reset-error">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <button type="submit" className="reset-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin h-5 w-5" aria-hidden="true" />
                  <span>Đang đặt lại mật khẩu...</span>
                </>
              ) : (
                "Khôi phục mật khẩu"
              )}
            </button>
          </form>
        )}

        <p className="reset-footer-desc">
          Nhớ mật khẩu của bạn? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
