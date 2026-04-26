import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getUserOrdersApi,
  getUserProfileApi,
  initializeUserAccountApi,
  updateUserPasswordApi,
  updateUserProfileApi,
} from "../../api/userAccountApi";
import { GrFormView } from "react-icons/gr";
import { GrFormViewHide } from "react-icons/gr";

const profileDefaultForm = {
  userName: "",
  fullName: "",
  avatar_url: "",
};

const shippingDefaultForm = {
  addressFullName: "",
  addressPhone: "",
  addressCity: "",
  addressDistrict: "",
  addressDetail: "",
};

const passwordDefaultForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const phonePattern = /^0\d{9}$/;

const orderStatusMap = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const orderStatusOptions = Object.entries(orderStatusMap).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

const paymentMethodMap = {
  cod: "Thanh toán khi nhận hàng",
  momo: "Ví MoMo",
  vnpay: "VNPay",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeProfilePayload = (
  profileForm,
  shippingForm,
  currentProfile,
) => ({
  ...currentProfile,
  userName: profileForm.userName.trim(),
  fullName: profileForm.fullName.trim(),
  avatar_url: profileForm.avatar_url.trim(),
  address: [
    {
      fullName: shippingForm.addressFullName.trim(),
      phone: shippingForm.addressPhone.trim(),
      city: shippingForm.addressCity.trim(),
      district: shippingForm.addressDistrict.trim(),
      detail: shippingForm.addressDetail.trim(),
    },
  ],
});

const UserAccountManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("all");
  const [profileForm, setProfileForm] = useState(profileDefaultForm);
  const [shippingForm, setShippingForm] = useState(shippingDefaultForm);
  const [passwordForm, setPasswordForm] = useState(passwordDefaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [hidePassword, setHidePassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

  const fetchAccountData = async () => {
    setIsLoading(true);
    setProfileError("");

    try {
      await initializeUserAccountApi();
      const [profileResponse, ordersResponse] = await Promise.all([
        getUserProfileApi(),
        getUserOrdersApi(),
      ]);

      const userData = await profileResponse.json();
      const orderData = await ordersResponse.json();

      setProfile(userData);
      setOrders(orderData.orders || []);
      setOrderItems(orderData.orderItems || []);
      setProfileForm({
        userName: userData.userName || "",
        fullName: userData.fullName || "",
        avatar_url: userData.avatar_url || "",
      });
      setShippingForm({
        addressFullName: userData.address?.[0]?.fullName || "",
        addressPhone: userData.address?.[0]?.phone || "",
        addressCity: userData.address?.[0]?.city || "",
        addressDistrict: userData.address?.[0]?.district || "",
        addressDetail: userData.address?.[0]?.detail || "",
      });
    } catch {
      setProfileError("Không thể tải thông tin tài khoản.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabFromQuery = searchParams.get("tab");

    if (location.pathname === "/orders") {
      setActiveTab("orders");
      return;
    }

    if (
      tabFromQuery &&
      ["profile", "orders", "address", "password"].includes(tabFromQuery)
    ) {
      setActiveTab(tabFromQuery);
    }
  }, [location.pathname, location.search]);

  const ordersWithItems = useMemo(() => {
    return orders
      .filter((order) => order.user_id === profile?._id)
      .sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      )
      .map((order) => ({
        ...order,
        items: orderItems.filter((item) => item.order_id === order._id),
      }));
  }, [orderItems, orders, profile?._id]);

  const filteredOrdersWithItems = useMemo(() => {
    if (selectedOrderStatus === "all") {
      return ordersWithItems;
    }

    return ordersWithItems.filter(
      (order) => order.status === selectedOrderStatus,
    );
  }, [ordersWithItems, selectedOrderStatus]);

  return (
      <div className="">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-500 hover:text-blue-700">
          ← Quay lại
        </button>
        <h1 className="text-center py-10 text-4xl font-bold uppercase text-slate-900">
          Lịch Sử Mua Hàng
        </h1>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setSelectedOrderStatus("all")}
            className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
              selectedOrderStatus === "all"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
            }`}
          >
            Tất cả
          </button>
          {orderStatusOptions.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setSelectedOrderStatus(status.value)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                selectedOrderStatus === status.value
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-orange-500 hover:text-orange-500"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-4">
          {filteredOrdersWithItems.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-slate-500">
              {selectedOrderStatus === "all"
                ? "Chưa có đơn hàng nào."
                : "Không có đơn hàng nào ở trạng thái này."}
            </div>
          ) : (
            filteredOrdersWithItems.map((order) => (
              <article
                key={order._id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-orange-500">
                      Mã đơn: {order._id}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">
                      {orderStatusMap[order.status] || order.status}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Thanh toán:{" "}
                      {paymentMethodMap[order.payment_method] ||
                        order.payment_method}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Giao tới: {order.shipping_address}
                    </p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-sm text-slate-500">Tổng đơn</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatCurrency(order.total_price)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {order.items.map((item) => (
                    <div
                      key={item._id}
                      className="grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[72px_1fr_auto]"
                    >
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-[72px] w-[72px] rounded-2xl object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.product_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Mã sản phẩm: {item.product_id}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(item.price)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Variant: {item.variant_id || "Không có"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
  );
};

export default UserAccountManagement;
