import { beforeAll, beforeEach, describe, expect, jest, test } from "@jest/globals";

const findById = jest.fn();
const emitOrderStatusChanged = jest.fn();
const emitPaymentUpdated = jest.fn();

jest.unstable_mockModule("../../order.repository.js", () => ({
  default: { findById },
}));
jest.unstable_mockModule("../cancelOrder.command.js", () => ({
  restoreOrderStock: jest.fn(),
}));
jest.unstable_mockModule("../../../../sockets/events.js", () => ({
  emitOrderStatusChanged,
  emitPaymentUpdated,
}));

let updateOrderStatus;

beforeAll(async () => {
  ({ updateOrderStatus } = await import("../updateOrderStatus.command.js"));
});

beforeEach(() => jest.clearAllMocks());

describe("admin order status update", () => {
  test("emits a status event after the order is saved", async () => {
    const order = {
      _id: "order-1",
      user_id: "customer-1",
      status: "pending",
      payment_status: "pending",
      payment_method: "cod",
      save: jest.fn(),
    };
    findById.mockResolvedValue(order);

    await updateOrderStatus("order-1", "confirmed");

    expect(order.save).toHaveBeenCalledTimes(1);
    expect(emitOrderStatusChanged).toHaveBeenCalledWith(order);
    expect(emitPaymentUpdated).not.toHaveBeenCalled();
  });
});
