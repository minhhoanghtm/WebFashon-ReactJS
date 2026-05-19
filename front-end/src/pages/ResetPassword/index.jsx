import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldGroup, FieldDescription } from "@/components/ui/field";
import { resetPasswordService, sendOTPServive, verifyOTPService } from "@/services/auth.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "react-toastify";

const ResetPassword = () => {
  useDocumentTitle("Đặt lại mật khẩu");
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  //B1: gui ma OTP den email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email) {
      setErrors({ email: "Email không được để trống" });
      return;
    }
    console.log(formData.email);
    setLoading(true);
    try {
      const resSendOTP = await sendOTPServive({ email: formData.email });
      // const data = await resSendOTP;
      console.log("Send OTP Response:", resSendOTP);
      // console.log("Send OTP Data:", data);
      console.log("Send OTP Response OK:", resSendOTP.success);
      if (!resSendOTP.success) {
        setErrors({ general: resSendOTP.message || "Gửi OTP thất bại" });
        return;
      }
      setStep(2);
    } catch (err) {
       console.log(err.resSendOTP);
      setErrors({
        general: err.resSendOTP?.message || "Gửi OTP thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  //B2: Xac thuc ma OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.otp) {
      setErrors({ otp: "Mã OTP không được để trống" });
      return;
    }

    setLoading(true);
    try {
      const resVerifyOTP = await verifyOTPService({ email: formData.email, otp: formData.otp });

      if (!resVerifyOTP.success) {
        setErrors({ general: resVerifyOTP.message || "Xác thực OTP thất bại" });
        return;
      }

      setStep(3);
    } catch (err) {
       console.log(err.resVerifyOTP);
      setErrors({
        general: err.resVerifyOTP?.message || "Xác thực OTP thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  //B3: Dat lai mat khau
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.newPassword) {
      setErrors({ newPassword: "Mật khẩu mới không được để trống" });
      return;
    }
    if (!formData.confirmPassword) {
      setErrors({ confirmPassword: "Xác nhận mật khẩu không được để trống" });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ general: "Mật khẩu không khớp" });
      return;
    }
    console.log("Reset Password Data:", { email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
    setLoading(true);
    try {
      const resResetPassword = await resetPasswordService({ email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
      console.log("Reset Password Response:", resResetPassword);
      if (!resResetPassword.success) {
        setErrors({ general: resResetPassword.message || "Đặt lại mật khẩu thất bại" });
        return;
      }
      navigate("/login");
    } catch (err) {
      console.log(err.resResetPassword);
      setErrors({
        general: err.resResetPassword?.message || "Đặt lại mật khẩu thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setErrors({});
    setLoading(true);
    try {
      const resSendOTP = await sendOTPServive({ email: formData.email });
      console.log("Resend OTP Response:", resSendOTP);
      if (!resSendOTP.success) {
        setErrors({ general: resSendOTP.message || "Gửi lại OTP thất bại" });
        return;
      }
      // alert("Mã OTP đã được gửi lại đến email của bạn");
      toast.success("Mã OTP đã được gửi lại đến email của bạn");
    } catch (err) {
      console.log(err.resSendOTP);
      setErrors({
        general: err.resSendOTP?.message || "Gửi lại OTP thất bại",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-200 transition-colors z-10"
        title="Quay lại"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      {/* Main Container */}
      <div className="flex items-center justify-center flex-1 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            {/* Progress Steps */}
            <div className="flex gap-2 mb-8">
              <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-300"}`}></div>
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-300"}`}></div>
              <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-blue-600" : "bg-gray-300"}`}></div>
            </div>

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <FieldGroup>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-center mb-2">Đặt lại mật khẩu</h2>
                    <p className="text-center text-gray-600 text-sm">Nhập email liên kết với tài khoản của bạn</p>
                  </div>

                  {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {errors.general}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Nhập email của bạn"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                  </Field>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6"
                  >
                    {loading ? "Đang gửi..." : "Gửi mã OTP"}
                  </Button>
                </FieldGroup>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <FieldGroup>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-center mb-2">Xác thực OTP</h2>
                    <p className="text-center text-gray-600 text-sm">Mã OTP đã được gửi đến {formData.email}</p>
                  </div>

                  {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {errors.general}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="otp">Mã OTP (6 chữ số)</FieldLabel>
                    <Input
                      id="otp"
                      name="otp"
                      type="text"
                      placeholder="000000"
                      value={formData.otp}
                      onChange={handleChange}
                      maxLength="6"
                    />
                    {errors.otp && <span className="text-red-500 text-sm">{errors.otp}</span>}
                  </Field>
                  <p
                    type="submit"
                    disabled={loading}
                    className="text-blue-600 hover:underline text-sm cursor-pointer"
                    onClick={handleResendOTP}
                  >
                    Bạn chưa nhận được mã? Gửi lại
                  </p>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6"
                  >
                    {loading ? "Đang xác thực..." : "Xác thực"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full mt-3 text-blue-600 hover:underline text-sm"
                  >
                    Quay lại bước trước
                  </button>
                </FieldGroup>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <FieldGroup>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-center mb-2">Mật khẩu mới</h2>
                    <p className="text-center text-gray-600 text-sm">Nhập mật khẩu mới cho tài khoản của bạn</p>
                  </div>

                  {errors.general && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {errors.general}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M11.83 9L15.5 12.67c.14-.34.21-.71.21-1.07C15.71 9.45 14.56 8.3 13.13 8.3c-.36 0-.73.07-1.07.21L11.83 9zm7.08 0l3.58 3.59c.26-.72.41-1.5.41-2.32C22.9 6.54 17.72 2 12 2c-1.88 0-3.69.5-5.25 1.37l3.58 3.59c1.34-.04 2.64.45 3.58 1.34 1.34 1.34 1.78 3.11 1.38 4.72l1.22 1.22c.47-.17.92-.38 1.33-.64M2.01 3.87L3.13 5 3 5c-.26.72-.41 1.5-.41 2.32 0 5.16 5.18 9.7 11.7 9.7 1.88 0 3.69-.5 5.25-1.37L19.87 21 21 19.88 3.13 2zm12.07 6.32L12.21 7.48c-.04.01-.08.02-.13.02-1.66 0-3 1.34-3 3 0 .05.01.09.02.13l2.87 2.88c.44-1.01.69-2.11.69-3.27 0-.22-.02-.44-.05-.66z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword}</span>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Xác nhận mật khẩu mới"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M11.83 9L15.5 12.67c.14-.34.21-.71.21-1.07C15.71 9.45 14.56 8.3 13.13 8.3c-.36 0-.73.07-1.07.21L11.83 9zm7.08 0l3.58 3.59c.26-.72.41-1.5.41-2.32C22.9 6.54 17.72 2 12 2c-1.88 0-3.69.5-5.25 1.37l3.58 3.59c1.34-.04 2.64.45 3.58 1.34 1.34 1.34 1.78 3.11 1.38 4.72l1.22 1.22c.47-.17.92-.38 1.33-.64M2.01 3.87L3.13 5 3 5c-.26.72-.41 1.5-.41 2.32 0 5.16 5.18 9.7 11.7 9.7 1.88 0 3.69-.5 5.25-1.37L19.87 21 21 19.88 3.13 2zm12.07 6.32L12.21 7.48c-.04.01-.08.02-.13.02-1.66 0-3 1.34-3 3 0 .05.01.09.02.13l2.87 2.88c.44-1.01.69-2.11.69-3.27 0-.22-.02-.44-.05-.66z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
                  </Field>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6"
                  >
                    {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                  </Button>
                </FieldGroup>
              </form>
            )}

            {/* Links */}
            <div className="mt-6 text-center text-sm">
              <FieldDescription>
                Nhớ mật khẩu rồi?{" "}
                <Link to="/login" className="font-semibold hover:underline">
                  Đăng nhập
                </Link>
              </FieldDescription>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
