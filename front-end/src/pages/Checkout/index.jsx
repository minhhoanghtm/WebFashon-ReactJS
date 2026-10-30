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
import Swal from "sweetalert2";
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
      if (err.response?.status === 409) {
        Swal.fire({
          title: "Thông báo giá / suất ưu đãi",
          text:
            err.response?.data?.message ||
            "Giá sản phẩm hoặc suất ưu đãi Flash Sale đã thay đổi. Vui lòng quay lại giỏ hàng kiểm tra.",
          icon: "warning",
          confirmButtonText: "Quay về giỏ hàng",
        }).then(() => {
          navigate("/cart");
        });
        return;
      }
      toast.error(
        err.response?.data?.message || "Không thể đặt hàng. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-stone-950 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1536px] space-y-8">
        {/* Editorial Checkout Stepper */}
        <div className="flex justify-center items-center gap-3 md:gap-6 text-xs md:text-sm font-medium border-b border-stone-200 dark:border-stone-850 pb-6">
          <div
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-700 dark:text-stone-500 cursor-pointer transition-colors"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 dark:border-stone-700 text-[10px] font-bold">
              1
            </span>
            <span>Giỏ hàng</span>
          </div>
          <div className="h-px w-6 md:w-12 bg-stone-300 dark:bg-stone-800" />
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#05251C] text-[#F5DD20] text-[10px] font-bold shadow-sm">
              2
            </span>
            <span>Thông tin & Thanh toán</span>
          </div>
          <div className="h-px w-6 md:w-12 bg-stone-300 dark:bg-stone-800" />
          <div className="flex items-center gap-2 text-stone-400 dark:text-stone-600">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-200 dark:border-stone-800 text-[10px] font-bold">
              3
            </span>
            <span>Hoàn tất</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#05251C]">
            Quy trình thanh toán an toàn
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-[#05251C] dark:text-white mt-1">
            Xác nhận đơn hàng
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Form: Shipping & Payment */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-6 md:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-[0_2px_12px_-4px_rgba(28,25,23,0.04)] h-fit space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2 tracking-tight">
                <User className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                Thông tin nhận hàng
              </h3>
              {user && getPrimaryAddress(user) && isEditingAddress && (
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
                  className="text-xs font-semibold text-neutral-900 dark:text-stone-300 underline underline-offset-4 hover:text-[#05251C] transition cursor-pointer"
                >
                  Dùng địa chỉ mặc định
                </button>
              )}
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {!isEditingAddress ? (
                <div className="checkout-address-summary border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-5 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-stone-400 shrink-0" />
                        <span className="font-semibold text-neutral-900 dark:text-white">{fullName}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                        <span className="font-medium tabular-nums">{phone}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{address}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBackupInfo({ fullName, phone, address });
                        setIsEditingAddress(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-neutral-900 dark:text-white hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold transition cursor-pointer shrink-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Họ và tên người nhận *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5 block w-full bg-stone-50 dark:bg-stone-950 text-neutral-900 dark:text-white rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-2.5 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 block w-full bg-stone-50 dark:bg-stone-950 text-neutral-900 dark:text-white rounded-xl border border-stone-200 dark:border-stone-800 px-4 py-2.5 text-sm focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 transition-all placeholder:text-stone-400 tabular-nums"
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

                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                    {(backupInfo.address || (user && getPrimaryAddress(user))) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFullName(backupInfo.fullName);
                          setPhone(backupInfo.phone);
                          setAddress(backupInfo.address);
                          setIsEditingAddress(false);
                        }}
                        className="px-4 py-2 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!fullName.trim() || !phone.trim() || !address.trim()}
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
                      className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xác nhận thông tin
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label
                    className={`payment-card ${
                      paymentMethod === "COD"
                        ? "payment-card--active"
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
                      <span className="flex items-center justify-between">
                        <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                          COD
                        </span>
                        <span className="h-2 w-2 rounded-full bg-stone-900 dark:bg-stone-100" />
                      </span>
                      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                        Thanh toán khi nhận hàng
                      </span>
                    </span>
                  </label>

                  <label
                    className={`payment-card ${
                      paymentMethod === "MOMO"
                        ? "payment-card--active"
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
                      <span className="flex items-center justify-between">
                        <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                          Ví MoMo
                        </span>
                        <span className="h-2 w-2 rounded-full bg-pink-600" />
                      </span>
                      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                        Cổng thanh toán MoMo
                      </span>
                    </span>
                  </label>

                  <label
                    className={`payment-card ${
                      paymentMethod === "VNPAY"
                        ? "payment-card--active"
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
                      <span className="flex items-center justify-between">
                        <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                          VNPay
                        </span>
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      </span>
                      <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                        Thẻ ATM / QR VNPay
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Order Submit Button */}
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
                className="mt-6 w-full rounded-full bg-[#05251C] hover:bg-[#073D2A] text-[#F5DD20] font-bold py-4 text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-md shadow-[#05251C]/15"
              >
                {loading
                  ? "Đang xử lý đơn hàng..."
                  : `Đặt hàng (${paymentMethod}) — ${calculateFinalTotal().toLocaleString(
                      "vi-VN",
                    )}đ`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Review & Vouchers */}
          <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-6 md:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-[0_2px_12px_-4px_rgba(28,25,23,0.04)] h-fit space-y-6">
            <div>
              <div className="flex justify-between items-center border-b border-stone-200 dark:border-stone-800 pb-4">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  Tóm tắt đơn hàng ({normalizedCheckoutItems.length})
                </h3>
                <span className="text-xs text-stone-500">
                  {normalizedCheckoutItems.reduce((acc, it) => acc + (it.quantity || 1), 0)} sản phẩm
                </span>
              </div>
              <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800 max-h-80 overflow-y-auto pr-1">
                {normalizedCheckoutItems.map((item) => {
                  const color = item.color;
                  const size = item.size;
                  return (
                    <li key={item._id} className="flex py-3.5 gap-3.5 items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-14 w-14 rounded-lg object-cover border border-stone-200 dark:border-stone-800 shrink-0 bg-stone-50"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-stone-500 font-medium tabular-nums">
                            SL: {item.quantity}
                          </span>
                          {(color || size) && (
                            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded font-medium">
                              {[color, size].filter(Boolean).join(" / ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-xs text-neutral-900 dark:text-white shrink-0 tabular-nums">
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

            {/* Voucher Section */}
            <div className="border-t border-b border-stone-200 dark:border-stone-800 py-4 space-y-3">
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
                label="Mã giảm giá sản phẩm"
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
                label="Mã miễn phí vận chuyển"
              />
            </div>

            {/* Price Calculations */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                <span>Tạm tính</span>
                <span className="text-neutral-900 dark:text-white font-medium tabular-nums">
                  {calculateSubtotal().toLocaleString("vi-VN")}đ
                </span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Giảm giá (Voucher)</span>
                  <span className="tabular-nums">
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
                <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Ưu đãi vận chuyển</span>
                  <span className="tabular-nums">
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
              <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                <span>Phí vận chuyển</span>
                <span className="text-neutral-900 dark:text-white font-medium tabular-nums">
                  {loadingFee
                    ? "Đang tính..."
                    : calculateShippingFee() === 0
                    ? "Miễn phí (Toàn quốc)"
                    : `${calculateShippingFee().toLocaleString("vi-VN")}đ`}
                </span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white block">
                    Tổng thanh toán
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Đã bao gồm thuế & phí vận chuyển
                  </span>
                </div>
                <span className="font-serif text-2xl font-bold text-neutral-900 dark:text-white tabular-nums">
                  {calculateFinalTotal().toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Trust Guarantee */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2.5">
              <div className="flex items-center gap-2.5 text-[11px] text-stone-500">
                <Lock className="h-3.5 w-3.5 text-stone-700 shrink-0" />
                <span>Thanh toán mã hóa bảo mật SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-stone-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span>Cam kết chính hãng & đổi trả trong 7 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
