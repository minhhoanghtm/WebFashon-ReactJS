import { useEffect, useMemo, useState } from "react";
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

const normalizeProfilePayload = (profileForm, shippingForm, currentProfile) => ({
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
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
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

  const ordersWithItems = useMemo(() => {
    return orders
      .filter((order) => order.user_id === profile?._id)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .map((order) => ({
        ...order,
        items: orderItems.filter((item) => item.order_id === order._id),
      }));
  }, [orderItems, orders, profile?._id]);

  const handleProfileChange = ({ target }) => {
    const { name, value } = target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = ({ target }) => {
    const { name, value } = target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = ({ target }) => {
    const { name, value } = target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async ({ target }) => {
    const file = target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError("Vui lòng chọn đúng file hình ảnh.");
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      setProfileForm((prev) => ({ ...prev, avatar_url: imageDataUrl }));
      setProfileError("");
    } catch {
      setProfileError("Không thể đọc file hình ảnh.");
    }
  };

  const saveMergedProfile = async (nextProfileForm, nextShippingForm) => {
    const payload = normalizeProfilePayload(nextProfileForm, nextShippingForm, profile);
    const response = await updateUserProfileApi(payload);
    const result = await response.json();
    setProfile(result);
    return result;
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    if (
      !profileForm.userName.trim() ||
      !profileForm.fullName.trim() ||
      !profileForm.avatar_url.trim()
    ) {
      setProfileError("Vui lòng nhập đầy đủ thông tin cá nhân.");
      setIsSavingProfile(false);
      return;
    }

    try {
      await saveMergedProfile(profileForm, shippingForm);
      setProfileMessage("Đã lưu thay đổi thông tin cá nhân.");
    } catch {
      setProfileError("Không thể cập nhật thông tin cá nhân.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveShipping = async (event) => {
    event.preventDefault();
    setIsSavingShipping(true);
    setShippingError("");
    setShippingMessage("");

    if (
      !shippingForm.addressFullName.trim() ||
      !shippingForm.addressPhone.trim() ||
      !shippingForm.addressCity.trim() ||
      !shippingForm.addressDistrict.trim() ||
      !shippingForm.addressDetail.trim()
    ) {
      setShippingError("Vui lòng nhập đầy đủ thông tin giao hàng.");
      setIsSavingShipping(false);
      return;
    }

    if (!phonePattern.test(shippingForm.addressPhone.trim())) {
      setShippingError("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.");
      setIsSavingShipping(false);
      return;
    }

    try {
      await saveMergedProfile(profileForm, shippingForm);
      setShippingMessage("Đã cập nhật thông tin giao hàng.");
    } catch {
      setShippingError("Không thể cập nhật thông tin giao hàng.");
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleSavePassword = async (event) => {
    event.preventDefault();
    setIsSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    if (
      !passwordForm.currentPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    ) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      setIsSavingPassword(false);
      return;
    }

    if (passwordForm.currentPassword !== profile?.passWord) {
      setPasswordError("Mật khẩu hiện tại không đúng.");
      setIsSavingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu phải giống nhau.");
      setIsSavingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      setIsSavingPassword(false);
      return;
    }

    try {
      const response = await updateUserPasswordApi(passwordForm.newPassword);
      const result = await response.json();

      setProfile(result);
      setPasswordForm(passwordDefaultForm);
      setPasswordMessage("Đã cập nhật mật khẩu thành công.");
    } catch {
      setPasswordError("Không thể cập nhật mật khẩu.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleHidePasswordToggle = (field) => {
    if (field === "current") {
      setHidePassword((prev) => !prev);
    } else if (field === "new") {
      setHideNewPassword((prev) => !prev);
    } else if (field === "confirm") {
      setHideConfirmPassword((prev) => !prev);
    }
  }
  const menuItems = [
    { id: "profile", label: "Thông Tin Cá Nhân" },
    { id: "orders", label: "Lịch Sử Mua Hàng" },
    { id: "address", label: "Thông Tin Giao Hàng" },
    { id: "password", label: "Đổi Mật Khẩu" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={profile?.avatar_url}
              alt={profile?.fullName}
              className="h-20 w-20 rounded-3xl object-cover"
            />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Tài khoản
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Xin chào, {profile?.fullName || "người dùng"}!
              </h2>
            </div>
          </div>

          {/* <button
            type="button"
            className="mt-6 text-left text-sm font-semibold uppercase tracking-[0.12em] text-slate-900 underline"
          >
            Đăng xuất
          </button> */}

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between border-b border-slate-200 px-5 py-5 text-left text-lg font-semibold last:border-b-0 ${
                  activeTab === item.id
                    ? "bg-slate-50 text-slate-900"
                    : "bg-white text-slate-700"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-slate-400">›</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {isLoading ? (
            <div className="py-20 text-center text-slate-500">Đang tải dữ liệu...</div>
          ) : (
            <>
              {activeTab === "profile" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Thông Tin Cá Nhân
                  </h1>

                  <form className="mt-10 grid gap-6" onSubmit={handleSaveProfile} noValidate>
                    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-start">
                      <div className="grid gap-3">
                        <img
                          src={profileForm.avatar_url}
                          alt={profileForm.fullName}
                          className="h-44 w-44 rounded-3xl object-cover"
                        />
                        <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-900">
                          Chọn ảnh từ máy
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="grid gap-6">
                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">Họ</span>
                          <input
                            name="lastName"
                            value={profileForm.lastName}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">Tên</span>
                          <input
                            name="firstName"
                            value={profileForm.firstName}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">Ngày sinh</span>
                          <input
                            type="date"
                            name="birthDate"
                            value={profileForm.birthDate}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">Giới tính</span>
                          <select
                            name="gender"
                            value={profileForm.gender}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          >
                            <option value="">Chọn giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                          </select>
                        </label>
                      </div>
                    </div>

                    {profileError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {profileError}
                      </div>
                    ) : null}

                    {profileMessage ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {profileMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="mt-2 w-fit bg-slate-900 px-10 py-4 text-xl font-bold uppercase text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "orders" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Lịch Sử Mua Hàng
                  </h1>

                  <div className="mt-10 grid gap-4">
                    {ordersWithItems.length === 0 ? (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-slate-500">
                        Chưa có đơn hàng nào.
                      </div>
                    ) : (
                      ordersWithItems.map((order) => (
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
                                Thanh toán: {paymentMethodMap[order.payment_method] || order.payment_method}
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
              ) : null}

              {activeTab === "address" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Thông Tin Giao Hàng
                  </h1>

                  <form className="mt-10 grid gap-6" onSubmit={handleSaveShipping} noValidate>
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Người nhận</span>
                        <input
                          name="addressFullName"
                          value={shippingForm.addressFullName}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                        <input
                          name="addressPhone"
                          value={shippingForm.addressPhone}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Thành phố</span>
                        <input
                          name="addressCity"
                          value={shippingForm.addressCity}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">Quận/Huyện</span>
                        <input
                          name="addressDistrict"
                          value={shippingForm.addressDistrict}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Địa chỉ chi tiết</span>
                      <input
                        name="addressDetail"
                        value={shippingForm.addressDetail}
                        onChange={handleShippingChange}
                        className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                      />
                    </label>

                    {shippingError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {shippingError}
                      </div>
                    ) : null}

                    {shippingMessage ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {shippingMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSavingShipping}
                      className="mt-2 w-fit bg-slate-900 px-10 py-4 text-xl font-bold uppercase text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSavingShipping ? "Đang lưu..." : "Lưu địa chỉ"}
                    </button>
                  </form>
                </div>
              ) : null}

              {activeTab === "password" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Đổi Mật Khẩu
                  </h1>

                  <form className="mt-10 grid gap-6" onSubmit={handleSavePassword} noValidate>
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Mật khẩu hiện tại</span>
                      
                      <div className="relative">
                        <input
                        type={hidePassword ? "password" : "text"}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" onClick={() => handleHidePasswordToggle("current")} >
                        {hidePassword ? <GrFormViewHide className="text-3xl"/> : <GrFormView className="text-3xl"/>}
                      </span>
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Mật khẩu mới</span>
                      
                      <div className="relative">
                      <input
                        type={hideNewPassword ? "password" : "text"}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" onClick={() => handleHidePasswordToggle("new")}>
                        {hideNewPassword ? <GrFormViewHide className="text-3xl"/> : <GrFormView className="text-3xl"/>}
                      </span>
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</span>
                      
                      <div className="relative">
                      <input
                        type={hideConfirmPassword ? "password" : "text"}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" onClick={() => handleHidePasswordToggle("confirm")}>
                        {hideConfirmPassword ? <GrFormViewHide className="text-3xl"/> : <GrFormView className="text-3xl"/>}
                      </span>
                      </div>
                    </label>

                    {passwordError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {passwordError}
                      </div>
                    ) : null}

                    {passwordMessage ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {passwordMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="mt-2 w-fit bg-slate-900 px-10 py-4 text-xl font-bold uppercase text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSavingPassword ? "Đang lưu..." : "Cập nhật mật khẩu"}
                    </button>
                  </form>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserAccountManagement;
