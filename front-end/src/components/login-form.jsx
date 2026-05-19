import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import loginImage from "@/assets/login.png";
import { loginService } from "@/services/auth.service";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    passWord: "",
  });
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!formData.email) {
      setErrors({ email: "Email không được để trống" });
      return;
    }
    if (!formData.passWord) {
      setErrors({ passWord: "Mật khẩu không được để trống" });
      return;
    }

    try {
      const response = await loginService({
        email: formData.email,
        passWord: formData.passWord,
      });
      // Xử lý logic sau khi đăng nhập thành công
      // console.log("Đăng nhập thành công:", response);
      login(response.accessToken);
      // alert("Đăng nhập thành công!");
      toast.success("Đăng nhập thành công!");
      navigate("/"); // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
    } catch (err) {
      console.log(err.response?.data);
      setErrors({
        general: err.response?.data?.message || "Đăng nhập thất bại",
      });
      toast.error(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // Facebook Icon
  const FacebookIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="currentColor"
      />
    </svg>
  );

  // X (Twitter) Icon
  const XIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-5 h-5"
    >
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.207-6.807-5.974 6.807H2.882l7.432-8.491L1.227 2.25h6.836l4.713 6.231 5.45-6.231zM17.002 18.807h1.646L6.154 4.556H4.382l12.62 14.251z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div className={cn("flex flex-col gap-6 relative", className)} {...props}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Quay lại"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-6 h-6 fill-current"
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-2xl font-bold">Chào mừng trở lại</h1>
                <p className="text-balance text-muted-foreground">
                  Đăng nhập vào tài khoản của bạn
                </p>
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
                  placeholder="Nhập email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email}</span>
                )}
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="passWord">Mật khẩu</FieldLabel>
                  <Link
                    to="/reset-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  id="passWord"
                  name="passWord"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  required
                  value={formData.passWord}
                  onChange={handleChange}
                />
                {errors.passWord && (
                  <span className="text-red-500 text-sm">
                    {errors.passWord}
                  </span>
                )}
              </Field>

              <Field>
                <Button type="submit" className="w-full">
                  Đăng nhập
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>

              <Field className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  title="Đăng nhập với Google"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Đăng nhập với Google</span>
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  title="Đăng nhập với Facebook"
                >
                  <FacebookIcon />
                  <span className="sr-only">Đăng nhập với Facebook</span>
                </Button>

                <Button variant="outline" type="button" title="Đăng nhập với X">
                  <XIcon />
                  <span className="sr-only">Đăng nhập với X</span>
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="font-semibold hover:underline">
                  Đăng ký
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src={loginImage}
              alt="Hình ảnh đăng nhập"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <Link to="/terms" className="hover:underline">
          Điều khoản dịch vụ
        </Link>{" "}
        và{" "}
        <Link to="/privacy" className="hover:underline">
          Chính sách bảo mật
        </Link>{" "}
        của chúng tôi.
      </FieldDescription>
    </div>
  );
}
