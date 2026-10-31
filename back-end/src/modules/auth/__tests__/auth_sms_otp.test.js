import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { jest } from "@jest/globals";

process.env.DISABLE_RATE_LIMIT_FOR_TESTS = "true";

const authServiceMock = {
  sendRegisterOtp: jest.fn(),
  verifyRegisterAndCreateUser: jest.fn(),
  signIn: jest.fn(),
  sendLoginOtp: jest.fn(),
  verifyLoginOtp: jest.fn(),
  sendForgotPasswordOtp: jest.fn(),
  resetPasswordWithOtp: jest.fn(),
  resendOtp: jest.fn(),
  signOutAll: jest.fn(),
};

jest.unstable_mockModule("../auth.service.js", () => ({
  default: authServiceMock,
}));

jest.unstable_mockModule("../../../middlewares/auth.middleware.js", () => ({
  protectedRoute: (req, _res, next) => {
    req.user = { userId: "user-123", jti: "jti-123" };
    next();
  },
  optionalProtectedRoute: (req, _res, next) => {
    req.user = null;
    next();
  },
}));

const { default: authRouter } = await import("../auth.route.js");
const { default: errorHandler } = await import("../../../middlewares/error.middleware.js");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use(errorHandler);
  return app;
};

describe("SMS OTP Auth Routes Integration", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe("Register Flow", () => {
    test("POST /api/auth/register/send-otp rejects invalid phone number", async () => {
      const res = await request(app)
        .post("/api/auth/register/send-otp")
        .send({ phone: "123" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(authServiceMock.sendRegisterOtp).not.toHaveBeenCalled();
    });

    test("POST /api/auth/register/send-otp sends OTP for valid phone", async () => {
      authServiceMock.sendRegisterOtp.mockResolvedValue({
        phone: "+84901234567",
        cooldown: 60,
        ttl: 300,
        message: "Mã OTP đã được gửi.",
      });

      const res = await request(app)
        .post("/api/auth/register/send-otp")
        .send({ phone: "0901234567" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe("+84901234567");
      expect(authServiceMock.sendRegisterOtp).toHaveBeenCalledWith(
        "0901234567",
        undefined,
        expect.any(String)
      );
    });

    test("POST /api/auth/register/verify rejects short password", async () => {
      const res = await request(app)
        .post("/api/auth/register/verify")
        .send({
          phone: "0901234567",
          otp: "123456",
          fullName: "Nguyễn Văn A",
          passWord: "short",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(authServiceMock.verifyRegisterAndCreateUser).not.toHaveBeenCalled();
    });

    test("POST /api/auth/register/verify creates user and sets auth cookie", async () => {
      authServiceMock.verifyRegisterAndCreateUser.mockResolvedValue({
        accessToken: "access-token-xyz",
        refreshToken: "refresh-token-xyz",
        user: { id: "user-1", fullName: "Nguyễn Văn A", phone: "+84901234567" },
      });

      const res = await request(app)
        .post("/api/auth/register/verify")
        .send({
          phone: "0901234567",
          otp: "123456",
          fullName: "Nguyễn Văn A",
          passWord: "Password123@",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe("access-token-xyz");
      expect(res.headers["set-cookie"].join(";")).toContain("refreshToken=refresh-token-xyz");
    });
  });

  describe("Login Flow (Phone & SMS OTP)", () => {
    test("POST /api/auth/login accepts phone number identifier", async () => {
      authServiceMock.signIn.mockResolvedValue({
        accessToken: "access-token-xyz",
        refreshToken: "refresh-token-xyz",
        user: { _id: "user-1", fullName: "Nguyễn Văn A" },
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          phone: "0901234567",
          passWord: "Password123@",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authServiceMock.signIn).toHaveBeenCalledWith(
        "0901234567",
        "Password123@",
        expect.any(String),
        undefined
      );
    });

    test("POST /api/auth/login/otp/send sends login OTP", async () => {
      authServiceMock.sendLoginOtp.mockResolvedValue({
        phone: "+84901234567",
        cooldown: 60,
        ttl: 300,
        message: "Mã OTP đăng nhập đã được gửi.",
      });

      const res = await request(app)
        .post("/api/auth/login/otp/send")
        .send({ phone: "0901234567" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authServiceMock.sendLoginOtp).toHaveBeenCalled();
    });

    test("POST /api/auth/login/otp/verify verifies OTP and logs in", async () => {
      authServiceMock.verifyLoginOtp.mockResolvedValue({
        accessToken: "login-otp-token",
        refreshToken: "login-otp-refresh",
        user: { id: "user-1", fullName: "Nguyễn Văn A" },
      });

      const res = await request(app)
        .post("/api/auth/login/otp/verify")
        .send({ phone: "0901234567", otp: "654321" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe("login-otp-token");
    });
  });

  describe("Forgot & Reset Password Flow", () => {
    test("POST /api/auth/password/forgot returns generic 200 (anti-enumeration)", async () => {
      authServiceMock.sendForgotPasswordOtp.mockResolvedValue({
        success: true,
        message: "Nếu thông tin tài khoản hợp lệ, mã OTP khôi phục mật khẩu đã được gửi.",
        data: { identifier: "+8490****567", cooldown: 60, channel: "sms" },
      });

      const res = await request(app)
        .post("/api/auth/password/forgot")
        .send({ identifier: "0901234567" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Nếu thông tin tài khoản hợp lệ");
    });

    test("POST /api/auth/password/reset resets password and clears cookie", async () => {
      authServiceMock.resetPasswordWithOtp.mockResolvedValue({
        success: true,
        message: "Đặt lại mật khẩu thành công.",
      });

      const res = await request(app)
        .post("/api/auth/password/reset")
        .send({
          identifier: "0901234567",
          otp: "123456",
          newPassword: "NewSecretPassword123@",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authServiceMock.resetPasswordWithOtp).toHaveBeenCalledWith(
        "0901234567",
        "123456",
        "NewSecretPassword123@"
      );
    });
  });

  describe("Resend OTP", () => {
    test("POST /api/auth/otp/resend validates purpose and sends OTP", async () => {
      authServiceMock.resendOtp.mockResolvedValue({
        identifier: "+8490****567",
        cooldown: 60,
        ttl: 300,
        message: "Mã OTP mới đã được gửi thành công.",
      });

      const res = await request(app)
        .post("/api/auth/otp/resend")
        .send({
          identifier: "0901234567",
          purpose: "register",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(authServiceMock.resendOtp).toHaveBeenCalledWith(
        "0901234567",
        "register",
        expect.any(String)
      );
    });
  });
});
