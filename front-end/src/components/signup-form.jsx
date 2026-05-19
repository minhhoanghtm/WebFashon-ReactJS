import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { GrFormView, GrFormViewHide } from "react-icons/gr";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { sendOTPServive } from "@/services/auth.service";

export function SignupForm({ className, ...props }) {
  const navigate = useNavigate();
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    email: "",
    passWord: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleHidePasswordToggle = (field) => {
    if (field === "current") {
      setHidePassword((prev) => !prev);
    } else if (field === "confirm") {
      setHideConfirmPassword((prev) => !prev);
    }
  };
  const validateName = (name, field) => {
  if (!name || name.trim() === "") {
    return `${field} không được để trống`;
  }

  if (name.length < 2) {
    return `${field} phải ít nhất 2 ký tự`;
  }

  const regex = /^[A-Za-zÀ-ỹ\s]+$/;
  if (!regex.test(name)) {
    return `${field} chỉ được chứa chữ`;
  }

  return "";
};

const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return "Email không được để trống";
  }
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return "Email không hợp lệ";
  }
  return "";
};

const validatePassword = (password) => {
  if (!password || password.trim() === "") {
    return "Mật khẩu không được để trống";
  }
  if (password.length < 6) {
    return "Mật khẩu phải ít nhất 6 ký tự";
  }
  return "";
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    //Họ
    const lastNameError = validateName(formData.lastName, "Họ");
    if (lastNameError) {
      setErrors({ lastName: lastNameError });
      return;
    }
    //Tên
    const firstNameError = validateName(formData.firstName, "Tên");
    if (firstNameError) {
      setErrors({ firstName: firstNameError });
      return;
    }
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setErrors({ email: emailError });
      return;
    }
    const passwordError = validatePassword(formData.passWord);
    if (passwordError) {
      setErrors({ passWord: passwordError });
      return;
    }
    const confirmPasswordError = validatePassword(formData.confirmPassword);
    if (confirmPasswordError) {
      setErrors({ confirmPassword: confirmPasswordError });
      return;
    }
    if (formData.passWord !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Mật khẩu xác nhận không khớp" });
      return;
    }
    try{
      setLoading(true);
      // Gọi API đăng ký tại đây
      await sendOTPServive({
        email: formData.email,
      });
      navigate("/verify-otp", { state: { formData } });
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.";
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props} onSubmit={handleSubmit}>
      <FieldGroup>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <IoArrowBack className="text-lg" />
          Quay lại
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Chào mừng bạn đến với 404Studio! Hãy tạo tài khoản để trải nghiệm
            mua sắm thời trang trực tuyến tuyệt vời của chúng tôi.
          </p>
        </div>
        {errors.general && <span className="text-red-500 text-sm text-center">{errors.general}</span>}
        <Field>
          <FieldLabel htmlFor="lastName">Họ</FieldLabel>
          <Input
            id="lastName"
            type="text"
            placeholder="Nguyễn"
            required
            className="bg-background"
            value={formData.lastName}
            onChange={handleChange}
          />
          {errors.lastName && <span className="text-red-500 text-sm">{errors.lastName}</span>}
        </Field>
        <Field>
          <FieldLabel htmlFor="firstName">Tên</FieldLabel>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            required
            className="bg-background"
            value={formData.firstName}
            onChange={handleChange}
          />
          {errors.firstName && <span className="text-red-500 text-sm">{errors.firstName}</span>}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="abc@example.com"
            required
            className="bg-background"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
          {/* <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email
            with anyone else.
          </FieldDescription> */}
        </Field>
        <Field>
          <FieldLabel htmlFor="passWord">Mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="passWord"
              type={hidePassword ? "password" : "text"}
              required
              className="bg-background"
              value={formData.passWord}
              onChange={handleChange}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
              onClick={() => handleHidePasswordToggle("current")}
            >
              {hidePassword ? (
                <GrFormViewHide className="text-3xl" />
              ) : (
                <GrFormView className="text-3xl" />
              )}
            </span>
          </div>
          {errors.passWord && <span className="text-red-500 text-sm">{errors.passWord}</span>}
          <FieldDescription>
            Mật khẩu phải có ít nhất 6 ký tự.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={hideConfirmPassword ? "password" : "text"}
              required
              className="bg-background"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
              onClick={() => handleHidePasswordToggle("confirm")}
            >
              {hideConfirmPassword ? (
                <GrFormViewHide className="text-3xl" />
              ) : (
                <GrFormView className="text-3xl" />
              )}
            </span>
          </div>
          {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword}</span>}
          <FieldDescription>
            Vui lòng xác nhận mật khẩu của bạn.
          </FieldDescription>
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang gửi mã..." : "Đăng ký"}
          </Button>
        </Field>
        <FieldSeparator>Hoặc tiếp tục với</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.03H7.9v-2.9h2.4V9.41c0-2.37 1.41-3.68 3.57-3.68 1.03 0 2.1.18 2.1.18v2.31h-1.18c-1.16 0-1.52.72-1.52 1.46v1.76h2.59l-.41 2.9h-2.18v7.03c4.78-.75 8.44-4.91 8.44-9.93z"
                fill="currentColor"
              />
            </svg>
            Đăng ký với Facebook
          </Button>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Đăng ký với Gmail
          </Button>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M18.244 2H21.5l-7.5 8.57L22 22h-6.828l-5.35-6.99L3.5 22H.244l8.02-9.17L2 2h6.828l4.86 6.39L18.244 2zm-2.4 18h1.8L7.6 4h-1.8l10.044 16z"
                fill="currentColor"
              />
            </svg>
            Đăng ký với X
          </Button>
          <FieldDescription className="px-6 text-center">
            Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
