import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

const settingsServiceMock = {
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
};

const authState = {
  authenticated: true,
  role: "admin",
};

jest.unstable_mockModule("../websiteSettings.service.js", () => ({
  default: settingsServiceMock,
}));

jest.unstable_mockModule("../../../middlewares/auth.middleware.js", () => ({
  protectedRoute: (req, res, next) => {
    if (!authState.authenticated) {
      return res.status(401).json({ success: false, message: "Khong tim thay access token" });
    }
    req.user = { userId: "user-1", role: authState.role };
    return next();
  },
  adminOnly: (req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Ban khong co quyen truy cap" });
    }
    return next();
  },
}));

const { default: websiteSettingsRouter } = await import("../websiteSettings.route.js");

const app = express();
app.use(express.json());
app.use("/api/settings", websiteSettingsRouter);

describe("WebsiteSettings Route Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authState.authenticated = true;
    authState.role = "admin";
  });

  it("GET /api/settings — should return website settings with homeContent", async () => {
    const mockData = {
      general: { siteName: "404 STUDIO" },
      homeContent: {
        hero: { titleLine1: "CẤU TRÚC TỐI GIẢN.", titleLine2: "BẢN SẮC ĐƯƠNG ĐẠI." },
      },
    };
    settingsServiceMock.getSettings.mockResolvedValue(mockData);

    const res = await request(app).get("/api/settings");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.homeContent.hero.titleLine1).toBe("CẤU TRÚC TỐI GIẢN.");
  });

  it("PUT /api/settings — should reject unauthenticated request with 401", async () => {
    authState.authenticated = false;

    const res = await request(app)
      .put("/api/settings")
      .send({ general: { siteName: "Hacked" } });

    expect(res.status).toBe(401);
  });

  it("PUT /api/settings — should reject non-admin user with 403", async () => {
    authState.authenticated = true;
    authState.role = "user";

    const res = await request(app)
      .put("/api/settings")
      .send({ general: { siteName: "User Try" } });

    expect(res.status).toBe(403);
  });

  it("PUT /api/settings — should allow admin to update general and homeContent", async () => {
    authState.authenticated = true;
    authState.role = "admin";

    const payload = {
      general: {
        siteName: "404 STUDIO ATELIER",
        email: "atelier@404studio.vn",
        hotline: "1900 404 000",
        address: "88 Đồng Khởi, Quận 1, TP.HCM",
      },
      homeContent: {
        hero: {
          titleLine1: "CẤU TRÚC TỐI GIẢN.",
          titleLine2: "BẢN SẮC ĐƯƠNG ĐẠI.",
        },
      },
    };

    settingsServiceMock.updateSettings.mockResolvedValue(payload);

    const res = await request(app)
      .put("/api/settings")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(settingsServiceMock.updateSettings).toHaveBeenCalled();
  });
});
