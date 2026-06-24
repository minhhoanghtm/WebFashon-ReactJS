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
import { useAuthStore } from "@/store/auth.store";
import { userApi } from "@/api/user.api";
import { toast } from "react-toastify";

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    passWord: "",
  });
  const [errors, setErrors] = useState({});
  const { login, setUser } = useAuthStore();
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
      const token = response.data?.accessToken;
      if (token) {
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
        toast.success("Đăng nhập thành công!");
        if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        toast.error("Đăng nhập thất bại: Không tìm thấy token");
      }
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
    <div className={cn("flex flex-col gap-6 relative min-h-screen", className)} {...props}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 p-2 rounded-lg hover:bg-muted transition-colors z-10"
        title="Back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-6 h-6 fill-foreground"
        >
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>

      <Card className="overflow-hidden border-0 shadow-lg m-4 md:m-0 md:rounded-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-8 md:p-12" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
                <p className="text-muted-foreground">
                  Sign in to your account to continue
                </p>
              </div>

              {errors.general && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg mb-4">
                  {errors.general}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <span className="text-destructive text-sm">{errors.email}</span>
                )}
              </Field>

              <Field>
                <div className="flex items-center gap-2 mb-2">
                  <FieldLabel htmlFor="passWord" className="m-0">Password</FieldLabel>
                  <Link
                    to="/reset-password"
                    className="ml-auto text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="passWord"
                  name="passWord"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.passWord}
                  onChange={handleChange}
                />
                {errors.passWord && (
                  <span className="text-destructive text-sm">
                    {errors.passWord}
                  </span>
                )}
              </Field>

              <Field className="mt-2">
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign in
                </Button>
              </Field>

              <FieldSeparator>
                Or continue with
              </FieldSeparator>

              <Field className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  title="Sign in with Google"
                  className="border border-border hover:bg-muted"
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
                  <span>Google</span>
                </Button>
              </Field>

              <FieldDescription className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-accent hover:underline">
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-gradient-to-br from-accent/20 to-accent/5 md:flex items-center justify-center">
            <img
              src={loginImage}
              alt="Login"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs">
        By continuing, you agree to our{" "}
        <Link to="/terms" className="hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </FieldDescription>
    </div>
  );
}
