import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "@/services/location.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import {
  createOrderService,
  paymentOrderService,
} from "@/services/order.service";
import { createOrderItemApi } from "@/api/orderItemApi";
import { handlePayment } from "@/utils/payment";

const paymentOptions = [
  {
    id: "cod",
    title: "Thanh toán khi nhận hàng",
    description:
      "Kiểm tra hàng khi nhận hàng và thanh toán tiền trực tiếp với người vận chuyển",
  },
  {
    id: "momo",
    title: "Ví MoMo",
    description: "Thanh toán bằng ví điện tử MoMo",
  },
  {
    id: "vnpay",
    title: "VNPay",
    description: "Quét mã QR Code bằng các hệ thống ngân hàng trên cả nước ",
  },
];

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const buildShippingAddress = (form, provinces, districts, wards) => {
  const provinceName =
    provinces.find((p) => String(p.code) === String(form.province))?.name ||
    form.province ||
    "";

  const districtName =
    districts.find((d) => String(d.code) === String(form.district))?.name ||
    form.district ||
    "";

  const wardName =
    wards.find((w) => String(w.code) === String(form.ward))?.name ||
    form.ward ||
    "";

  return [form.detail || form.addressDetail || "", wardName, districtName, provinceName]
    .filter(Boolean)
    .join(", ");
};

const buildShippingDisplay = (form, provinces, districts, wards) => {
  const provinceText =
    provinces.find((p) => String(p.code) === String(form.province))?.name ||
    form.province ||
    "";

  const districtText =
    districts.find((d) => String(d.code) === String(form.district))?.name ||
    form.district ||
    "";

  const wardText =
    wards.find((w) => String(w.code) === String(form.ward))?.name ||
    form.ward ||
    "";

  return {
    fullName: form.fullName || "",
    phone: form.phone || "",
    addressDetail: form.detail || form.addressDetail || "",
    ward: wardText,
    district: districtText,
    province: provinceText,
  };
};

const getVariantLabel = (variantId) => {
  if (!variantId) {
    return "Mặc định";
  }

  if (typeof variantId === "object") {
    return [variantId.color, variantId.size].filter(Boolean).join(" - ");
  }

  return String(variantId).replaceAll("-", " ");
};

const normalizeCheckoutItem = (item) => ({
  _id: item._id,
  product_id: item.product_id?._id || item.product_id || "",
  variant_id: item.variant_id?._id || item.variant_id || "",
  product_name: item.product_name || "Sản phẩm",
  product_image: item.product_image || "",
  price: Number(item.price || 0),
  oldPrice: Number(item.oldPrice || item.price || 0),
  quantity: Number(item.quantity || 0),
  variant: item.variant || getVariantLabel(item.variant_id),
});

const getSavedShippingAddress = (userData) => {
  return (
    userData?.addresses?.[0] ||
    userData?.address?.[0] ||
    userData?.address ||
    null
  );
};

const CheckoutPage = () => {
  useDocumentTitle("Thanh toán");
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [voucher, setVoucher] = useState("FREESHIP");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
    addressDetail: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedPayment, setSelectedPayment] = useState("cod");

  const [savedShippingForm, setSavedShippingForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    detail: "",
    addressDetail: "",
  });

  useEffect(() => {
    const checkoutState = location.state;

    setIsLoading(true);
    setError("");

    if (checkoutState?.checkoutItems?.length) {
      setCheckoutItems(checkoutState.checkoutItems.map(normalizeCheckoutItem));
      setIsLoading(false);
      return;
    }

    setCheckoutItems([]);
    setIsLoading(false);
    setError("Không có dữ liệu thanh toán. Vui lòng quay lại giỏ hàng.");
  }, [location.state]);

  // Load user and prefill shipping info
  const { user } = useAuth();

  useEffect(() => {
    const userData = user?.data;

    if (userData?._id) {
      setUserId(userData._id);
    }

    const addr = getSavedShippingAddress(userData);

    if (!addr) {
      return;
    }

    const nextShippingForm = {
      fullName: addr.fullName || addr.name || "",
      phone: addr.phone || "",
      province: addr.provinceCode || addr.province || addr.city || "",
      district: addr.districtCode || addr.district || "",
      ward: addr.wardCode || addr.ward || "",
      detail: addr.addressDetail || addr.detail || addr.address || "",
      addressDetail: addr.addressDetail || addr.detail || addr.address || "",
    };

    setSavedShippingForm(nextShippingForm);
    setShippingForm(nextShippingForm);
  }, [user]);

  useEffect(() => {
    const resolveSavedLocationCodes = async () => {
      if (!provinces.length || !savedShippingForm.province) {
        return;
      }

      const provinceMatch = provinces.find(
        (province) =>
          String(province.code) === String(savedShippingForm.province) ||
          province.name === savedShippingForm.province,
      );

      if (!provinceMatch) {
        return;
      }

      const normalizedProvinceCode = String(provinceMatch.code);
      const needsProvinceNormalize =
        String(savedShippingForm.province) !== normalizedProvinceCode;

      if (needsProvinceNormalize) {
        setSavedShippingForm((prev) => ({
          ...prev,
          province: normalizedProvinceCode,
        }));
        setShippingForm((prev) => ({
          ...prev,
          province: normalizedProvinceCode,
        }));
      }

      try {
        const districtResponse = await getDistrictsService(provinceMatch.code);
        const nextDistricts = districtResponse?.districts || [];
        setDistricts(nextDistricts);

        if (!savedShippingForm.district) {
          setWards([]);
          return;
        }

        const districtMatch = nextDistricts.find(
          (district) =>
            String(district.code) === String(savedShippingForm.district) ||
            district.name === savedShippingForm.district,
        );

        if (!districtMatch) {
          setWards([]);
          return;
        }

        const normalizedDistrictCode = String(districtMatch.code);
        const needsDistrictNormalize =
          String(savedShippingForm.district) !== normalizedDistrictCode;

        if (needsDistrictNormalize) {
          setSavedShippingForm((prev) => ({
            ...prev,
            district: normalizedDistrictCode,
          }));
          setShippingForm((prev) => ({
            ...prev,
            district: normalizedDistrictCode,
          }));
        }

        const wardResponse = await getWardsService(districtMatch.code);
        const nextWards = wardResponse?.wards || [];
        setWards(nextWards);

        const wardMatch = nextWards.find(
          (ward) =>
            String(ward.code) === String(savedShippingForm.ward) ||
            ward.name === savedShippingForm.ward,
        );

        if (wardMatch) {
          const normalizedWardCode = String(wardMatch.code);
          if (String(savedShippingForm.ward) !== normalizedWardCode) {
            setSavedShippingForm((prev) => ({
              ...prev,
              ward: normalizedWardCode,
            }));
            setShippingForm((prev) => ({
              ...prev,
              ward: normalizedWardCode,
            }));
          }
        }
      } catch (err) {
        console.error("Lỗi khi chuẩn hóa địa chỉ đã lưu:", err);
      }
    };

    resolveSavedLocationCodes();
  }, [provinces, savedShippingForm.province, savedShippingForm.district, savedShippingForm.ward]);

  useEffect(() => {
    const hydrateLocationOptions = async () => {
      if (!provinces.length || !shippingForm.province) {
        return;
      }

      const selectedProvince = provinces.find(
        (province) => String(province.code) === String(shippingForm.province),
      );

      if (!selectedProvince) {
        return;
      }

      try {
        const districtResponse = await getDistrictsService(selectedProvince.code);
        const nextDistricts = districtResponse?.districts || [];
        setDistricts(nextDistricts);

        if (!shippingForm.district) {
          setWards([]);
          return;
        }

        const selectedDistrict = nextDistricts.find(
          (district) => String(district.code) === String(shippingForm.district),
        );

        if (!selectedDistrict) {
          setWards([]);
          return;
        }

        const wardResponse = await getWardsService(selectedDistrict.code);
        setWards(wardResponse?.wards || []);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu địa chỉ đã lưu:", err);
      }
    };

    hydrateLocationOptions();
  }, [provinces, shippingForm.province, shippingForm.district]);

  // Load danh sách tỉnh/thành khi component được mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const response = await getProvincesService();
        setProvinces(response);
      } catch (error) {
        console.error("Lỗi khi tải danh sách tỉnh/thành:", error);
      }
    };
    loadProvinces();
  }, []);

  //Chọn tỉnh/thành => load quận/huyện => chọn quận/huyện => load phường/xã
  const handleShippingChange = async (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));

    //CHon tinh
    if (name === "province") {
      const selectedProvince = provinces.find((p) => p.code == value);

      setDistricts([]);
      setWards([]);

      setShippingForm((prev) => ({
        ...prev,
        province: value,
        district: "",
        ward: "",
      }));

      if (!value || !selectedProvince) return;

      const res = await getDistrictsService(selectedProvince.code);

      setDistricts(res?.districts || []);
    }

    //Chọn quận/huyện
    if (name === "district") {
      const selectedDistrict = districts.find((d) => d.code == value);

      setWards([]);

      setShippingForm((prev) => ({
        ...prev,
        district: value,
        ward: "",
      }));

      if (!value || !selectedDistrict) return;

      const res = await getWardsService(selectedDistrict.code);

      setWards(res?.wards || []);
    }
  };

  const summary = useMemo(() => {
    const subtotal = checkoutItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const shippingFee = subtotal >= 800000 ? 0 : 30000;
    const discount =
      voucher.trim().toUpperCase() === "FREESHIP" ? shippingFee : 0;
    const total = subtotal + shippingFee - discount;

    return { subtotal, shippingFee, discount, total };
  }, [checkoutItems, voucher]);

  // Áp dụng địa chỉ giao hàng cho đơn hiện tại בלבד, không cập nhật hồ sơ user
  const handleUpdateShippingAddress = () => {
    const newErrors = {};

    const { fullName, phone, province, district, ward, detail } = shippingForm;

    if (!fullName?.trim()) newErrors.fullName = "Vui lòng nhập họ tên";
    if (!phone?.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!province) newErrors.province = "Vui lòng chọn thành phố";
    if (!district) newErrors.district = "Vui lòng chọn quận/huyện";
    if (!ward) newErrors.ward = "Vui lòng chọn phường/xã";
    if (!detail?.trim()) newErrors.detail = "Vui lòng nhập địa chỉ chi tiết";

    if (!/^\d{10,11}$/.test(phone || "")) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSavedShippingForm(shippingForm);
    setIsEditing(false);
  };

  const handleCancelShippingUpdate = () => {
    setShippingForm(savedShippingForm);
    setErrors({});
    setIsEditing(false);
  };

  const shippingAddress = buildShippingAddress(
    shippingForm,
    provinces,
    districts,
    wards,
  );

  const shippingDisplay = buildShippingDisplay(
    shippingForm,
    provinces,
    districts,
    wards,
  );

  // Hàm xử lý khi người dùng đặt hàng
  const handlePlaceOrder = async () => {
    setError("");
    setSuccessMessage("");
    setErrors({});

    if (!userId) {
      setErrors((prev) => ({
        ...prev,
        auth: "Vui lòng đăng nhập để tiếp tục.",
      }));
      return;
    }

    if (!shippingAddress) {
      setError("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    if (!selectedPayment) {
      setError("Vui lòng chọn phương thức thanh toán.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get province, district, ward names
      const provinceName =
        provinces.find((p) => p.code == shippingForm.province)?.name || "";
      const districtName =
        districts.find((d) => d.code == shippingForm.district)?.name || "";
      const wardName =
        wards.find((w) => w.code == shippingForm.ward)?.name || "";
      if (!provinceName || !districtName || !wardName) {
        setError("Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã.");
        setIsSubmitting(false);
        return;
      }

      // 🔥 1. Tạo order
      const orderRes = await createOrderService({
        user_id: userId,
        total_price: summary.total,
        payment_method: selectedPayment,
        shipping_address: {
          full_name: shippingForm.fullName,
          phone: shippingForm.phone,
          city: provinceName,
          district: districtName,
          ward: wardName,
          address_detail: shippingForm.detail,
        },
      });

      const order = orderRes?.order;
      const orderId = order?._id;

      if (!orderId) {
        throw new Error("Không tạo được đơn hàng");
      }

      // 🔥 2. Tạo order items
      await Promise.all(
        checkoutItems.map((item) =>
          createOrderItemApi({
            order_id: orderId,
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name,
            product_image: item.product_image,
          }),
        ),
      );

      // 🔥 3. GỌI handlePayment (chỉ gọi 1 lần)
      await handlePayment({
        orderId,
        paymentMethod: selectedPayment,
        navigate,
        setLoading: setIsSubmitting,
      });
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể tạo đơn hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-slate-900 px-6 py-8 text-white shadow-sm sm:px-8">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-300">
          Checkout
        </p>
        <h1 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
          XÁC NHẬN ĐƠN HÀNG
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-200 sm:text-base"></p>
      </div>

      {isLoading ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">
          Đang tải trang...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-4 text-red-600 shadow-sm">
          {error}
        </div>
      ) : checkoutItems.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-xl font-semibold text-slate-900">
            Chưa có sản phẩm để thanh toán
          </p>
          <p className="mt-3 text-slate-500">
            Hãy quay lại giỏ hàng để thêm sản phẩm trước khi checkout.
          </p>
          <Link
            to="/cart"
            className="mt-6 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-orange-500"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-8">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-orange-500">
                    Người nhận
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Thông tin giao hàng
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Họ và tên</span>
                  <input
                    disabled={!isEditing}
                    name="fullName"
                    value={shippingForm.fullName}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Số điện thoại</span>
                  <input
                    disabled={!isEditing}
                    name="phone"
                    value={shippingForm.phone}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Thành phố</span>
                  <select
                    disabled={!isEditing}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    name="province"
                    id=""
                    value={shippingForm.province}
                    onChange={handleShippingChange}
                  >
                    <option value="">Chọn thành phố</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="text-red-500 text-sm">{errors.province}</p>
                  )}
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Quận/Huyện</span>
                  <select
                    name="district"
                    id=""
                    value={shippingForm.district}
                    onChange={handleShippingChange}
                    disabled={!isEditing}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="text-red-500 text-sm">{errors.district}</p>
                  )}
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Phường/Xã</span>
                  <select
                    name="ward"
                    id=""
                    value={shippingForm.ward}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                    disabled={!isEditing}
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                  {errors.ward && (
                    <p className="text-red-500 text-sm">{errors.ward}</p>
                  )}
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm text-slate-500">
                    Địa chỉ chi tiết
                  </span>
                  <input
                    name="detail"
                    value={shippingForm.detail}
                    onChange={handleShippingChange}
                    disabled={!isEditing}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                  {errors.detail && (
                    <p className="text-red-500 text-sm">{errors.detail}</p>
                  )}
                </label>
                <div className="rounded-3xl bg-slate-50 p-5 md:col-span-2">
                  
                  {errors.auth && (
                    <p className="mt-2 text-sm text-red-500">{errors.auth}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                      >
                        Cập nhật cho đơn hàng
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleUpdateShippingAddress}
                          className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                          >
                          Lưu cho đơn hàng
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelShippingUpdate}
                          className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-500">
                Payment
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Phương thức thanh toán
              </h2>

              <div className="mt-6 grid gap-4">
                {paymentOptions.map((option) => {
                  const isSelected = selectedPayment === option.id;

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-4 rounded-3xl border p-5 transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedPayment(option.id)}
                        className="mt-1 h-4 w-4 accent-slate-900"
                      />
                      <div>
                        <p className="text-lg font-semibold">{option.title}</p>
                        <p
                          className={`mt-2 text-sm ${
                            isSelected ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-500">
                Note
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Ghi chú đơn hàng
              </h2>

              <textarea
                rows="5"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
                className="mt-6 w-full rounded-3xl border border-slate-300 px-5 py-4 text-base text-slate-900 outline-none transition focus:border-slate-900"
              />
            </article>
          </div>

          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-6">
            <p className="text-sm uppercase tracking-[0.24em] text-orange-500">
              Order summary
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Đơn hàng của bạn
            </h2>

            <div className="mt-6 grid gap-4">
              {checkoutItems.map((item) => (
                <div
                  key={item._id}
                  className="grid grid-cols-[88px_1fr] gap-4 rounded-3xl bg-slate-50 p-4"
                >
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    className="h-22 w-22 rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.product_name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Phân loại: {item.variant}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Số lượng: {item.quantity}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(item.oldPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
              <label className="block text-sm font-medium text-slate-700">
                Mã ưu đãi
              </label>
              <input
                value={voucher}
                onChange={(event) => setVoucher(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-dashed border-slate-200 pt-6">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(summary.shippingFee)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600">
                <span>Giảm giá</span>
                <span>-{formatCurrency(summary.discount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xl font-bold text-slate-900">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(summary.total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={
                isSubmitting ||
                !userId ||
                !shippingAddress ||
                !selectedPayment ||
                checkoutItems.length === 0
              }
              className="mt-8 w-full rounded-full bg-slate-900 px-6 py-4 text-base font-bold uppercase tracking-[0.16em] text-white transition hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang đặt hàng..." : "Đặt hàng ngay"}
            </button>
            {successMessage ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                {successMessage}
              </p>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
};

export default CheckoutPage;
