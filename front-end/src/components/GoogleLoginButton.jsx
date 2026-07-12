import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "@/api/googleAuth.api";
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { toast } from "react-toastify";

/**
 * Google login button component.
 * On success, sends the ID token to the backend via loginWithGoogle.
 * On success response, stores the access token and user in the auth store.
 */
export const GoogleLoginButton = () => {
  const { login, setUser } = useAuthStore();
  const navigate = useNavigate();
  const isSuccessRef = React.useRef(false);

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await loginWithGoogle(credentialResponse.credential);
      if (res?.success && res?.data) {
        isSuccessRef.current = true;
        const token = res.data.accessToken;
        login(token);

        let userRole = "";
        try {
          const userRes = await userApi.getMe();
          if (userRes.success && userRes.data) {
            setUser(userRes.data);
            userRole = userRes.data.role || userRes.data.data?.role || "";
          }
        } catch (err) {
          console.error("Lỗi khi lấy thông tin user sau khi đăng nhập:", err);
        }

        toast.success("Đăng nhập Google thành công!");
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.error("Đăng nhập Google thất bại");
      }
    } catch (err) {
      console.error("Google login error:", err);
      const errMsg = err.response?.data?.message || "Đăng nhập Google thất bại";
      toast.error(errMsg);
    }
  };

  const handleError = () => {
    // We do not show a toast error here because:
    // 1. Google GSI already handles popup closing naturally (user cancellation is not a system failure).
    // 2. React StrictMode/unmounting triggers this callback as a false-positive on load or redirect.
    // 3. Real server-side auth errors are caught and toasted in handleSuccess's catch block.
    console.warn('Google GSI button initialization or popup closed.');
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
};
