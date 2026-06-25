import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { jest } from "@jest/globals";

process.env.DISABLE_RATE_LIMIT_FOR_TESTS = "true";

const authServiceMock = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  refreshAccessToken: jest.fn(),
  signOutAll: jest.fn(),
  sendOTP: jest.fn(),
  verifyOTP: jest.fn(),
  resetPassword: jest.fn(),
};

jest.unstable_mockModule("../auth.service.js", () => ({
  default: authServiceMock,
}));

jest.unstable_mockModule("../../../middlewares/auth.middleware.js", () => ({
  protectedRoute: (req, _res, next) => {
    req.user = { userId: "user-1", jti: "jti-1" };
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

describe("Auth routes", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  test("POST /api/auth/signUp validates request body", async () => {
    const response = await request(app)
      .post("/api/auth/signUp")
      .send({ email: "not-an-email", passWord: "123" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(authServiceMock.signUp).not.toHaveBeenCalled();
  });

  test("POST /api/auth/signUp returns created user", async () => {
    const user = { id: "user-1", email: "linh@example.com" };
    authServiceMock.signUp.mockResolvedValue(user);

    const response = await request(app)
      .post("/api/auth/signUp")
      .send({
        email: "linh@example.com",
        passWord: "Password123",
        firstName: "Linh",
        lastName: "Nguyen",
        sex: "female",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(user);
    expect(authServiceMock.signUp).toHaveBeenCalledWith({
      email: "linh@example.com",
      passWord: "Password123",
      firstName: "Linh",
      lastName: "Nguyen",
      sex: "female",
    });
  });

  test("POST /api/auth/signIn sets refresh token cookie", async () => {
    authServiceMock.signIn.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { _id: "user-1", fullName: "Linh Nguyen" },
    });

    const response = await request(app)
      .post("/api/auth/signIn")
      .send({ email: "linh@example.com", passWord: "Password123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ accessToken: "access-token", userId: "user-1" });
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=refresh-token");
    expect(authServiceMock.signIn).toHaveBeenCalledWith(
      "linh@example.com",
      "Password123",
      expect.any(String),
      undefined,
    );
  });

  test("POST /api/auth/signOut calls service and clears cookie", async () => {
    authServiceMock.signOut.mockResolvedValue();

    const response = await request(app)
      .post("/api/auth/signOut")
      .set("Cookie", ["refreshToken=refresh-token"]);

    expect(response.status).toBe(204);
    expect(authServiceMock.signOut).toHaveBeenCalledWith("refresh-token", undefined);
    expect(response.headers["set-cookie"].join(";")).toContain("refreshToken=");
  });
});
