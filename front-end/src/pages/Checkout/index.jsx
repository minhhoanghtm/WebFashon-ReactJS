import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCartStore } from "../../store/cart.store";
import { useAuthStore } from "../../store/auth.store";
import { orderApi } from "../../api/order.api";
import { paymentApi } from "../../api/payment.api";
import CheckoutVoucherSelector from "../../components/CheckoutVoucherSelector";
import ShippingAddress from "./ShippingAddress";
import {
  User,
  Phone,
  MapPin,
  ArrowRight,
  Lock,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import "./checkout.css";
import { toast } from "react-toastify";
import { shippingApi } from "@/api/shipping.api";

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
  if (profile.address && typeof profile.address === "object")
    return [profile.address];
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
    address.city ||
      address.province ||
      address.provinceName ||
      address.provinceCode,
  ].filter(Boolean);
  return parts.join(", ");
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setCartItems } = useCartStore();
  const { user } = useAuthStore();
  const checkoutItems = location.state?.checkoutItems || items;

  const normalizedCheckoutItems = useMemo(() => {
    return (checkoutItems || []).map((item) => {
      const name =
        item.name || item.product_name || item.product_id?.name || "Sản phẩm";
      const image =
        item.image || item.product_image || item.product_id?.image || "";

      let color = item.color || item.variant_id?.color;
      let size = item.size || item.variant_id?.size;

      if (!color && !size && item.variant) {
        const parts = item.variant.split(" - ");
        if (parts.length === 2) {
          color = parts[0];
          size = parts[1];
        } else {
          color = item.variant;
        }
      }

      if (!color && item.variants?.[0]) {
        color = item.variants[0].color;
      }
      if (!size && item.variants?.[0]) {
        size = item.variants[0].size;
      }

      return {
        ...item,
        name,
        image,
        color,
        size,
      };
    });
  }, [checkoutItems]);
  const shippingAddressRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(() =>
    getInitialShippingAddress(location.state),
  );
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [backupInfo, setBackupInfo] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [hasInitializedFromUser, setHasInitializedFromUser] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = user?.role || user?.data?.role || "";
    if (role === "admin") {
      toast.error("Quản trị viên không thể thực hiện thanh toán mua hàng!");
      navigate("/");
    }
  }, [user, navigate]);

  const [shippingFee, setShippingFee] = useState(30000); //mặc định 30k, sẽ được cập nhật nếu có voucher vận chuyển hoặc đơn hàng đủ điều kiện freeship
  const [loadingFee, setLoadingFee] = useState(false);
  //Tính lại phí vận chuyển mỗi khi địa chỉ hoặc giỏ hàng thay đổi, trừ khi đang áp dụng voucher freeship
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardCode, setSelectedWardCode] = useState(null);

  //GỌi APi tính phí vận chuyển
  const fetchShippingFee = async (districtId, wardCode) => {
    if (!districtId || !wardCode) return;

    setLoadingFee(true);
    try {
      const payload = {
        districtId,
        wardCode,
        weight: 500, //Trọng lượng mặc định là 500g
        serviceTypeId: 2, //Loại dịch vụ vận chuyển
      };

      const res = await shippingApi.calculateFee(payload);
      if (res.success && res.data) {
        setShippingFee(res.data.total);
      }
    } catch (error) {
      console.error("Lỗi khi tính phí vận chuyển:", error);
      toast.error("Không thể tính phí vận chuyển. Vui lòng thử lại.");
      setShippingFee(30000); // fallback về phí mặc định
    } finally {
      setLoadingFee(false);
    }
  };
  // Theo dõi sự thay đổi của Địa chỉ để tự động tính lại phí vận chuyển
  useEffect(() => {
    console.log(
      "Selected Location changed - District ID:",
      selectedDistrictId,
      "Ward Code:",
      selectedWardCode,
    );
    if (selectedDistrictId && selectedWardCode) {
      fetchShippingFee(selectedDistrictId, selectedWardCode);
    }
  }, [selectedDistrictId, selectedWardCode]);

  useEffect(() => {
    console.log("Shipping Fee state updated to:", shippingFee);
  }, [shippingFee]);

  useEffect(() => {
    if (user && !hasInitializedFromUser) {
      const primaryAddress = getPrimaryAddress(user);
      if (primaryAddress) {
        const initialName =
          primaryAddress.fullName || user.fullName || user.name || "";
        const initialPhone =
          primaryAddress.phone || user.phone || user.phoneNumber || "";
        const formatted = formatAddress(primaryAddress);

        setFullName(initialName);
        setPhone(initialPhone);
        setAddress(formatted);
        setIsEditingAddress(false);
        setBackupInfo({
          fullName: initialName,
          phone: initialPhone,
          address: formatted,
        });
      } else {
        setFullName(user.fullName || user.name || "");
        setPhone(user.phone || user.phoneNumber || "");
        setIsEditingAddress(true);
      }
      setHasInitializedFromUser(true);
    }
  }, [user, hasInitializedFromUser]);

  // Voucher states
  const [appliedVoucher, setAppliedVoucher] = useState(
    location.state?.appliedCoupon || null,
  );
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState(
    location.state?.appliedShippingCoupon || null,
  );

  const calculateSubtotal = () => {
    return normalizedCheckoutItems.reduce(
      (sum, item) =>
        sum + Number(item.new_price || item.price || 0) * (item.quantity || 1),
      0,
    );
  };

  const calculateShippingFee = () => {
    const sub = calculateSubtotal();
    if (sub >= 1000000 || sub === 0) return 0;
    const baseShipping = shippingFee;
    const shipDisc = appliedShippingVoucher
      ? appliedShippingVoucher.discountAmount ||
        appliedShippingVoucher.discount_amount ||
        0
      : 0;
    return Math.max(0, baseShipping - shipDisc);
  };

  const calculateFinalTotal = () => {
    const sub = calculateSubtotal();
    const disc = appliedVoucher
      ? appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0
      : 0;
    const shipFee = calculateShippingFee();
    return Math.max(0, sub - disc + shipFee);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (normalizedCheckoutItems.length === 0) return;

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
        appliedShippingVoucher?.code,
      ]
        .filter(Boolean)
        .join(",");

      const orderPayload = {
        fullName,
        phone,
        shippingAddress: address,
        paymentMethod: paymentMethod,
        items: normalizedCheckoutItems.map((item) => ({
          product_id: item.product_id,
          product_variant_id:
            item.variants?.[0]?._id || item.variant_id || null,
          quantity: item.quantity,
          price: item.new_price || item.price || 0,
        })),
        totalPrice: calculateFinalTotal(),
        shippingFee: calculateShippingFee(),
        voucherCode: activeVoucherCodes || null,
      };

      const res = await orderApi.createOrder(orderPayload);
      if (res.success) {
        const remainingCartItems = items.filter(
          (item) =>
            !normalizedCheckoutItems.some(
              (checkoutItem) => checkoutItem._id === item._id,
            ),
        );
        setCartItems(remainingCartItems);

        const orderId = res.order?._id || res.order?.id;

        if (paymentMethod === "MOMO") {
          try {
            const payRes = await paymentApi.createMomoPayment(orderId);
            if (payRes.success && payRes.paymentUrl) {
              window.location.href = payRes.paymentUrl;
              return;
            } else {
              toast.error(
                "Đơn hàng đã tạo nhưng không thể khởi tạo liên kết thanh toán MoMo.",
              );
              navigate("/orders");
            }
          } catch (payErr) {
            console.error("Momo payment error:", payErr);
            toast.error("Đơn hàng đã tạo nhưng gặp lỗi kết nối với MoMo.");
            navigate("/orders");
          }
        } else if (paymentMethod === "VNPAY") {
          try {
            const payRes = await paymentApi.createVNPayPayment(orderId);
            if (payRes.success && payRes.paymentUrl) {
              window.location.href = payRes.paymentUrl;
              return;
            } else {
              toast.error(
                "Đơn hàng đã tạo nhưng không thể khởi tạo liên kết thanh toán VNPay.",
              );
              navigate("/orders");
            }
          } catch (payErr) {
            console.error("VNPay payment error:", payErr);
            toast.error("Đơn hàng đã tạo nhưng gặp lỗi kết nối với VNPay.");
            navigate("/orders");
          }
        } else {
          toast.success("Đặt hàng thành công!");
          navigate("/orders");
        }
      }
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || "Không thể đặt hàng. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-8">
      {/* Stepper */}
      <div className="flex justify-center items-center gap-2 text-xs md:text-sm font-medium border-b border-gray-150 dark:border-slate-850 pb-6">
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-850 text-[10px] font-bold">
            1
          </span>
          <span>Giỏ hàng</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-slate-700" />
        <div className="flex items-center gap-1.5 text-indigo-650 dark:text-indigo-400 font-semibold animate-pulse">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold">
            2
          </span>
          <span>Thông tin thanh toán</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-slate-700" />
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-850 text-[10px] font-bold">
            3
          </span>
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
                    onClick={() => {
                      setBackupInfo({ fullName, phone, address });
                      setIsEditingAddress(true);
                    }}
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
                  <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Địa chỉ giao hàng
                  </span>
                  {user && getPrimaryAddress(user) && (
                    <button
                      type="button"
                      onClick={() => {
                        const primaryAddress = getPrimaryAddress(user);
                        setFullName(
                          primaryAddress.fullName ||
                            user.fullName ||
                            user.name ||
                            "",
                        );
                        setPhone(
                          primaryAddress.phone ||
                            user.phone ||
                            user.phoneNumber ||
                            "",
                        );
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
                  onLocationSelect={({ districtCode, wardCode }) => {
                    setSelectedDistrictId(districtCode || null);
                    setSelectedWardCode(wardCode || null);
                  }}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  {/* Cancel Button */}
                  {(backupInfo.address ||
                    (user && getPrimaryAddress(user))) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFullName(backupInfo.fullName);
                        setPhone(backupInfo.phone);
                        setAddress(backupInfo.address);
                        setIsEditingAddress(false);
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-350 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Hủy
                    </button>
                  )}
                  {/* Confirm Button */}
                  <button
                    type="button"
                    disabled={
                      !fullName.trim() || !phone.trim() || !address.trim()
                    }
                    onClick={() => {
                      if (!fullName.trim() || !phone.trim()) {
                        alert("Vui lòng điền đầy đủ Họ tên và Số điện thoại!");
                        return;
                      }
                      if (
                        shippingAddressRef.current &&
                        !shippingAddressRef.current.validate()
                      ) {
                        return;
                      }
                      setIsEditingAddress(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xác nhận địa chỉ
                  </button>
                </div>
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
              disabled={
                loading ||
                normalizedCheckoutItems.length === 0 ||
                isEditingAddress ||
                !fullName.trim() ||
                !phone.trim() ||
                !address.trim()
              }
              className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              {loading
                ? "Đang xử lý đơn hàng..."
                : `Đặt hàng (${paymentMethod}) - ${calculateFinalTotal().toLocaleString(
                    "vi-VN",
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
              {normalizedCheckoutItems.map((item) => {
                const color = item.color;
                const size = item.size;
                return (
                  <li key={item._id} className="flex py-4 gap-4 items-center">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-contain border border-gray-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-950"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                          SL: {item.quantity}
                        </span>
                        {(color || size) && (
                          <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                            {[color, size].filter(Boolean).join(" / ")}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                        Giá:{" "}
                        {item.new_price?.toLocaleString("vi-VN") ||
                          item.price?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <span className="font-bold text-sm text-gray-950 dark:text-white shrink-0">
                      {(
                        Number(item.new_price || item.price || 0) *
                        (item.quantity || 1)
                      ).toLocaleString("vi-VN")}
                      đ
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="checkout-summary-address border-t border-gray-150 dark:border-slate-800/80 pt-4">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
              Địa chỉ giao hàng
            </span>
            <strong className="text-sm font-medium text-gray-800 dark:text-slate-200 mt-1 block leading-relaxed">
              {address || "Chưa nhập địa chỉ giao hàng."}
            </strong>
          </div>

          {/* Voucher Section */}
          <div className="border-t border-b border-gray-200 dark:border-slate-850 py-4 space-y-4">
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              items={normalizedCheckoutItems}
              shippingFee={
                calculateSubtotal() >= 1000000 || calculateSubtotal() === 0
                  ? 0
                  : 30000
              }
              appliedVoucher={appliedVoucher}
              onApply={(voucher) => setAppliedVoucher(voucher)}
              onRemove={() => setAppliedVoucher(null)}
              voucherType="product"
              label="Chọn Voucher sản phẩm"
            />
            <CheckoutVoucherSelector
              subtotal={calculateSubtotal()}
              items={normalizedCheckoutItems}
              shippingFee={
                calculateSubtotal() >= 1000000 || calculateSubtotal() === 0
                  ? 0
                  : 30000
              }
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
              <span className="text-gray-950 dark:text-white font-medium">
                {calculateSubtotal().toLocaleString("vi-VN")}đ
              </span>
            </div>
            {appliedVoucher && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Giảm giá (Voucher sản phẩm)</span>
                <span>
                  -
                  {(
                    appliedVoucher.discountAmount ||
                    appliedVoucher.discount_amount ||
                    0
                  ).toLocaleString("vi-VN")}
                  đ
                </span>
              </div>
            )}
            {appliedShippingVoucher && (
              <div className="flex justify-between text-sm text-blue-650 dark:text-blue-400 font-semibold">
                <span>Giảm giá (Voucher vận chuyển)</span>
                <span>
                  -
                  {(
                    appliedShippingVoucher.discountAmount ||
                    appliedShippingVoucher.discount_amount ||
                    0
                  ).toLocaleString("vi-VN")}
                  đ
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400">
              <span>Phí vận chuyển:</span>
              <span className="text-gray-950 dark:text-white font-medium">
                {loadingFee
                  ? "Đang tính..."
                  : calculateShippingFee() === 0
                  ? "Miễn phí"
                  : `${calculateShippingFee().toLocaleString("vi-VN")}đ`}
              </span>
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
