import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";

const orderFacadeMock = {
  createOrder: jest.fn(),
  getOrdersByUser: jest.fn(),
  updateOrder: jest.fn(),
  deleteOrder: jest.fn(),
  paymentOrder: jest.fn(),
  paymentCallback: jest.fn(),
  getKPIs: jest.fn(),
  getRevenueOverview: jest.fn(),
  getOrderStats: jest.fn(),
  getPurchasePerformance: jest.fn(),
  createOrderItem: jest.fn(),
  getOrderItemsByOrderId: jest.fn(),
  updateOrderItem: jest.fn(),
  deleteOrderItem: jest.fn(),
  getAdminOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
};

const authState = {
  authenticated: true,
  role: "user",
  userId: "user-1",
};

const orderModelMock = {
  findById: jest.fn(),
};

jest.unstable_mockModule("../order.facade.js", () => ({
  default: orderFacadeMock,
}));

jest.unstable_mockModule("../order.model.js", () => ({
  Order: orderModelMock,
  OrderItem: { find: jest.fn() },
  default: orderModelMock,
}));

jest.unstable_mockModule("../../../middlewares/auth.middleware.js", () => ({
  protectedRoute: (req, res, next) => {
    if (!authState.authenticated) {
      return res.status(401).json({ success: false, message: "Khong tim thay access token" });
    }

    req.user = { userId: authState.userId, role: authState.role };
    return next();
  },
  adminOnly: (req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Ban khong co quyen truy cap" });
    }

    return next();
  },
  noAdmin: (req, res, next) => {
    if (!authState.authenticated) {
      return res.status(401).json({ success: false, message: "Khong tim thay access token" });
    }

    req.user = { userId: authState.userId, role: authState.role };
    if (authState.role === "admin") {
      return res.status(403).json({ success: false, message: "Quan tri vien khong duoc phep" });
    }

    return next();
  },
}));

const { orderRouter } = await import("../order.route.js");
const { default: errorHandler } = await import("../../../middlewares/error.middleware.js");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/order", orderRouter);
  app.use(errorHandler);
  return app;
};

describe("Order routes", () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    authState.authenticated = true;
    authState.role = "user";
    authState.userId = "user-1";
    jest.clearAllMocks();
  });

  test("GET /api/order requires authentication", async () => {
    authState.authenticated = false;

    const response = await request(app).get("/api/order");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(orderFacadeMock.getOrdersByUser).not.toHaveBeenCalled();
  });

  test("GET /api/order returns orders for current user", async () => {
    const orders = [{ _id: "order-1", total_price: 150000 }];
    orderFacadeMock.getOrdersByUser.mockResolvedValue(orders);

    const response = await request(app).get("/api/order");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, orders });
    expect(orderFacadeMock.getOrdersByUser).toHaveBeenCalledWith("user-1");
  });

  test("POST /api/order creates order for current user", async () => {
    const order = { _id: "order-1", status: "pending" };
    const payload = {
      items: [{ product_id: "product-1", quantity: 2 }],
      shipping_address: { full_name: "Linh", phone: "0900000000" },
      payment_method: "cod",
    };
    orderFacadeMock.createOrder.mockResolvedValue(order);

    const response = await request(app).post("/api/order").send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.order).toEqual(order);
    expect(orderFacadeMock.createOrder).toHaveBeenCalledWith("user-1", payload);
  });

  test("PATCH /api/order/admin/orders/:id/status rejects non-admin users", async () => {
    authState.role = "user";

    const response = await request(app)
      .patch("/api/order/admin/orders/order-1/status")
      .send({ status: "confirmed" });

    expect(response.status).toBe(403);
    expect(orderFacadeMock.updateOrderStatus).not.toHaveBeenCalled();
  });

  test("PATCH /api/order/admin/orders/:id/status validates status", async () => {
    authState.role = "admin";

    const response = await request(app)
      .patch("/api/order/admin/orders/order-1/status")
      .send({ status: "unknown" });

    expect(response.status).toBe(400);
    expect(orderFacadeMock.updateOrderStatus).not.toHaveBeenCalled();
  });

  test("PATCH /api/order/admin/orders/:id/status updates status for admin", async () => {
    authState.role = "admin";
    const updatedOrder = { _id: "order-1", status: "confirmed" };
    orderFacadeMock.updateOrderStatus.mockResolvedValue(updatedOrder);

    const response = await request(app)
      .patch("/api/order/admin/orders/order-1/status")
      .send({ status: "confirmed" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(updatedOrder);
    expect(orderFacadeMock.updateOrderStatus).toHaveBeenCalledWith("order-1", "confirmed");
  });

  test("user A cannot update or delete an order owned by user B", async () => {
    authState.userId = "user-a";
    orderModelMock.findById.mockResolvedValue({ _id: "order-b", user_id: "user-b" });

    const updateResponse = await request(app)
      .put("/api/order/order-b")
      .send({ note: "change" });
    const deleteResponse = await request(app).delete("/api/order/order-b");

    expect(updateResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(orderFacadeMock.updateOrder).not.toHaveBeenCalled();
    expect(orderFacadeMock.deleteOrder).not.toHaveBeenCalled();
  });

  test("guest order update is rejected without its access token", async () => {
    const response = await request(app)
      .put("/api/order/guest/guest-order")
      .send({ note: "change" });

    expect(response.status).toBe(401);
    expect(orderFacadeMock.updateOrder).not.toHaveBeenCalled();
  });

  test("account payment requires authentication", async () => {
    authState.authenticated = false;

    const response = await request(app)
      .post("/api/order/payment")
      .send({ orderId: "order-1", payment_method: "cod" });

    expect(response.status).toBe(401);
    expect(orderFacadeMock.paymentOrder).not.toHaveBeenCalled();
  });

  test("guest order update and delete require a matching access token", async () => {
    const token = "guest-secret-token";
    const tokenHash = (await import("crypto"))
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const select = jest.fn().mockResolvedValue({
      _id: "guest-order",
      user_id: null,
      is_guest: true,
      guest_access_token_hash: tokenHash,
    });
    orderModelMock.findById.mockReturnValue({ select });
    orderFacadeMock.updateOrder.mockResolvedValue({ _id: "guest-order" });
    orderFacadeMock.deleteOrder.mockResolvedValue({ _id: "guest-order" });

    const updateResponse = await request(app)
      .put("/api/order/guest/guest-order")
      .set("x-guest-order-token", token)
      .send({ note: "change" });
    const deleteResponse = await request(app)
      .delete("/api/order/guest/guest-order")
      .set("x-guest-order-token", token);

    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(orderFacadeMock.updateOrder).toHaveBeenCalledWith("guest-order", { note: "change" });
    expect(orderFacadeMock.deleteOrder).toHaveBeenCalledWith("guest-order");
  });

  test("guest payment succeeds only with a matching access token", async () => {
    const token = "guest-payment-token";
    const tokenHash = (await import("crypto"))
      .createHash("sha256")
      .update(token)
      .digest("hex");
    orderModelMock.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "guest-order",
        user_id: null,
        is_guest: true,
        guest_access_token_hash: tokenHash,
      }),
    });
    orderFacadeMock.paymentOrder.mockResolvedValue({ success: true, message: "OK", order: { _id: "guest-order" } });

    const response = await request(app)
      .post("/api/order/guest/guest-order/payment")
      .set("x-guest-order-token", token)
      .send({ payment_method: "cod" });

    expect(response.status).toBe(200);
    expect(orderFacadeMock.paymentOrder).toHaveBeenCalledWith(
      null,
      "guest-order",
      "cod",
      { guestAuthorized: true },
    );
  });

  test("a null user_id is never treated as ownership of a signed-in user", async () => {
    orderModelMock.findById.mockResolvedValue({ _id: "guest-order", user_id: null, is_guest: true });

    const response = await request(app)
      .put("/api/order/guest-order")
      .send({ note: "change" });

    expect(response.status).toBe(403);
    expect(orderFacadeMock.updateOrder).not.toHaveBeenCalled();
  });
});
