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
import { saveGuestOrderToken } from "@/utils/guestOrderAccess";
import { shippingApi } from "@/api/shipping.api";
import trackingService from "@/services/tracking.service";
import { formatCurrency } from "@/utils/format";
import { getCartService } from "@/services/cart.service";
import { getCartItemsService } from "@/services/cartItem.service";
import axiosClient from "@/api/axiosClient";
import { Clock } from "lucide-react";
import CheckoutVoucherSelector from "../../components/CheckoutVoucherSelector";
import ShippingAddress from "./ShippingAddress";
import { getInitialShippingAddress } from "@/utils/checkoutAddress";


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
  const rawProductId =
    typeof item.product_id === "object" && item.product_id !== null
      ? item.product_id._id || item.product_id.id
      : item.productId || item.product_id || item.id || item._id;
  const productId = rawProductId ? String(rawProductId) : "";

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

  const rawVariant =
    item.variantId ||
    item.variant_id ||
    item.product_variant_id ||
    item.variants?.[0] ||
    item.sku;
  const variantId =
    typeof rawVariant === "object" && rawVariant !== null
      ? rawVariant._id || rawVariant.id
      : rawVariant || null;

  // Single Source of Truth price resolution from backend
  const rawPrice = item.unitPrice ?? item.unit_price ?? item.new_price ?? item.price;
  const unitPrice = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : 0;

  let priceStatus = "VALID_PRICE";
  if (rawPrice === undefined || rawPrice === null) {
    priceStatus = "PRICE_UNAVAILABLE";
  } else if (isNaN(unitPrice) || unitPrice < 0) {
    priceStatus = "INVALID_PRICE";
  } else if (unitPrice === 0) {
    priceStatus = item.isFreeGift ? "VALID_PRICE" : "INVALID_PRICE";
  }

  return {
    ...item,
    productId,
    product_id: productId,
    variantId,
    product_variant_id: variantId,
    name,
    image,
    color,
    size,
    unitPrice,
    unit_price: unitPrice,
    price: unitPrice,
    new_price: unitPrice,
    priceStatus,
  };
};

const CheckoutItemRow = ({ item }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.new_price ?? item.price ?? 0);
  const qty = Number(item.quantity || 1);
  const stock =
    item.stock !== undefined && item.stock !== null ? Number(item.stock) : 99;
  const hasStockWarning = stock <= 0 || qty > stock;
  const isPriceInvalid =
    item.priceStatus === "INVALID_PRICE" ||
    item.priceStatus === "PRICE_UNAVAILABLE" ||
    (unitPrice <= 0 && !item.isFreeGift);

  return (
    <li className="flex items-center gap-3.5 py-3.5">
      <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden border border-border bg-[var(--muted)]/40 dark:bg-zinc-900/50 flex items-center justify-center">
        {item.image && !imgFailed ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-contain object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-display uppercase tracking-widest text-muted-foreground">
            WF
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="truncate font-sans text-sm font-medium text-foreground">
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
        {isPriceInvalid && (
          <p className="text-[11px] font-semibold text-destructive">
            Giá không khả dụng
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {isPriceInvalid ? (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold text-destructive bg-destructive/10 rounded">
            Chưa có giá
          </span>
        ) : (
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {formatCurrency(unitPrice * qty)}
          </span>
        )}
      </div>
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

  // Restore cart items if refreshed or accessed without state
  useEffect(() => {
    let isMounted = true;
    if (!location.state?.checkoutItems && items.length === 0 && user) {
      getCartService()
        .then((cartRes) => {
          const cartId = cartRes?.data?._id || cartRes?._id;
          if (cartId && isMounted) {
            getCartItemsService(cartId).then((itemsRes) => {
              const backendItems = itemsRes?.data || [];
              if (Array.isArray(backendItems) && backendItems.length > 0 && isMounted) {
                const normalized = backendItems.map((item) => {
                  const product = item.product_id || {};
                  const variant = item.variant_id || {};
                  return {
                    _id: item._id,
                    product_id: product._id || product.id || item.product_id,
                    slug: product.slug || "",
                    name: product.name || "Thiết kế thời trang",
                    image:
                      variant.image_url ||
                      product.image ||
                      (product.displayProduct && product.displayProduct[0]) ||
                      "",
                    unitPrice: Number(item.price ?? product.new_price ?? 0),
                    new_price: Number(item.price ?? product.new_price ?? 0),
                    price: Number(item.price ?? product.new_price ?? 0),
                    quantity: Number(item.quantity || 1),
                    stock: variant.stock ?? product.stock ?? 99,
                    variants: variant._id
                      ? [{ _id: variant._id, color: variant.color, size: variant.size }]
                      : [],
                  };
                });
                setCartItems(normalized);
              }
            });
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [location.state, items.length, user, setCartItems]);

  const [activeReservation, setActiveReservation] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(300);
  const [isReservationExpired, setIsReservationExpired] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const urlReservationId = searchParams.get("reservationId");
  const initialReservationId = location.state?.reservationId || urlReservationId || null;

  const fallbackStoredItems = useMemo(() => {
    try {
      const stored = sessionStorage.getItem("checkout_items_seed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const checkoutItems =
    location.state?.checkoutItems ||
    (activeReservation?.items?.length > 0 ? activeReservation.items : null) ||
    (items.length > 0 ? items : fallbackStoredItems);

  const normalizedCheckoutItems = useMemo(
    () => (checkoutItems || []).map(normalizeCheckoutItem),
    [checkoutItems]
  );



  useEffect(() => {
    let isMounted = true;
    if (!initialReservationId) return;

    axiosClient
      .get(`/inventory/reservations/${initialReservationId}`)
      .then((res) => {
        const data = res?.data || res;
        if (!isMounted || !data) return;
        if (data.status === "ACTIVE" && data.remainingSeconds > 0) {
          setActiveReservation(data);
          setRemainingSeconds(data.remainingSeconds);
        } else {
          setIsReservationExpired(true);
          Swal.fire({
            title: "Thời gian giữ hàng 5 phút đã hết",
            text: "Thời gian giữ hàng 5 phút đã hết. Sản phẩm của bạn đã được trả về kho. Vui lòng kiểm tra lại giỏ hàng để tiếp tục thanh toán.",
            icon: "warning",
            confirmButtonText: "Quay về giỏ hàng",
          }).then(() => {
            navigate("/cart");
          });
        }
      })
      .catch((err) => {
        console.warn("Lỗi kiểm tra phiên giữ hàng:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [initialReservationId, navigate]);

  useEffect(() => {
    if (!activeReservation || !activeReservation.expiresAt || isReservationExpired) return;

    const timer = setInterval(() => {
      const expiresAtMs = new Date(activeReservation.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        clearInterval(timer);
        setIsReservationExpired(true);
        axiosClient
          .post(`/inventory/reservations/${activeReservation.reservationId}/release`, {
            reason: "EXPIRED",
          })
          .catch(() => {});

        Swal.fire({
          title: "Thời gian giữ hàng 5 phút đã hết",
          text: "Thời gian giữ hàng 5 phút đã hết. Sản phẩm của bạn đã được trả về kho. Vui lòng kiểm tra lại giỏ hàng để tiếp tục thanh toán.",
          icon: "info",
          confirmButtonText: "Quay về giỏ hàng",
        }).then(() => {
          navigate("/cart");
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeReservation, isReservationExpired, navigate]);

  const handleCancelReservation = async () => {
    if (!activeReservation) return;
    const result = await Swal.fire({
      title: "Hủy giữ hàng và thanh toán?",
      text: "Sản phẩm bạn đang giữ trong 5 phút sẽ được giải phóng ngay lập tức.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đồng ý hủy",
      cancelButtonText: "Tiếp tục thanh toán",
    });

    if (result.isConfirmed) {
      setIsReleasing(true);
      try {
        await axiosClient.post(
          `/inventory/reservations/${activeReservation.reservationId}/release`,
          { reason: "USER_CANCELLED" }
        );
        toast.success("Đã hủy giữ hàng thành công");
        navigate("/cart");
      } catch {
        navigate("/cart");
      } finally {
        setIsReleasing(false);
      }
    }
  };

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
        sum + Number(item.unitPrice ?? item.unit_price ?? item.new_price ?? item.price ?? 0) * (item.quantity || 1),
      0
    );
  }, [normalizedCheckoutItems]);

  const hasInvalidPricing = useMemo(() => {
    return normalizedCheckoutItems.some(
      (item) =>
        item.priceStatus === "INVALID_PRICE" ||
        item.priceStatus === "PRICE_UNAVAILABLE" ||
        (Number(item.unitPrice) <= 0 && !item.isFreeGift)
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

    if (normalizedCheckoutItems.length === 0) {
      toast.warn("Giỏ hàng của bạn đang trống.");
      return;
    }

    if (hasStockConflict) {
      const msg =
        "Một số sản phẩm trong đơn hàng vượt quá tồn kho hoặc đã hết hàng. Vui lòng quay lại giỏ hàng để điều chỉnh.";
      setOrderError(msg);
      toast.error(msg);
      return;
    }

    if (isEditingAddress && shippingAddressRef.current?.validate) {
      const isAddressValid = shippingAddressRef.current.validate();
      if (!isAddressValid) return;
    }

    const resolvedAddress = (
      (isEditingAddress && shippingAddressRef.current?.getAddress
        ? shippingAddressRef.current.getAddress()
        : address) || ""
    ).trim();

    if (!fullName.trim() || !phone.trim() || !resolvedAddress) {
      const msg = "Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.";
      setOrderError(msg);
      toast.warn(msg);
      return;
    }

    // Clean & normalize phone format for backend (requires 9-11 digits)
    let cleanPhone = phone.trim();
    if (cleanPhone.startsWith("+84")) {
      cleanPhone = "0" + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith("84") && cleanPhone.length === 11) {
      cleanPhone = "0" + cleanPhone.slice(2);
    }
    cleanPhone = cleanPhone.replace(/[\s.-]/g, "");

    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(cleanPhone)) {
      const msg = "Số điện thoại không hợp lệ (yêu cầu từ 9 đến 11 chữ số).";
      setOrderError(msg);
      toast.error(msg);
      return;
    }

    if (hasInvalidPricing) {
      const msg = "Không thể đặt hàng do có sản phẩm chưa xác định được giá hợp lệ.";
      setOrderError(msg);
      toast.error(msg);
      return;
    }

    // Resolve items safely extracting string IDs
    const resolvedItems = normalizedCheckoutItems
      .map((item) => {
        const rawProductId =
          typeof item.product_id === "object" && item.product_id !== null
            ? item.product_id._id || item.product_id.id
            : item.productId || item.product_id || item.id || item._id;

        const rawVariant =
          item.variants?.[0] || item.variant_id || item.product_variant_id;
        const variantId =
          typeof rawVariant === "object" && rawVariant !== null
            ? rawVariant._id || rawVariant.id
            : rawVariant || null;

        const priceVal = Number(item.unitPrice ?? item.unit_price ?? item.new_price ?? item.price ?? 0);

        return {
          product_id: rawProductId ? String(rawProductId) : null,
          product_variant_id:
            variantId &&
            String(variantId) !== "null" &&
            String(variantId) !== "undefined"
              ? String(variantId)
              : null,
          quantity: Number(item.quantity) || 1,
          price: priceVal,
        };
      })
      .filter((item) => Boolean(item.product_id));

    if (resolvedItems.length === 0) {
      const msg = "Đơn hàng phải có ít nhất 1 sản phẩm hợp lệ.";
      setOrderError(msg);
      toast.error(msg);
      return;
    }

    const hasZeroPriceItem = resolvedItems.some((it) => it.price <= 0);
    if (hasZeroPriceItem) {
      const msg = "Không thể đặt hàng do có sản phẩm có đơn giá không hợp lệ (0đ).";
      setOrderError(msg);
      toast.error(msg);
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
        fullName: fullName.trim(),
        phone: cleanPhone,
        shippingAddress: resolvedAddress,
        paymentMethod: (paymentMethod || "COD").toUpperCase(),
        items: resolvedItems,
        totalPrice: finalTotal,
        shippingFee: effectiveShippingFee,
        voucherCode: activeVoucherCodes || null,
        reservation_id: activeReservation?.reservationId || initialReservationId || null,
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
        const isGuest = !user;
        const guestToken = res.guest_access_token;
        if (isGuest && orderId && guestToken) {
          saveGuestOrderToken(orderId, guestToken);
          await Swal.fire({ title: "Lưu mã truy cập đơn hàng", text: `Mã truy cập: ${guestToken}. Mã đã lưu trên thiết bị này; hãy lưu thêm ở nơi an toàn.`, icon: "info", confirmButtonText: "Tôi đã lưu mã" });
        }

        if (paymentMethod === "MOMO") {
          try {
            const payRes = isGuest ? await orderApi.payGuestOrder(orderId, "momo", guestToken) : await paymentApi.createMomoPayment(orderId);
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
            const payRes = isGuest ? await orderApi.payGuestOrder(orderId, "vnpay", guestToken) : await paymentApi.createVNPayPayment(orderId);
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
          navigate(`/payment-result?success=true&orderCode=${orderId}&guest=${isGuest}`);
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
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wider text-foreground sm:text-3xl leading-[1.25]">
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
          <h1 className="mt-1 font-display text-3xl font-bold uppercase tracking-wider text-foreground sm:text-4xl leading-[1.25]">
            Xác nhận đơn hàng
          </h1>
        </div>

        {/* Stock / Price / Order Error Banner */}
        {(orderError || hasStockConflict || hasInvalidPricing) && (
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
                  (hasInvalidPricing
                    ? "Một số sản phẩm chưa xác định được giá hợp lệ từ hệ thống hoặc có giá 0đ. Vui lòng kiểm tra lại trước khi thanh toán."
                    : "Một số thiết kế vượt quá số lượng tồn kho hiện có. Vui lòng quay lại giỏ hàng để kiểm tra.")}
              </p>
            </div>
          </div>
        )}

                {/* Redis Inventory Reservation Countdown Banner */}
        {activeReservation && !isReservationExpired && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border p-3.5 sm:p-4 text-xs transition-colors ${
              remainingSeconds <= 60
                ? "border-destructive/60 bg-destructive/10 text-destructive dark:bg-destructive/20"
                : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 dark:bg-amber-950/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Clock
                className={`h-4 w-4 shrink-0 ${
                  remainingSeconds <= 60 ? "animate-bounce text-destructive" : "text-amber-600 dark:text-amber-400"
                }`}
              />
              <div>
                <span className="font-bold tracking-wider">
                  {remainingSeconds <= 60
                    ? "⚠️ Sắp hết hạn! Thời gian giữ hàng còn lại: "
                    : "Thời gian giữ hàng còn lại: "}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                  {String(remainingSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelReservation}
              disabled={isReleasing}
              className="underline hover:opacity-80 cursor-pointer text-[11px] font-semibold tracking-wider uppercase shrink-0"
            >
              {isReleasing ? "Đang hủy..." : "Hủy giữ hàng"}
            </button>
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
                        !fullName.trim() || !phone.trim() || !address.trim() || isReservationExpired
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
                  hasInvalidPricing ||
                  isReservationExpired ||
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
              <p className="text-center text-[11px] leading-5 text-muted-foreground">
                Khi đặt hàng, bạn đồng ý với <Link to="/terms" className="underline">Điều khoản mua bán</Link>, <Link to="/shipping" className="underline">Chính sách vận chuyển</Link>, <Link to="/returns-refunds" className="underline">Đổi trả & hoàn tiền</Link> và <Link to="/payment-policy" className="underline">Thanh toán</Link>.
              </p>
              {activeReservation && !isReservationExpired && (
                <button
                  type="button"
                  onClick={handleCancelReservation}
                  disabled={loading || isReleasing}
                  className="mt-2 flex w-full items-center justify-center border border-border bg-background py-2.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  {isReleasing ? "Đang hủy giữ hàng..." : "Hủy thanh toán & Giải phóng hàng"}
                </button>
              )}

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
                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
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
                <dd className="font-display text-2xl font-bold tabular-nums text-foreground">
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
