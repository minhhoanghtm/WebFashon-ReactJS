import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { useAuthStore } from "../../store/auth.store";
import { orderApi } from "../../api/order.api";
import CheckoutVoucherSelector from "../../components/CheckoutVoucherSelector";
import ShippingAddress from "./ShippingAddress";
import { 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  Edit2 
} from "lucide-react";
import "./checkout.css";

const getInitialShippingAddress = (routeState) => {
  const possibleAddress = [
    routeState?.shippingAddress,
    routeState?.address,
    routeState?.deliveryAddress,
  ].find((item) => typeof item === "string" && item.trim());

  return possibleAddress || "";
};

const getAddresses = (profile = {}) => {
  if (Array.isArray(profile.addresses)) return profile.addresses;
  if (Array.isArray(profile.address)) return profile.address;
  if (profile.address && typeof profile.address === "object") return [profile.address];
  return [];
};

const getPrimaryAddress = (profile = {}) =>
  getAddresses(profile).find((address) => address?.isDefault) ||
  getAddresses(profile)[0] ||
  null;

const formatAddress = (address) => {
  if (!address) return "";
  const parts = [
    address.addressDetail || address.detail,
    address.ward || address.wardName || address.wardCode,
    address.district || address.districtName || address.districtCode,
    address.city || address.province || address.provinceName || address.provinceCode,
  ].filter(Boolean);
  return parts.join(", ");
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setCartItems } = useCartStore();
  const { user } = useAuthStore();
  const checkoutItems = location.state?.checkoutItems || items;
  const shippingAddressRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(() =>
    getInitialShippingAddress(location.state)
  );
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [hasInitializedFromUser, setHasInitializedFromUser] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !hasInitializedFromUser) {
      const primaryAddress = getPrimaryAddress(user);
      if (primaryAddress) {
        setFullName(primaryAddress.fullName || user.fullName || user.name || "");
        setPhone(primaryAddress.phone || user.phone || user.phoneNumber || "");
        const formatted = formatAddress(primaryAddress);
        setAddress(formatted);
        setIsEditingAddress(false);
      } else {
        setFullName(user.fullName || user.name || "");
        setPhone(user.phone || user.phoneNumber || "");
        setIsEditingAddress(true);
      }
      setHasInitializedFromUser(true);
    }
  }, [user, hasInitializedFromUser]);

  // Voucher states
  const [appliedVoucher, setAppliedVoucher] = useState(location.state?.appliedCoupon || null);
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState(location.state?.appliedShippingCoupon || null);

  const calculateSubtotal = () => {
    return checkoutItems.reduce(
      (sum, item) =>
        sum + Number(item.new_price || item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const calculateShippingFee = () => {
    const sub = calculateSubtotal();
    if (sub >= 1000000 || sub === 0) return 0;
    const baseShipping = 30000;
    const shipDisc = appliedShippingVoucher ? (appliedShippingVoucher.discountAmount || appliedShippingVoucher.discount_amount || 0) : 0;
    return Math.max(0, baseShipping - shipDisc);
  };

  const calculateFinalTotal = () => {
    const sub = calculateSubtotal();
    const disc = appliedVoucher ? (appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0) : 0;
    const shipFee = calculateShippingFee();
    return Math.max(0, sub - disc + shipFee);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;
    
    if (isEditingAddress) {
      if (!shippingAddressRef.current?.validate()) return;
    } else {
      if (!fullName.trim() || !phone.trim() || !address.trim()) {
        alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
        return;
      }
    }

    setLoading(true);

    try {
      const activeVoucherCodes = [
        appliedVoucher?.code,
        appliedShippingVoucher?.code
      ].filter(Boolean).join(",");

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
        voucherCode: activeVoucherCodes || null,
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
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {/* Stepper */}
      <div className="flex justify-center items-center gap-2 text-xs md:text-sm font-medium border-b border-gray-150 dark:border-slate-850 pb-6">
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-850 text-[10px] font-bold">1</span>
          <span>Giỏ hàng</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-slate-700" />
        <div className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 font-semibold animate-pulse">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold">2</span>
          <span>Thông tin thanh toán</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-slate-700" />
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-850 text-[10px] font-bold">3</span>
          <span>Hoàn tất đơn hàng</span>
        </div>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Thanh toán
      </h2>
      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/70 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            Thông tin giao hàng
          </h3>
          <form onSubmit={handlePlaceOrder} className="mt-6 space-y-6">
            {!isEditingAddress ? (
              <div className="checkout-address-summary border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/5 dark:bg-indigo-950/5 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-sm text-gray-800 dark:text-slate-200">
                      <User className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold">{fullName}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-gray-800 dark:text-slate-200">
                      <Phone className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-medium">{phone}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{address}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 text-indigo-650 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-xs font-bold transition cursor-pointer animate-fade-in"
                  >
                    <Edit2 className="h-3 w-3" />
                    Thay đổi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Địa chỉ giao hàng</span>
                  {user && getPrimaryAddress(user) && (
                    <button
                      type="button"
                      onClick={() => {
                        const primaryAddress = getPrimaryAddress(user);
                        setFullName(primaryAddress.fullName || user.fullName || user.name || "");
                        setPhone(primaryAddress.phone || user.phone || user.phoneNumber || "");
                        setAddress(formatAddress(primaryAddress));
                        setIsEditingAddress(false);
                      }}
                      className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Dùng thông tin mặc định
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1.5 block w-full bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 rounded-xl border border-gray-300 dark:border-slate-800 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1.5 block w-full bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 rounded-xl border border-gray-300 dark:border-slate-800 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <ShippingAddress
                  ref={shippingAddressRef}
                  value={address}
                  onChange={setAddress}
                />
              </div>
            )}

            <div className="mt-6">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label
                  className={`payment-card ${
                    paymentMethod === "COD"
                      ? "payment-card--active payment-card--cod"
                      : "payment-card--inactive"
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
                    <span className="block text-sm font-bold text-gray-900 dark:text-slate-100">
                      COD
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">
                      Thanh toán khi nhận hàng
                    </span>
                  </span>
                </label>

                <label
                  className={`payment-card ${
                    paymentMethod === "MOMO"
                      ? "payment-card--active payment-card--momo"
                      : "payment-card--inactive"
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
                    <span className="block text-sm font-bold text-gray-900 dark:text-slate-100">
                      Ví MoMo
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">
                      Thanh toán qua ví MoMo
                    </span>
                  </span>
                </label>

                <label
                  className={`payment-card ${
                    paymentMethod === "VNPAY"
                      ? "payment-card--active payment-card--vnpay"
                      : "payment-card--inactive"
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
                    <span className="block text-sm font-bold text-gray-900 dark:text-slate-100">
                      VNPay
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-slate-400">
                      Thanh toán qua cổng VNPay
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || checkoutItems.length === 0}
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm transition-all disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              {loading
                ? "Đang xử lý đơn hàng..."
                : `Đặt hàng (${paymentMethod}) - ${calculateFinalTotal().toLocaleString(
                    "vi-VN"
                  )}đ`}
            </button>
          </form>
        </div>

        <div className="mt-8 lg:mt-0 lg:col-span-5 bg-gray-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm h-fit space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-4">
              Đơn hàng của bạn
            </h3>
            <ul className="mt-6 divide-y divide-gray-100 dark:divide-slate-800/80">
              {checkoutItems.map((item) => {
                const color = item.variants?.[0]?.color;
                const size = item.variants?.[0]?.size;
                return (
                  <li key={item._id} className="flex py-4 gap-4 items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover border border-gray-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">SL: {item.quantity}</span>
                        {(color || size) && (
                          <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                            {[color, size].filter(Boolean).join(" / ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-sm text-gray-950 dark:text-white shrink-0">
                      {(
                        Number(item.new_price || item.price || 0) *
                        (item.quantity || 1)
                      ).toLocaleString("vi-VN")}đ
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="checkout-summary-address border-t border-gray-150 dark:border-slate-800/80 pt-4">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">Địa chỉ giao hàng</span>
            <strong className="text-sm font-medium text-gray-800 dark:text-slate-200 mt-1 block leading-relaxed">{address || "Chưa nhập địa chỉ giao hàng."}</strong>
          </div>

          {/* Voucher Section */}
          <div className="border-t border-b border-gray-200 dark:border-slate-850 py-4 space-y-4">
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              items={checkoutItems}
              shippingFee={calculateSubtotal() >= 1000000 || calculateSubtotal() === 0 ? 0 : 30000}
              appliedVoucher={appliedVoucher}
              onApply={(voucher) => setAppliedVoucher(voucher)}
              onRemove={() => setAppliedVoucher(null)}
              voucherType="product"
              label="Chọn Voucher sản phẩm"
            />
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              items={checkoutItems}
              shippingFee={calculateSubtotal() >= 1000000 || calculateSubtotal() === 0 ? 0 : 30000}
              appliedVoucher={appliedShippingVoucher}
              onApply={(voucher) => setAppliedShippingVoucher(voucher)}
              onRemove={() => setAppliedShippingVoucher(null)}
              voucherType="shipping"
              label="Chọn Voucher vận chuyển"
            />
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
              <span>Tạm tính</span>
              <span className="text-gray-950 dark:text-white font-medium">{calculateSubtotal().toLocaleString("vi-VN")}đ</span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Giảm giá (Voucher sản phẩm)</span>
                <span>-{(appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            {appliedShippingVoucher && (
              <div className="flex justify-between text-sm text-blue-650 dark:text-blue-400 font-semibold">
                <span>Giảm giá (Voucher vận chuyển)</span>
                <span>-{(appliedShippingVoucher.discountAmount || appliedShippingVoucher.discount_amount || 0).toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
              <span>Phí vận chuyển</span>
              <span className="text-gray-950 dark:text-white font-medium">{calculateShippingFee() === 0 ? "Miễn phí" : `${calculateShippingFee().toLocaleString("vi-VN")}đ`}</span>
            </div>
            <div className="border-t border-gray-150 dark:border-slate-800/80 pt-4 flex justify-between text-base font-bold text-gray-900 dark:text-white">
              <span>Tổng thanh toán</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-xl font-extrabold">
                {calculateFinalTotal().toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {/* Secure Guarantee */}
          <div className="pt-4 border-t border-gray-150 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-slate-500">
              <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Thanh toán an toàn bảo mật 100%</span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-slate-500">
              <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Chính sách đổi trả hàng dễ dàng trong 7 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
