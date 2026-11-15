import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getInitialShippingAddress } from "@/utils/checkoutAddress";

vi.mock("@/hooks/useWebsiteSettings", () => ({
  useWebsiteSettings: () => ({ settings: null }),
}));
vi.mock("@/hooks/useDocumentTitle", () => ({ useDocumentTitle: () => {} }));

const renderRoutes = (entry, element) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route path="/" element={<p>Home page</p>} />
      <Route path="/private" element={element} />
    </Routes>
  </MemoryRouter>,
);

describe("core customer flows", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    useAuthStore.setState({ isAuthenticated: false, user: null, isLoading: false });
  });

  test("auth state marks a user as authenticated", () => {
    useAuthStore.getState().setUser({ id: "u1", role: "user" });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, user: { id: "u1" } });
  });

  test("cart merges duplicate products and calculates total", () => {
    useCartStore.getState().addItem({ _id: "p1", price: 100, quantity: 1 });
    useCartStore.getState().addItem({ _id: "p1", price: 100, quantity: 2 });
    expect(useCartStore.getState().getTotalQuantity()).toBe(3);
    expect(useCartStore.getState().getTotalPrice()).toBe(300);
  });

  test("checkout uses the shipping address supplied by route state", () => {
    expect(getInitialShippingAddress({ shippingAddress: "12 Nguyễn Huệ" })).toBe("12 Nguyễn Huệ");
    expect(getInitialShippingAddress({})).toBe("");
  });

  test("route guard redirects unauthenticated visitors to login", () => {
    renderRoutes("/private", <ProtectedRoute element={<p>Private page</p>} />);
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  test("payment result shows guest order lookup for a guest", async () => {
    const PaymentResult = (await import("@/pages/PaymentResult")).default;
    render(
      <MemoryRouter initialEntries={["/payment-result?success=true&orderCode=ABC12345&guest=true"]}>
        <PaymentResult />
      </MemoryRouter>,
    );
    expect(screen.getByText("Đặt hàng thành công")).toBeInTheDocument();
    expect(screen.getByTestId("track-guest-order-btn")).toBeInTheDocument();
  });
});
