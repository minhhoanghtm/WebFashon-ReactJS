import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { GrFormView } from "react-icons/gr";
import { GrFormViewHide } from "react-icons/gr";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "@/services/location.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  updatePasswordService,
  updateProfileService,
} from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateToInput } from "@/utils/format";

const profileDefaultForm = {
  lastName: "",
  firstName: "",
  avatar_url: "",
  birthday: "",
  sex: "",
};

const shippingDefaultForm = {
  addressFullName: "",
  addressPhone: "",
  provinceCode: "",
  districtCode: "",
  wardCode: "",
  addressDetail: "",
};

const passwordDefaultForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const phonePattern = /^0\d{9}$/;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const menuItems = [
  { id: "profile", label: "Thông Tin Cá Nhân" },
  { id: "address", label: "Thông Tin Giao Hàng" },
  { id: "password", label: "Đổi Mật Khẩu" },
];

const getSavedAddress = (userData) => {
  return userData?.addresses?.[0] || userData?.address?.[0] || userData?.address || null;
};

const UserAccountManagement = () => {
  useDocumentTitle("Quản lý tài khoản");
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
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
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  //update user info moi khi vao trang
  const [isEditing, setIsEditing] = useState(false);
  const { user, setUser } = useAuth();
  // console.log("Header user:", user);
  const avatarUrl =
    user?.data.avatar_url ||
    "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg";
  const lastName = user?.data.fullName?.split(" ").slice(0, -1).join(" ") || "";
  const firstName = user?.data.fullName?.split(" ").slice(-1).join(" ") || "";
  const birthDate = formatDate(user?.data.birthday) || "";
  const sex = user?.data?.sex || "";
  console.log("avatarUrl:", avatarUrl);
  console.log("lastName:", lastName);
  console.log("firstName:", firstName);
  console.log("birthDate:", birthDate);
  console.log("sex:", sex);

  //Load tinh thành, quận huyện, phường xã
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await getProvincesService();
        setProvinces(res);
      } catch (err) {
        console.error("Lỗi load tỉnh:", err);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    const hydrateShippingOptions = async () => {
      const savedAddress = getSavedAddress(user?.data);

      if (!savedAddress || !provinces.length) {
        return;
      }

      const provinceCode =
        savedAddress.provinceCode || savedAddress.province || savedAddress.city || "";
      const districtCode = savedAddress.districtCode || savedAddress.district || "";
      const wardCode = savedAddress.wardCode || savedAddress.ward || "";

      if (!provinceCode) {
        return;
      }

      try {
        const provinceMatch = provinces.find(
          (province) => String(province.code) === String(provinceCode),
        );

        if (!provinceMatch) {
          return;
        }

        const districtRes = await getDistrictsService(provinceMatch.code);
        const nextDistricts = districtRes?.districts || [];
        setDistricts(nextDistricts);

        if (!districtCode) {
          setWards([]);
          return;
        }

        const districtMatch = nextDistricts.find(
          (district) => String(district.code) === String(districtCode),
        );

        if (!districtMatch) {
          setWards([]);
          return;
        }

        const wardRes = await getWardsService(districtMatch.code);
        setWards(wardRes?.wards || []);

        // Chuẩn hóa lại giá trị đang hiển thị để select có thể match option
        setShippingForm((prev) => ({
          ...prev,
          provinceCode: String(provinceMatch.code),
          districtCode: String(districtMatch.code),
          wardCode: wardCode ? String(wardCode) : "",
        }));
      } catch (err) {
        console.error("Lỗi hydrate địa chỉ giao hàng:", err);
      }
    };

    hydrateShippingOptions();
  }, [user, provinces]);
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

  const handleProfileChange = ({ target }) => {
    const { name, value } = target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = async ({ target }) => {
    const { name, value } = target;

    setShippingForm((prev) => ({ ...prev, [name]: value }));

    // chọn tỉnh
    if (name === "provinceCode") {
      setDistricts([]);
      setWards([]);

      setShippingForm((prev) => ({
        ...prev,
        provinceCode: value,
        districtCode: "",
        wardCode: "",
      }));

      if (!value) return;

      const res = await getDistrictsService(value);
      setDistricts(res?.districts || []);
    }

    // chọn huyện
    if (name === "districtCode") {
      setWards([]);

      setShippingForm((prev) => ({
        ...prev,
        districtCode: value,
        wardCode: "",
      }));

      if (!value) return;

      const res = await getWardsService(value);
      setWards(res?.wards || []);
    }
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

  // const saveMergedProfile = async (nextProfileForm, nextShippingForm) => {
  //   const payload = normalizeProfilePayload(
  //     nextProfileForm,
  //     nextShippingForm,
  //     profile,
  //   );
  //   const response = await updateUserProfileApi(payload);
  //   const result = await response.json();
  //   setProfile(result);
  //   return result;
  // };

  //Cập nhật profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");

    try {
      const payload = {
        fullName: profileForm.lastName + " " + profileForm.firstName,
        avatar_url: profileForm.avatar_url,
        birthday: profileForm.birthday,
        sex: profileForm.sex,
      };

      const updatedData = await updateProfileService(payload);
      // service đã return res.data, nên wrap đúng format cho AuthContext
      setUser({ data: updatedData.data });

      setProfileMessage("Cập nhật thành công");
      setIsEditing(false);
    } catch (err) {
      setProfileError("Không thể cập nhật thông tin");
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
      !shippingForm.addressFullName?.trim() ||
      !shippingForm.addressPhone?.trim() ||
      !shippingForm.provinceCode ||
      !shippingForm.districtCode ||
      !shippingForm.wardCode ||
      !shippingForm.addressDetail?.trim()
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
      const payload = {
        fullName: profileForm.lastName + " " + profileForm.firstName,
        avatar_url: profileForm.avatar_url,
        birthday: profileForm.birthday,
        sex: profileForm.sex,
        address: {
          fullName: shippingForm.addressFullName.trim(),
          phone: shippingForm.addressPhone.trim(),
          provinceCode: shippingForm.provinceCode,
          districtCode: shippingForm.districtCode,
          wardCode: shippingForm.wardCode,
          addressDetail: shippingForm.addressDetail.trim(),
        },
      };

      const updatedData = await updateProfileService(payload);
      setUser({ data: updatedData.data });
      setShippingMessage("Đã cập nhật thông tin giao hàng.");
    } catch {
      setShippingError("Không thể cập nhật thông tin giao hàng.");
    } finally {
      setIsSavingShipping(false);
    }
  };

  //Cập nhật mật khẩu
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
      await updatePasswordService({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(passwordDefaultForm);
      setPasswordMessage("Đã cập nhật mật khẩu thành công.");
    } catch (err) {
      // Axios ném lỗi nếu server trả 4xx/5xx
      const msg =
        err?.response?.data?.message || "Không thể cập nhật mật khẩu.";
      setPasswordError(msg);
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
  };
  useEffect(() => {
    if (user?.data) {
      setIsLoading(false);
    }
  }, [user]);
  useEffect(() => {
    if (user?.data) {
      const fullName = user.data.fullName || "";
      const storedAddress = getSavedAddress(user.data) || {};

      setProfileForm({
        lastName: fullName.split(" ").slice(0, -1).join(" "),
        firstName: fullName.split(" ").slice(-1).join(" "),
        avatar_url: user.data.avatar_url || "",
        birthday: user.data.birthday || "",
        sex: user.data.sex || "",
      });
      setShippingForm({
        addressFullName: storedAddress.fullName || "",
        addressPhone: storedAddress.phone || "",
        provinceCode: storedAddress.provinceCode || "",
        districtCode: storedAddress.districtCode || "",
        wardCode: storedAddress.wardCode || "",
        addressDetail: storedAddress.addressDetail || "",
      });
    }
  }, [user]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={profileForm.avatar_url || avatarUrl}
              alt={profileForm.lastName + " " + profileForm.firstName}
              className="h-20 w-20 rounded-3xl object-cover"
            />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Tài khoản
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Xin chào, {lastName + " " + firstName || "người dùng"}!
              </h2>
            </div>
          </div>

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
            <div className="py-20 text-center text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {activeTab === "profile" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Thông Tin Cá Nhân
                  </h1>

                  <form
                    className="mt-10 grid gap-6"
                    onSubmit={handleSaveProfile}
                    noValidate
                  >
                    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-start">
                      <div className="grid gap-3">
                        <img
                          src={profileForm.avatar_url || avatarUrl}
                          alt={lastName + " " + firstName}
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
                          <span className="text-sm font-medium text-slate-700">
                            Họ
                          </span>
                          <input
                            name="lastName"
                            value={profileForm.lastName}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            Tên
                          </span>
                          <input
                            name="firstName"
                            value={profileForm.firstName}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            Ngày sinh
                          </span>
                          <input
                            type="date"
                            name="birthday"
                            value={formatDateToInput(profileForm.birthday)}
                            onChange={handleProfileChange}
                            className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">
                            Giới tính
                          </span>
                          <select
                            name="sex"
                            value={profileForm.sex}
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

                    <div className="flex gap-4 mt-4">
                      {!isEditing ? (
                        // 👉 Chế độ bình thường
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="bg-slate-900 px-10 py-4 text-xl font-bold text-white hover:bg-orange-500"
                        >
                          Thay đổi thông tin
                        </button>
                      ) : (
                        <>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="bg-slate-900 px-10 py-4 text-xl font-bold text-white hover:bg-green-600"
                          >
                            {isSavingProfile ? "Đang lưu..." : "Lưu"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);

                              // 🔥 reset lại dữ liệu ban đầu
                              const fullName = user?.data?.fullName || "";

                              setProfileForm({
                                lastName: fullName
                                  .split(" ")
                                  .slice(0, -1)
                                  .join(" "),
                                firstName: fullName
                                  .split(" ")
                                  .slice(-1)
                                  .join(" "),
                                avatar_url: user?.data?.avatar_url || "",
                                birthday: user?.data?.birthday || "",
                                sex: user?.data?.sex || "",
                              });
                            }}
                            className="bg-gray-400 px-10 py-4 text-xl font-bold text-white hover:bg-gray-500"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                    </div>
                  </form>
                </div>
              ) : null}

              {activeTab === "address" ? (
                <div>
                  <h1 className="text-4xl font-bold uppercase text-slate-900">
                    Thông Tin Giao Hàng
                  </h1>

                  <form
                    className="mt-10 grid gap-6"
                    onSubmit={handleSaveShipping}
                    noValidate
                  >
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Người nhận */}
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Người nhận
                        </span>
                        <input
                          name="addressFullName"
                          value={shippingForm.addressFullName}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>

                      {/* SĐT */}
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Số điện thoại
                        </span>
                        <input
                          name="addressPhone"
                          value={shippingForm.addressPhone}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                      </label>
                    </div>

                    {/* Tỉnh + Huyện */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Tỉnh */}
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Thành phố
                        </span>
                        <select
                          name="provinceCode"
                          value={shippingForm.provinceCode}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg"
                        >
                          <option value="">Chọn tỉnh/thành</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      {/* Huyện */}
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Quận/Huyện
                        </span>
                        <select
                          name="districtCode"
                          value={shippingForm.districtCode}
                          onChange={handleShippingChange}
                          className="rounded-xl border border-slate-300 px-5 py-4 text-lg"
                        >
                          <option value="">Chọn quận/huyện</option>
                          {districts.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* Phường */}
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Phường/Xã
                      </span>
                      <select
                        name="wardCode"
                        value={shippingForm.wardCode}
                        onChange={handleShippingChange}
                        className="rounded-xl border border-slate-300 px-5 py-4 text-lg"
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.code}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Địa chỉ chi tiết */}
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Địa chỉ chi tiết
                      </span>
                      <input
                        name="addressDetail"
                        value={shippingForm.addressDetail}
                        onChange={handleShippingChange}
                        className="rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                      />
                    </label>

                    {/* Error */}
                    {shippingError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {shippingError}
                      </div>
                    ) : null}

                    {/* Success */}
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

                  <form
                    className="mt-10 grid gap-6"
                    onSubmit={handleSavePassword}
                    noValidate
                  >
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Mật khẩu hiện tại
                      </span>

                      <div className="relative">
                        <input
                          type={hidePassword ? "password" : "text"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                        <span
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
                          onClick={() => handleHidePasswordToggle("current")}
                        >
                          {hidePassword ? (
                            <GrFormViewHide className="text-3xl" />
                          ) : (
                            <GrFormView className="text-3xl" />
                          )}
                        </span>
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Mật khẩu mới
                      </span>

                      <div className="relative">
                        <input
                          type={hideNewPassword ? "password" : "text"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                        <span
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
                          onClick={() => handleHidePasswordToggle("new")}
                        >
                          {hideNewPassword ? (
                            <GrFormViewHide className="text-3xl" />
                          ) : (
                            <GrFormView className="text-3xl" />
                          )}
                        </span>
                      </div>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        Xác nhận mật khẩu mới
                      </span>

                      <div className="relative">
                        <input
                          type={hideConfirmPassword ? "password" : "text"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full rounded-xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-slate-900"
                        />
                        <span
                          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500"
                          onClick={() => handleHidePasswordToggle("confirm")}
                        >
                          {hideConfirmPassword ? (
                            <GrFormViewHide className="text-3xl" />
                          ) : (
                            <GrFormView className="text-3xl" />
                          )}
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
