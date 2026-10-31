import React, { useRef, useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  User,
  Phone,
  MapPin,
  Edit2,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";
import { useCartStore } from "../../store/cart.store";
import { useAuthStore } from "../../store/auth.store";
import { orderApi } from "../../api/order.api";
import { paymentApi } from "../../api/payment.api";
import { shippingApi } from "@/api/shipping.api";
import trackingService from "@/services/tracking.service";
import { formatCurrency } from "@/utils/format";
import CheckoutVoucherSelector from "../../components/CheckoutVoucherSelector";
import ShippingAddress from "./ShippingAddress";

const getInitialShippingAddress = (routeState) => {
  const possibleAddress = [
    routeState?.shippingAddress,
    routeState?.address,
    routeState?.deliveryAddress,
  ].find((item) => typeof item === "string" && item.trim());

  return possibleAddress || "";
};

const getAddresses = (profile = {}) => {
  if (!profile) return [];
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

const normalizeCheckoutItem = (item) => {
  const name =
    item.name ||
    item.product_name ||
    item.product_id?.name ||
    "Thiết kế thời trang";
  const image =
    item.image ||
    item.product_image ||
    item.productImage ||
    item.product_id?.image ||
    "";

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
};

const CheckoutItemRow = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const unitPrice = Number(item.new_price || item.price || 0);
  const qty = Number(item.quantity || 1);
  const stock =
    item.stock !== undefined && item.stock !== null ? Number(item.stock) : 99;
  const hasStockWarning = stock <= 0 || qty > stock;

  return (
    <li className="flex items-center gap-3.5 py-3.5">
      <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden border border-border bg-secondary">
        {item.image && !imgFailed ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-serif uppercase tracking-widest text-muted-foreground">
            WF
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="truncate font-serif text-sm text-foreground">
          {item.name}
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            SL: {qty}
          </span>
          {(item.color || item.size) && (
            <span className="border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground">
              {[item.color, item.size].filter(Boolean).join(" / ")}
            </span>
          )}
        </div>
        {hasStockWarning && (
          <p className="text-[11px] font-semibold text-destructive">
            {stock <= 0 ? "Đã hết hàng" : `Chỉ còn ${stock} sản phẩm`}
          </p>
        )}
      </div>

      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
        {formatCurrency(unitPrice * qty)}
      </span>
    </li>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WEBFASHION";
  useDocumentTitle(`Thanh toán — ${siteName}`);

  const { items, setCartItems } = useCartStore();
  const { user } = useAuthStore();
  const checkoutItems = location.state?.checkoutItems || items;

  const normalizedCheckoutItems = useMemo(
    () => (checkoutItems || []).map(normalizeCheckoutItem),
    [checkoutItems]
  );

  const primaryUserAddress = getPrimaryAddress(user);
  const initialFormattedAddress =
    getInitialShippingAddress(location.state) ||
    formatAddress(primaryUserAddress);

  const shippingAddressRef = useRef(null);
  const [fullName, setFullName] = useState(
    () => primaryUserAddress?.fullName || user?.fullName || user?.name || ""
  );
  const [phone, setPhone] = useState(
    () => primaryUserAddress?.phone || user?.phone || user?.phoneNumber || ""
  );
  const [address, setAddress] = useState(() => initialFormattedAddress);
  const [isEditingAddress, setIsEditingAddress] = useState(
    () => !initialFormattedAddress
  );
  const [backupInfo, setBackupInfo] = useState(() => ({
    fullName:
      primaryUserAddress?.fullName || user?.fullName || user?.name || "",
    phone:
      primaryUserAddress?.phone || user?.phone || user?.phoneNumber || "",
    address: initialFormattedAddress,
  }));

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  const [shippingFee, setShippingFee] = useState(30000);
  const [loadingFee, setLoadingFee] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedWardCode, setSelectedWardCode] = useState(null);

  const [appliedVoucher, setAppliedVoucher] = useState(
    location.state?.appliedCoupon || null
  );
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState(
    location.state?.appliedShippingCoupon || null
  );

  useEffect(() => {
    const role = user?.role || user?.data?.role || "";
    if (role === "admin") {
      toast.error("Quản trị viên không thể thực hiện thanh toán mua hàng!");
      navigate("/");
    }
  }, [user, navigate]);

  const subtotal = useMemo(() => {
    return normalizedCheckoutItems.reduce(
      (sum, item) =>
        sum + Number(item.new_price || item.price || 0) * (item.quantity || 1),
      0
    );
  }, [normalizedCheckoutItems]);

  const effectiveShippingFee = useMemo(() => {
    if (subtotal >= 1000000 || subtotal === 0) return 0;
    const shipDisc = appliedShippingVoucher
      ? appliedShippingVoucher.discountAmount ||
        appliedShippingVoucher.discount_amount ||
        0
      : 0;
    return Math.max(0, shippingFee - shipDisc);
  }, [subtotal, shippingFee, appliedShippingVoucher]);

  const finalTotal = useMemo(() => {
    const disc = appliedVoucher
      ? appliedVoucher.discountAmount || appliedVoucher.discount_amount || 0
      : 0;
    return Math.max(0, subtotal - disc + effectiveShippingFee);
  }, [subtotal, appliedVoucher, effectiveShippingFee]);

  useEffect(() => {
    if (normalizedCheckoutItems && normalizedCheckoutItems.length > 0) {
      trackingService.trackCheckoutStarted(normalizedCheckoutItems, finalTotal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatically calculate shipping fee when district & ward change
  useEffect(() => {
    if (!selectedDistrictId || !selectedWardCode) return;
    let isMounted = true;

    const loadFee = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setLoadingFee(true);
      try {
        const payload = {
          districtId: selectedDistrictId,
          wardCode: selectedWardCode,
          weight: 500,
          serviceTypeId: 2,
        };
        const res = await shippingApi.calculateFee(payload);
        if (isMounted && res?.success && res?.data) {
          setShippingFee(res.data.total);
        }
      } catch (error) {
        console.error("Lỗi khi tính phí vận chuyển:", error);
        if (isMounted) {
          toast.error("Không thể tính phí vận chuyển. Áp dụng phí tiêu chuẩn.");
          setShippingFee(30000);
        }
      } finally {
        if (isMounted) setLoadingFee(false);
      }
    };

    loadFee();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId, selectedWardCode]);

  const hasStockConflict = useMemo(() => {
    return normalizedCheckoutItems.some((item) => {
      if (item.stock === undefined || item.stock === null) return false;
      return Number(item.stock) <= 0 || Number(item.quantity || 1) > Number(item.stock);
    });
  }, [normalizedCheckoutItems]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setOrderError("");
    if (normalizedCheckoutItems.length === 0) return;

    if (hasStockConflict) {
      const msg =
        "Một số sản phẩm trong đơn hàng vượt quá tồn kho hoặc đã hết hàng. Vui lòng quay lại giỏ hàng để điều chỉnh.";
      setOrderError(msg);
      toast.error(msg);
      return;
    }

    if (isEditingAddress) {
      if (!shippingAddressRef.current?.validate()) return;
    } else if (!fullName.trim() || !phone.trim() || !address.trim()) {
      toast.warn("Vui lòng nhập đầy đủ thông tin nhận hàng.");
      return;
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
        paymentMethod,
        items: normalizedCheckoutItems.map((item) => ({
          product_id: item.product_id,
          product_variant_id:
            item.variants?.[0]?._id || item.variant_id || null,
          quantity: item.quantity,
          price: item.new_price || item.price || 0,
        })),
        totalPrice: finalTotal,
        shippingFee: effectiveShippingFee,
        voucherCode: activeVoucherCodes || null,
      };

      const res = await orderApi.createOrder(orderPayload);
      if (res?.success) {
        const remainingCartItems = items.filter(
          (item) =>
            !normalizedCheckoutItems.some(
              (checkoutItem) => checkoutItem._id === item._id
            )
        );
        setCartItems(remainingCartItems);

        const orderId = res.order?._id || res.order?.id;

        if (paymentMethod === "MOMO") {
          try {
            const payRes = await paymentApi.createMomoPayment(orderId);
            if (payRes?.success && payRes?.paymentUrl) {
              window.location.href = payRes.paymentUrl;
              return;
            }
            toast.error(
              "Đơn hàng đã tạo nhưng không thể khởi tạo cổng thanh toán MoMo."
            );
            navigate("/orders");
          } catch (payErr) {
            console.error("Momo payment error:", payErr);
            toast.error("Đơn hàng đã tạo nhưng gặp lỗi kết nối MoMo.");
            navigate("/orders");
          }
        } else if (paymentMethod === "VNPAY") {
          try {
            const payRes = await paymentApi.createVNPayPayment(orderId);
            if (payRes?.success && payRes?.paymentUrl) {
              window.location.href = payRes.paymentUrl;
              return;
            }
            toast.error(
              "Đơn hàng đã tạo nhưng không thể khởi tạo cổng thanh toán VNPay."
            );
            navigate("/orders");
          } catch (payErr) {
            console.error("VNPay payment error:", payErr);
            toast.error("Đơn hàng đã tạo nhưng gặp lỗi kết nối VNPay.");
            navigate("/orders");
          }
        } else {
          toast.success("Đặt hàng thành công!");
          navigate("/payment-result?success=true");
        }
      }
    } catch (err) {
      console.error(err);
      const apiMsg =
        err.response?.data?.message ||
        "Không thể hoàn tất đơn hàng. Vui lòng kiểm tra tồn kho và thử lại.";
      setOrderError(apiMsg);

      if (err.response?.status === 409) {
        Swal.fire({
          title: "Thông báo tồn kho / ưu đãi",
          text:
            err.response?.data?.message ||
            "Tồn kho, giá sản phẩm hoặc suất ưu đãi Flash Sale đã thay đổi. Vui lòng quay lại giỏ hàng kiểm tra.",
          icon: "warning",
          confirmButtonText: "Quay về giỏ hàng",
        }).then(() => {
          navigate("/cart");
        });
        return;
      }
      toast.error(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  if (normalizedCheckoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 text-foreground">
        <div className="mx-auto max-w-xl border border-border bg-card px-6 py-16 text-center sm:px-10">
          <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
            {siteName} · Thanh toán
          </p>
          <h1 className="mt-2 font-serif text-3xl text-foreground">
            Chưa có thiết kế nào để thanh toán
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Vui lòng chọn sản phẩm từ giỏ hàng hoặc bộ sưu tập trước khi tiến
            hành xác nhận đơn hàng.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/cart"
              className="touch-target inline-flex items-center gap-2 border border-foreground bg-background px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-foreground transition-colors hover:bg-secondary"
            >
              <ArrowLeft size={15} />
              <span>Quay lại Giỏ hàng</span>
            </Link>
            <Link
              to="/products"
              className="touch-target inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground"
            >
              <span>Khám phá Bộ sưu tập</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 text-foreground sm:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 space-y-8">
        {/* 3-Step Editorial Progress Bar */}
        <nav
          aria-label="Tiến trình đặt hàng"
          className="flex flex-wrap items-center justify-center gap-3 border-b border-border pb-6 text-xs sm:gap-6"
        >
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="touch-target inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex h-6 w-6 items-center justify-center border border-border text-[10px] font-semibold">
              01
            </span>
            <span className="tracking-[0.14em] uppercase">Giỏ hàng</span>
          </button>

          <div className="h-px w-6 bg-border sm:w-12" />

          <div className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-6 w-6 items-center justify-center bg-primary text-[10px] font-semibold text-primary-foreground">
              02
            </span>
            <span className="tracking-[0.14em] uppercase">
              Thông tin & Thanh toán
            </span>
          </div>

          <div className="h-px w-6 bg-border sm:w-12" />

          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center border border-border text-[10px] font-semibold">
              03
            </span>
            <span className="tracking-[0.14em] uppercase">Hoàn tất</span>
          </div>
        </nav>

        {/* Page Title */}
        <div>
          <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-muted-foreground">
            {siteName} · Giao dịch bảo mật
          </p>
          <h1 className="mt-1 font-serif text-3xl font-normal tracking-tight text-foreground sm:text-5xl">
            Xác nhận đơn hàng
          </h1>
        </div>

        {/* Stock / Order Error Banner */}
        {(orderError || hasStockConflict) && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-destructive/50 bg-destructive/10 p-4 text-xs text-destructive"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-[0.14em]">
                Không thể xử lý đơn hàng
              </p>
              <p>
                {orderError ||
                  "Một số thiết kế vượt quá số lượng tồn kho hiện có. Vui lòng quay lại giỏ hàng để kiểm tra."}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Recipient Address & Payment Method */}
          <div className="border border-border bg-card p-6 sm:p-8 space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-foreground">
                <User size={15} strokeWidth={1.5} />
                <span>Thông tin người nhận</span>
              </h2>
              {user && primaryUserAddress && isEditingAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setFullName(
                      primaryUserAddress.fullName ||
                        user.fullName ||
                        user.name ||
                        ""
                    );
                    setPhone(
                      primaryUserAddress.phone ||
                        user.phone ||
                        user.phoneNumber ||
                        ""
                    );
                    setAddress(formatAddress(primaryUserAddress));
                    setIsEditingAddress(false);
                  }}
                  className="touch-target px-2 text-xs font-semibold text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  Dùng địa chỉ mặc định
                </button>
              )}
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {!isEditingAddress ? (
                <div className="border border-border bg-background p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        <User size={14} className="shrink-0 text-foreground" />
                        <span className="font-semibold text-foreground">
                          {fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="shrink-0 text-foreground" />
                        <span className="font-medium tabular-nums text-foreground">
                          {phone}
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin
                          size={14}
                          className="mt-0.5 shrink-0 text-foreground"
                        />
                        <span className="leading-relaxed text-foreground">
                          {address}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBackupInfo({ fullName, phone, address });
                        setIsEditingAddress(true);
                      }}
                      className="touch-target inline-flex shrink-0 items-center gap-1.5 border border-border bg-card px-3.5 text-xs font-semibold tracking-[0.12em] uppercase text-foreground transition-colors hover:border-foreground"
                    >
                      <Edit2 size={13} />
                      <span>Thay đổi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="checkout-fullname"
                        className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground"
                      >
                        Họ và tên người nhận *
                      </label>
                      <input
                        id="checkout-fullname"
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="min-h-[44px] w-full border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground"
                      >
                        Số điện thoại *
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        placeholder="0912345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="min-h-[44px] w-full border border-border bg-background px-3.5 text-xs tabular-nums text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                      />
                    </div>
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

                  <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
                    {(backupInfo.address || primaryUserAddress) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFullName(backupInfo.fullName);
                          setPhone(backupInfo.phone);
                          setAddress(backupInfo.address);
                          setIsEditingAddress(false);
                        }}
                        className="touch-target border border-border bg-background px-5 text-xs font-semibold tracking-[0.14em] uppercase text-foreground transition-colors hover:bg-secondary"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={
                        !fullName.trim() || !phone.trim() || !address.trim()
                      }
                      onClick={() => {
                        if (!fullName.trim() || !phone.trim()) {
                          toast.warn(
                            "Vui lòng điền đầy đủ Họ tên và Số điện thoại."
                          );
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
                      className="touch-target bg-primary px-6 text-xs font-semibold tracking-[0.16em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Xác nhận địa chỉ
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <fieldset className="space-y-3 border-t border-border pt-6">
                <legend className="text-[11px] font-semibold tracking-[0.18em] uppercase text-foreground">
                  Phương thức thanh toán
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: "COD",
                      title: "COD",
                      desc: "Thanh toán khi nhận hàng",
                    },
                    {
                      id: "MOMO",
                      title: "Ví MoMo",
                      desc: "Cổng thanh toán điện tử MoMo",
                    },
                    {
                      id: "VNPAY",
                      title: "VNPay",
                      desc: "Thẻ ATM / QR Ngân hàng",
                    },
                  ].map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <label
                        key={method.id}
                        className={`touch-target flex cursor-pointer flex-col justify-between border p-4 transition-colors ${
                          active
                            ? "border-foreground bg-secondary/70"
                            : "border-border bg-background hover:border-foreground/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={method.id}
                          checked={active}
                          onChange={() => setPaymentMethod(method.id)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold tracking-[0.14em] uppercase text-foreground">
                            {method.title}
                          </span>
                          <span
                            className={`h-2.5 w-2.5 rounded-full border ${
                              active
                                ? "border-foreground bg-foreground"
                                : "border-muted-foreground bg-transparent"
                            }`}
                          />
                        </div>
                        <span className="mt-2 block text-[11px] text-muted-foreground">
                          {method.desc}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Submit Order CTA */}
              <button
                type="submit"
                disabled={
                  loading ||
                  normalizedCheckoutItems.length === 0 ||
                  hasStockConflict ||
                  isEditingAddress ||
                  !fullName.trim() ||
                  !phone.trim() ||
                  !address.trim()
                }
                className="touch-target flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 text-xs font-semibold tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Đang khởi tạo đơn hàng...</span>
                  </>
                ) : (
                  <span>
                    Đặt hàng ({paymentMethod}) — {formatCurrency(finalTotal)}
                  </span>
                )}
              </button>

              {isEditingAddress && (
                <p className="text-center text-[11px] text-muted-foreground">
                  * Vui lòng nhấn &ldquo;Xác nhận địa chỉ&rdquo; trước khi hoàn
                  tất đặt hàng.
                </p>
              )}
            </form>
          </div>

          {/* Right Column: Order Summary & Vouchers */}
          <div className="border border-border bg-card p-6 sm:p-8 space-y-6 lg:col-span-5 lg:sticky lg:top-24">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="font-serif text-2xl font-normal text-foreground">
                  Đơn hàng ({normalizedCheckoutItems.length})
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {normalizedCheckoutItems.reduce(
                    (acc, it) => acc + Number(it.quantity || 1),
                    0
                  )}{" "}
                  sản phẩm
                </span>
              </div>

              <ul className="mt-4 max-h-80 divide-y divide-border overflow-y-auto pr-1">
                {normalizedCheckoutItems.map((item) => (
                  <CheckoutItemRow key={item._id} item={item} />
                ))}
              </ul>
            </div>

            {/* Dual Voucher Selectors (Product + Shipping) */}
            <div className="space-y-3 border-y border-border py-5">
              <CheckoutVoucherSelector
                subtotal={subtotal}
                items={normalizedCheckoutItems}
                shippingFee={
                  subtotal >= 1000000 || subtotal === 0 ? 0 : shippingFee
                }
                appliedVoucher={appliedVoucher}
                onApply={(voucher) => setAppliedVoucher(voucher)}
                onRemove={() => setAppliedVoucher(null)}
                voucherType="product"
                label="Mã giảm giá sản phẩm"
              />
              <CheckoutVoucherSelector
                subtotal={subtotal}
                items={normalizedCheckoutItems}
                shippingFee={
                  subtotal >= 1000000 || subtotal === 0 ? 0 : shippingFee
                }
                appliedVoucher={appliedShippingVoucher}
                onApply={(voucher) => setAppliedShippingVoucher(voucher)}
                onRemove={() => setAppliedShippingVoucher(null)}
                voucherType="shipping"
                label="Mã miễn phí vận chuyển"
              />
            </div>

            {/* Price Breakdown */}
            <dl className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <dt>Tạm tính</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatCurrency(subtotal)}
                </dd>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between font-medium text-foreground">
                  <dt>Giảm giá sản phẩm ({appliedVoucher.code})</dt>
                  <dd className="tabular-nums">
                    -
                    {formatCurrency(
                      appliedVoucher.discountAmount ||
                        appliedVoucher.discount_amount ||
                        0
                    )}
                  </dd>
                </div>
              )}

              {appliedShippingVoucher && (
                <div className="flex justify-between font-medium text-foreground">
                  <dt>Ưu đãi vận chuyển ({appliedShippingVoucher.code})</dt>
                  <dd className="tabular-nums">
                    -
                    {formatCurrency(
                      appliedShippingVoucher.discountAmount ||
                        appliedShippingVoucher.discount_amount ||
                        0
                    )}
                  </dd>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <dt>Phí vận chuyển</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {loadingFee
                    ? "Đang tính phí..."
                    : effectiveShippingFee === 0
                    ? "Miễn phí"
                    : formatCurrency(effectiveShippingFee)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between border-t border-border pt-4">
                <div>
                  <dt className="text-xs font-semibold tracking-[0.16em] uppercase text-foreground">
                    Tổng thanh toán
                  </dt>
                  <span className="text-[10px] text-muted-foreground">
                    Đã bao gồm thuế GTGT (nếu có)
                  </span>
                </div>
                <dd className="font-serif text-2xl font-medium tabular-nums text-foreground">
                  {formatCurrency(finalTotal)}
                </dd>
              </div>
            </dl>

            <div className="flex items-center justify-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <ShieldCheck size={14} className="text-foreground" />
              <span>Đảm bảo hoàn tiền và bảo vệ người mua bởi {siteName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
