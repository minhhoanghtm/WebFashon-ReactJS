import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { orderApi } from "../../api/order.api";
import CheckoutVoucherSelector from "../../components/CheckoutVoucherSelector";
import ShippingAddress from "./ShippingAddress";
import "./checkout.css";

const getInitialShippingAddress = (routeState) => {
  const possibleAddress = [
    routeState?.shippingAddress,
    routeState?.address,
    routeState?.deliveryAddress,
  ].find((item) => typeof item === "string" && item.trim());

  return possibleAddress || "";
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setCartItems } = useCartStore();
  const checkoutItems = location.state?.checkoutItems || items;
  const shippingAddressRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(() =>
    getInitialShippingAddress(location.state)
  );
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  const [appliedVoucher, setAppliedVoucher] = useState(null);

  const calculateSubtotal = () => {
    return checkoutItems.reduce(
      (sum, item) =>
        sum + Number(item.new_price || item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const calculateFinalTotal = () => {
    const sub = calculateSubtotal();
    const disc = appliedVoucher ? appliedVoucher.discountAmount : 0;
    return Math.max(0, sub - disc);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;
    if (!shippingAddressRef.current?.validate()) return;

    setLoading(true);

    try {
      const orderPayload = {
        fullName,
        phone,
        shippingAddress: address,
        paymentMethod: paymentMethod,
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          product_variant_id: item.variants?.[0]?._id || item.variant_id || null,
          quantity: item.quantity,
          price: item.new_price || item.price || 0,
        })),
        totalPrice: calculateFinalTotal(),
        voucherCode: appliedVoucher ? appliedVoucher.code : null,
      };

      const res = await orderApi.createOrder(orderPayload);
      if (res.success) {
        const remainingCartItems = items.filter(
          (item) =>
            !checkoutItems.some((checkoutItem) => checkoutItem._id === item._id)
        );
        setCartItems(remainingCartItems);
        alert("Đặt hàng thành công!");
        navigate("/orders");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
        Thanh toán
      </h2>
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold border-b border-gray-200 pb-4">
            Thông tin giao hàng
          </h3>
          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Số điện thoại
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <ShippingAddress
              ref={shippingAddressRef}
              value={address}
              onChange={setAddress}
            />

            <div className="mt-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all ${
                    paymentMethod === "COD"
                      ? "border-indigo-650 bg-indigo-50/20 ring-1 ring-indigo-650"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="sr-only"
                  />
                  <span className="flex flex-col justify-between h-full w-full">
                    <span className="block text-sm font-bold text-gray-900">
                      COD
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Thanh toán khi nhận hàng
                    </span>
                  </span>
                </label>

                <label
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all ${
                    paymentMethod === "MOMO"
                      ? "border-indigo-650 bg-indigo-50/20 ring-1 ring-indigo-650"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="MOMO"
                    checked={paymentMethod === "MOMO"}
                    onChange={() => setPaymentMethod("MOMO")}
                    className="sr-only"
                  />
                  <span className="flex flex-col justify-between h-full w-full">
                    <span className="block text-sm font-bold text-gray-900">
                      Ví MoMo
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Thanh toán qua ví MoMo
                    </span>
                  </span>
                </label>

                <label
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-all ${
                    paymentMethod === "VNPAY"
                      ? "border-indigo-650 bg-indigo-50/20 ring-1 ring-indigo-650"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={() => setPaymentMethod("VNPAY")}
                    className="sr-only"
                  />
                  <span className="flex flex-col justify-between h-full w-full">
                    <span className="block text-sm font-bold text-gray-900">
                      VNPay
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Thanh toán qua cổng VNPay
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || checkoutItems.length === 0}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-md"
            >
              {loading
                ? "Đang xử lý đơn hàng..."
                : `Đặt hàng (${paymentMethod}) - ${calculateFinalTotal().toLocaleString(
                    "vi-VN"
                  )}đ`}
            </button>
          </form>
        </div>

        <div className="mt-8 lg:mt-0 lg:col-span-5 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-6">
          <div>
            <h3 className="text-lg font-semibold border-b border-gray-200 pb-4">
              Đơn hàng của bạn
            </h3>
            <ul className="mt-6 divide-y divide-gray-200">
              {checkoutItems.map((item) => (
                <li key={item._id} className="flex py-4 justify-between text-sm">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-gray-500"> x {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {(
                      Number(item.new_price || item.price || 0) *
                      (item.quantity || 1)
                    ).toLocaleString("vi-VN")}
                    đ
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="checkout-summary-address">
            <span>Địa chỉ giao hàng</span>
            <strong>{address || "Chưa nhập địa chỉ giao hàng."}</strong>
          </div>

          <div className="border-t border-b border-gray-200 py-4">
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              appliedVoucher={appliedVoucher}
              onApply={(voucher) => setAppliedVoucher(voucher)}
              onRemove={() => setAppliedVoucher(null)}
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{calculateSubtotal().toLocaleString("vi-VN")}đ</span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between text-sm text-indigo-650 font-semibold">
                <span>Giảm giá (Voucher)</span>
                <span>-{appliedVoucher.discountAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-4 flex justify-between text-base font-bold text-gray-900 font-sans">
              <span>Tổng thanh toán</span>
              <span className="text-indigo-600 text-lg">
                {calculateFinalTotal().toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
