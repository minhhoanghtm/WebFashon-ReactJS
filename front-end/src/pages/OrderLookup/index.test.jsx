import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const get = vi.fn();
const deleteGuestOrder = vi.fn();
vi.mock("@/api/axiosClient", () => ({ default: { get } }));
vi.mock("@/api/order.api", () => ({ orderApi: { deleteGuestOrder } }));
vi.mock("@/hooks/useWebsiteSettings", () => ({ useWebsiteSettings: () => ({ settings: {} }) }));
vi.mock("@/hooks/useDocumentTitle", () => ({ useDocumentTitle: () => {} }));

const renderPage = async () => {
  const Page = (await import("./index")).default;
  render(<MemoryRouter><Page /></MemoryRouter>);
  fireEvent.change(screen.getByTestId("lookup-order-code"), { target: { value: "guest-1" } });
  fireEvent.change(screen.getByTestId("lookup-order-phone"), { target: { value: "0900000000" } });
  fireEvent.click(screen.getByTestId("lookup-submit-btn"));
};

beforeEach(() => {
  cleanup();
  localStorage.clear(); vi.clearAllMocks();
  get.mockResolvedValue({ success: true, order: { _id: "guest-1", is_guest: true, status: "pending", createdAt: new Date().toISOString(), items: [], shipping_address: {}, total_price: 1, original_price: 1, payment_method: "cod", payment_status: "pending" } });
});

test("guest cancellation sends the stored token", async () => {
  localStorage.setItem("guest-order-token:guest-1", "saved-token");
  await renderPage();
  const button = await screen.findByTestId("guest-cancel-btn");
  fireEvent.click(button);
  expect(deleteGuestOrder).toHaveBeenCalledWith("guest-1", "saved-token");
});

test("guest without token shows guidance and does not call API", async () => {
  await renderPage();
  expect(await screen.findByTestId("guest-token-help")).toBeInTheDocument();
  expect(deleteGuestOrder).not.toHaveBeenCalled();
});

test("403 keeps token and shows a clear error", async () => {
  localStorage.setItem("guest-order-token:guest-1", "saved-token");
  deleteGuestOrder.mockRejectedValue({ response: { status: 403 } });
  await renderPage();
  fireEvent.click(await screen.findByTestId("guest-cancel-btn"));
  expect(await screen.findByTestId("guest-action-error")).toHaveTextContent("không đúng");
  expect(localStorage.getItem("guest-order-token:guest-1")).toBe("saved-token");
});
