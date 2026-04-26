import { useEffect, useMemo, useState } from "react";
import {
  getUserProfileApi,
  initializeUserAccountApi,
} from "../../api/userAccountApi";
import {
  getCartApi,
  initializeCartApi,
} from "../../api/cartApi";
import { Link } from "react-router-dom";

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

const buildShippingAddress = (address) =>
  [address?.detail, address?.district, address?.city]
    .filter(Boolean)
    .join(", ");

const CheckoutPage = () => {
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [note, setNote] = useState("");
  const [voucher, setVoucher] = useState("FREESHIP");
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    district: "",
    detail: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCheckoutData = async () => {
      setIsLoading(true);
      setError("");

      try {
        await Promise.all([
          initializeUserAccountApi(),
          initializeCartApi(),
        ]);

        const [profileResponse, cartResponse] = await Promise.all([
          getUserProfileApi(),
          getCartApi(),
        ]);

        const profileData = await profileResponse.json();
        const cartData = await cartResponse.json();

        const previewItems = (cartData.cartItems || []).map((item) => ({
            _id: item._id,
            name: item.product?.name || "Sản phẩm",
            image: item.product?.displayProduct?.[0] || "",
            price: item.price,
            oldPrice: item.product?.old_price || item.price,
            quantity: item.quantity,
            variant: item.variant_id ? item.variant_id.replaceAll("-", " ") : "Mặc định",
          }));

        setCheckoutItems(previewItems);
        setShippingForm({
          fullName:
            profileData?.address?.[0]?.fullName || profileData?.fullName || "",
          phone: profileData?.address?.[0]?.phone || "",
          city: profileData?.address?.[0]?.city || "",
          district: profileData?.address?.[0]?.district || "",
          detail: profileData?.address?.[0]?.detail || "",
        });
      } catch {
        setError("Khong the tai du lieu thanh toan.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, []);

  const handleShippingChange = ({ target }) => {
    const { name, value } = target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
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

  const shippingAddress = buildShippingAddress(shippingForm);

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
          <p className="text-xl font-semibold text-slate-900">Chưa có sản phẩm để thanh toán</p>
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
                    name="fullName"
                    value={shippingForm.fullName}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Số điện thoại</span>
                  <input
                    name="phone"
                    value={shippingForm.phone}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Thành phố</span>
                  <input
                    name="city"
                    value={shippingForm.city}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-slate-500">Quận/Huyện</span>
                  <input
                    name="district"
                    value={shippingForm.district}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-sm text-slate-500">
                    Địa chỉ chi tiết
                  </span>
                  <input
                    name="detail"
                    value={shippingForm.detail}
                    onChange={handleShippingChange}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </label>
                <div className="rounded-3xl bg-slate-50 p-5 md:col-span-2">
                  <p className="text-sm text-slate-500">Địa chỉ nhận hàng</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {shippingAddress || "Chưa cập nhật địa chỉ giao hàng"}
                  </p>
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
                    src={item.image}
                    alt={item.name}
                    className="h-[88px] w-[88px] rounded-2xl object-cover"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.name}
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
              className="mt-8 w-full rounded-full bg-slate-900 px-6 py-4 text-base font-bold uppercase tracking-[0.16em] text-white transition hover:bg-orange-500"
            >
              Đặt hàng ngay
            </button>
          </aside>
        </div>
      )}
    </section>
  );
};

export default CheckoutPage;
