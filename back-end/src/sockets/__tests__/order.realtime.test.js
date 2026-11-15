import { describe, expect, test } from "@jest/globals";
import { emitOrderEvent } from "../events.js";

describe("order realtime event audience", () => {
  test("delivers an admin status update to the order owner room", () => {
    const rooms = new Map();
    const io = {
      to: (room) => {
        if (!rooms.has(room)) rooms.set(room, { emit: (...args) => rooms.get(room).events.push(args), events: [] });
        return rooms.get(room);
      },
    };
    const order = {
      _id: "order-1",
      user_id: "customer-1",
      status: "shipping",
      payment_status: "pending",
    };

    emitOrderEvent(io, "order:status_changed", order);

    expect(rooms.get("user:customer-1").events).toEqual([
      ["order:status_changed", expect.objectContaining({ orderId: "order-1" })],
    ]);
    expect(rooms.get("admin-room").events).toHaveLength(1);
    expect(rooms.get("order:order-1").events).toHaveLength(1);
  });
});
