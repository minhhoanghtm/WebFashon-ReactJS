import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import React from "react";
import { useNavigate } from "react-router-dom";

const index = () => {
  useDocumentTitle("Quên mật khẩu");
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-6 md:p-10">
      <div className="border rounded-2xl">
        <div className="p-6 md:p-10">
          <button
            onClick={() => navigate("/login")}
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
          <h1 className="text-2xl font-bold mb-4">Vui lòng nhập email</h1>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            className="w-full p-3 border rounded-lg mb-4"
          />
          <button
            className="w-full bg-black text-white p-3 rounded-lg"
            onClick={() => navigate("/verify-otp")}
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
};

export default index;
