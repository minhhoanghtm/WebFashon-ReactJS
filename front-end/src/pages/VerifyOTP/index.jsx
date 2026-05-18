import { registerService, sendOTPServive, verifyOTPService } from "@/services/auth.service";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const index = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const location = useLocation(); // Lấy email từ state nếu có
  const formData = location.state?.formData || {}; // Lấy formData từ state nếu có
  const email = formData.email || {}; // Lấy email từ formData
  
  const handleResendOTP = async () => {
    const res = await sendOTPServive({
      email
    });
    if(!res.success) {
      setErrors({ otp: "Gửi lại OTP thất bại: " + res.data.message });
      return;
    }
    // alert("OTP đã được gửi lại thành công!");4
    toast.success("OTP đã được gửi lại thành công!");
  };

  const handleVerifyOTP = async () => {
    const res = await verifyOTPService({
      email: formData.email,
      otp: otp
    });

    if(!res.success) {
      setErrors({ otp: "Xác minh OTP thất bại: " + res.data.message });
      return;
    }
     await registerService({
        email: formData.email,
        passWord: formData.passWord,
        lastName: formData.lastName,
        firstName: formData.firstName
      });
    navigate("/login");
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6 md:p-10">
      <div className="border rounded-2xl">
        <div className="p-6 md:p-10">
          <button
            onClick={() => navigate(-1)}
            className="text-black hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-6 h-6 fill-current"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold mb-4">Xác minh OTP</h1>
          <p className="mb-4">
            Vui lòng nhập mã OTP được gửi đến email của bạn.
          </p>
          <input
            type="text"
            placeholder="Nhập mã OTP"
            className="w-full p-3 border rounded-lg mb-4"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          {errors.otp && <p className="text-red-500">{errors.otp}</p>}
          <button
            className="text-blue-500 hover:underline"
            onClick={handleResendOTP}
          >
            Gửi lại mã
          </button>
          <button
            className="w-full bg-black text-white p-3 rounded-lg"
            onClick={handleVerifyOTP}
          >
            Xác minh
          </button>
        </div>
      </div>
    </div>
  );
};

export default index;
