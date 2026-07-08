import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { sendResetOTPService, verifyOTPService, resetPasswordService } from "@/services/auth.service";
import { toast } from "react-toastify";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const RESEND_COOLDOWN = 60; // 60 seconds

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "404Studio";
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
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (step !== 2) return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
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
      const res = await sendResetOTPService({ email: email.trim() });
      const receivedOtp = res?.otp || res?.data?.otp;
      // console.log(`🔑 [OTP Debug] Mã OTP nhận được: ${receivedOtp}`);
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
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

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateStep2()) return;

    try {
      setIsSubmitting(true);
      await verifyOTPService({ email: email.trim(), otp });
      toast.success("Xác thực OTP thành công!");
      setStep(3);
    } catch (err) {
      console.error(err);
      setErrors({
        otp: err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.",
      });
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
      const res = await sendResetOTPService({ email: email.trim() });
      const receivedOtp = res?.otp || res?.data?.otp;
      // console.log(`🔑 [OTP Debug] Mã OTP gửi lại nhận được: ${receivedOtp}`);
      toast.success("Mã OTP mới đã được gửi đến email của bạn!");
      setOtp("");
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
    } catch (err) {
      console.error(err);
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
    <div className="reset-form-section">
      <div className="reset-form-container">
        <button
          onClick={handleBack}
          className="reset-back-btn"
          type="button"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>
            {step === 3 
              ? "Quay lại nhập OTP" 
              : step === 2 
              ? "Quay lại nhập email" 
              : "Quay lại đăng nhập"}
          </span>
        </button>

        <header className="reset-header">
          <span className="reset-header__eyebrow">{siteName}</span>
          <h1 className="reset-header__title">
            {step === 3 ? "Đặt mật khẩu mới" : "Đặt lại mật khẩu"}
          </h1>
          <p className="reset-header__desc">
            {step === 1 && "Nhập email của bạn để nhận mã xác minh OTP khôi phục tài khoản."}
            {step === 2 && `Mã OTP đã được gửi. Hãy kiểm tra hộp thư email ${email}.`}
            {step === 3 && `Tạo mật khẩu mới cho tài khoản ${email}.`}
          </p>
        </header>

        {errors.general && (
          <div className="reset-general-error">{errors.general}</div>
        )}

        {step === 1 && (
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
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="reset-field-group">
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
            </div>

            <button type="submit" className="reset-button" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin h-5 w-5" aria-hidden="true" />
                  <span>Đang xác thực OTP...</span>
                </>
              ) : (
                "Xác nhận mã OTP"
              )}
            </button>

            {/* Gửi lại OTP Row */}
            <div className="reset-resend-row">
              <span className="reset-resend-label">Không nhận được mã?</span>
              <button
                type="button"
                className="reset-resend-btn"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
              >
                {isResending ? "Đang gửi lại…" : "Gửi lại mã"}
              </button>
              {!canResend && (
                <span className="reset-resend-countdown">
                  {countdown}s
                </span>
              )}
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="reset-field-group">
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
