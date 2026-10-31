import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Order from "../Order";
import MyCoupons from "../MyCoupons";
import Favorites from "../Favorites";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Heart,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Ticket,
  Truck,
  User,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { orderApi } from "../../api/order.api";
import { userApi } from "../../api/user.api";
import voucherApi from "../../api/voucher.api";
import {
  getDistrictsService,
  getProvincesService,
  getWardsService,
} from "../../services/location.service";
import { uploadImageService } from "../../services/upload.service";
import { useAuthStore } from "../../store/auth.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const DEFAULT_AVATAR =
  "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg";

const removeAdministrativePrefix = (name = "") =>
  name
    .replace(/^(Thành phố|Tỉnh)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/^(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeProvince = (province) => ({
  code: String(province.ProvinceID || province.code || ""),
  name: province.ProvinceName || province.name || "",
  displayName: removeAdministrativePrefix(
    province.ProvinceName || province.name || ""
  ),
  districts: province.districts || [],
});

const normalizeDistrict = (district) => ({
  code: String(district.DistrictID || district.code || ""),
  name: district.DistrictName || district.name || "",
  wards: district.wards || [],
});

const normalizeWard = (ward) => ({
  code: String(ward.WardCode || ward.code || ""),
  name: ward.WardName || ward.name || "",
});

const findLocationByCodeOrName = (
  items,
  value,
  getDisplayName = (item) => item.name
) => {
  if (!value) return null;
  const textValue = String(value);
  const normalizedValue = normalizeSearchText(textValue);

  return (
    items.find((item) => String(item.code) === textValue) ||
    items.find((item) => {
      const normalizedName = normalizeSearchText(item.name);
      const normalizedDisplayName = normalizeSearchText(getDisplayName(item));
      return (
        normalizedName === normalizedValue ||
        normalizedDisplayName === normalizedValue
      );
    }) ||
    null
  );
};

const STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    icon: Clock3,
  },
  confirmed: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
  },
  shipping: {
    label: "Đang giao",
    icon: Truck,
  },
  delivered: {
    label: "Hoàn thành",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Đã hủy",
    icon: XCircle,
  },
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + "đ";

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getUserName = (profile = {}) =>
  profile.fullName || profile.name || profile.username || "Khách hàng";

const getUserEmail = (profile = {}) => profile.email || "Chưa cập nhật";

const getInitial = (profile = {}) => {
  const name = getUserName(profile).trim();
  return name ? name.charAt(0).toUpperCase() : "U";
};

const getAvatarUrl = (profile = {}) =>
  profile.avatar_url || profile.avatar || profile.image || "";

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

const getPhone = (profile = {}) => {
  const primaryAddress = getPrimaryAddress(profile);
  return (
    profile.phone ||
    profile.phoneNumber ||
    primaryAddress?.phone ||
    "Chưa cập nhật"
  );
};

const getGenderLabel = (value) => {
  if (value === "male") return "Nam";
  if (value === "female") return "Nữ";
  return "Chưa cập nhật";
};

const getAddressLocationValues = (address = {}) => {
  const safeAddress = address || {};
  return {
    provinceValue:
      safeAddress.city ||
      safeAddress.province ||
      safeAddress.provinceName ||
      safeAddress.provinceCode ||
      "",
    districtValue:
      safeAddress.district ||
      safeAddress.districtName ||
      safeAddress.districtCode ||
      "",
    wardValue:
      safeAddress.ward || safeAddress.wardName || safeAddress.wardCode || "",
  };
};

const formatAddress = (address) => {
  if (!address) return "Chưa cập nhật";

  const { provinceValue, districtValue, wardValue } =
    getAddressLocationValues(address);
  const parts = [
    address.addressDetail || address.detail,
    wardValue,
    districtValue,
    provinceValue,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Chưa cập nhật";
};

const resolveAddressText = async (address) => {
  if (!address) return "Chưa cập nhật";

  const { provinceValue, districtValue, wardValue } =
    getAddressLocationValues(address);
  let provinceName = provinceValue;
  let districtName = districtValue;
  let wardName = wardValue;

  try {
    const apiProvinces = await getProvincesService();
    const provinceSource = Array.isArray(apiProvinces) ? apiProvinces : [];
    const provinces = provinceSource.map(normalizeProvince);
    const province = findLocationByCodeOrName(
      provinces,
      provinceValue,
      (item) => item.displayName || item.name
    );

    if (province) {
      provinceName = province.displayName || province.name;

      const provinceDetail = await getDistrictsService(province.code);
      const districts = (
        Array.isArray(provinceDetail) ? provinceDetail : []
      ).map(normalizeDistrict);
      const district = findLocationByCodeOrName(districts, districtValue);

      if (district) {
        districtName = district.name;

        const districtDetail = await getWardsService(district.code);
        const wards = (
          Array.isArray(districtDetail?.wards)
            ? districtDetail.wards
            : district.wards || []
        ).map(normalizeWard);
        const ward = findLocationByCodeOrName(wards, wardValue);

        if (ward) {
          wardName = ward.name;
        }
      }
    }
  } catch (error) {
    console.error("Không thể chuyển mã địa chỉ sang tên:", error);
  }

  return (
    [
      address.addressDetail || address.detail,
      wardName,
      districtName,
      provinceName,
    ]
      .filter(Boolean)
      .join(", ") || "Chưa cập nhật"
  );
};

const normalizeOrders = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  return [];
};

const normalizeWallet = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getOrderTotal = (order) =>
  order.total_price || order.totalPrice || order.final_total || order.total || 0;

const getOrderId = (order) => {
  const rawId = order.order_code || order.code || order._id || order.id || "";
  return rawId ? `#${String(rawId).slice(-8).toUpperCase()}` : "#--------";
};

const buildProfileForm = (profile = {}) => {
  const primaryAddress = getPrimaryAddress(profile);
  const { provinceValue, districtValue, wardValue } =
    getAddressLocationValues(primaryAddress);

  return {
    fullName: profile.fullName || profile.name || "",
    email: profile.email || "",
    birthday: formatDateInput(profile.birthday || profile.dateOfBirth),
    sex: profile.sex || profile.gender || "",
    avatar_url: getAvatarUrl(profile),
    addressFullName: primaryAddress?.fullName || profile.fullName || "",
    addressPhone:
      primaryAddress?.phone || profile.phone || profile.phoneNumber || "",
    addressDetail: primaryAddress?.addressDetail || primaryAddress?.detail || "",
    provinceCode: provinceValue,
    districtCode: districtValue,
    wardCode: wardValue,
  };
};

const Profile = () => {
  useDocumentTitle("Thông tin cá nhân");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm());
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notice, setNotice] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState(null);

  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await userApi.getMe();
      return res.data;
    },
  });

  const avatarUrl = getAvatarUrl(userProfile);
  const avatarError = Boolean(avatarUrl && failedAvatarUrl === avatarUrl);

  const ordersQuery = useQuery({
    queryKey: ["profile-orders-summary"],
    queryFn: async () => {
      const res = await orderApi.getOrdersByUser();
      return normalizeOrders(res);
    },
    enabled: Boolean(userProfile),
    retry: false,
  });

  const walletQuery = useQuery({
    queryKey: ["profile-voucher-wallet"],
    queryFn: async () => {
      const res = await voucherApi.getUserWallet();
      return normalizeWallet(res);
    },
    enabled: Boolean(userProfile),
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => userApi.updateProfile(payload),
    onSuccess: (res) => {
      const updatedProfile = res.data;
      queryClient.setQueryData(["profile"], updatedProfile);
      setUser(updatedProfile);
      setNotice({
        type: "success",
        text: "Cập nhật thông tin thành công.",
      });
      setIsEditOpen(false);
    },
    onError: (error) => {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Không thể cập nhật thông tin. Vui lòng thử lại.",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (payload) => userApi.updatePassword(payload),
    onSuccess: () => {
      setNotice({
        type: "success",
        text: "Cập nhật mật khẩu thành công.",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordOpen(false);
    },
    onError: (error) => {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      });
    },
  });

  const orders = useMemo(() => ordersQuery.data || [], [ordersQuery.data]);
  const walletItems = useMemo(() => walletQuery.data || [], [walletQuery.data]);
  const primaryAddress = getPrimaryAddress(userProfile);

  useEffect(() => {
    let isActive = true;

    const resolveAddress = async () => {
      await Promise.resolve();
      if (!primaryAddress) {
        if (isActive) setResolvedAddress("Chưa cập nhật");
        return;
      }

      const addressText = await resolveAddressText(primaryAddress);
      if (isActive) {
        setResolvedAddress(addressText);
      }
    };

    resolveAddress();

    return () => {
      isActive = false;
    };
  }, [primaryAddress]);

  const displayAddress = resolvedAddress || formatAddress(primaryAddress);

  const orderStats = useMemo(() => {
    return ["pending", "shipping", "delivered", "cancelled"].map((status) => {
      const meta = STATUS_META[status];
      return {
        status,
        label: meta.label,
        count: orders.filter((order) => order.status === status).length,
        Icon: meta.icon,
      };
    });
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
  }, [orders]);

  const walletStats = useMemo(() => {
    const usableCount = walletItems.filter(
      (item) => item.status === "CLAIMED"
    ).length;
    const usedCount = walletItems.filter(
      (item) => item.status === "USED"
    ).length;
    return {
      total: walletItems.length,
      usable: usableCount,
      used: usedCount,
    };
  }, [walletItems]);

  const menuItems = [
    {
      id: "profile",
      label: "Thông tin cá nhân",
      description: "Hồ sơ tài khoản",
      icon: User,
    },
    {
      id: "orders",
      label: "Đơn hàng của tôi",
      description: "Theo dõi mua hàng",
      icon: Package,
    },
    {
      id: "coupons",
      label: "Ví voucher",
      description: "Mã đang sở hữu",
      icon: WalletCards,
    },
    {
      id: "favorites",
      label: "Yêu thích",
      description: "Sản phẩm đã lưu",
      icon: Heart,
    },
    {
      id: "password",
      label: "Đổi mật khẩu",
      description: "Bảo mật tài khoản",
      icon: KeyRound,
    },
  ];

  const openEditModal = () => {
    setProfileForm(buildProfileForm(userProfile));
    setNotice(null);
    setIsEditOpen(true);
  };

  const handleProfileFormChange = useCallback((field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handlePasswordFormChange = useCallback((field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleCancelPasswordChange = useCallback(() => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, []);

  const handleAvatarFileSelect = useCallback(async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({
        type: "error",
        text: "Vui lòng chọn tệp hình ảnh.",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const imageUrl = await uploadImageService(file);
      setProfileForm((current) => ({
        ...current,
        avatar_url: imageUrl,
      }));
    } catch (error) {
      console.error("Không thể tải ảnh đại diện:", error);
      setNotice({
        type: "error",
        text: "Không thể tải ảnh đại diện. Vui lòng thử lại.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const handleSubmitProfile = (event) => {
    event.preventDefault();
    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();

    if (!fullName || !email) {
      setNotice({
        type: "error",
        text: "Vui lòng nhập họ tên và email.",
      });
      return;
    }

    const hasAddressInput = [
      profileForm.addressPhone,
      profileForm.addressDetail,
      profileForm.provinceCode,
      profileForm.districtCode,
      profileForm.wardCode,
    ].some((value) => value.trim());

    if (
      hasAddressInput &&
      !/^[0-9]{9,11}$/.test(profileForm.addressPhone.trim())
    ) {
      setNotice({
        type: "error",
        text: "Số điện thoại giao hàng phải có từ 9 đến 11 chữ số.",
      });
      return;
    }

    const payload = {
      fullName,
      email,
      birthday: profileForm.birthday || undefined,
      sex: profileForm.sex || undefined,
      avatar_url: profileForm.avatar_url.trim() || undefined,
    };

    if (hasAddressInput) {
      payload.addresses = [
        {
          fullName: profileForm.addressFullName.trim() || fullName,
          phone: profileForm.addressPhone.trim(),
          addressDetail: profileForm.addressDetail.trim(),
          provinceCode: profileForm.provinceCode.trim(),
          districtCode: profileForm.districtCode.trim(),
          wardCode: profileForm.wardCode.trim(),
          isDefault: true,
        },
      ];
    }

    updateProfileMutation.mutate(payload);
  };

  const handleSubmitPassword = (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setNotice({
        type: "error",
        text: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setNotice({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({
        type: "error",
        text: "Mật khẩu xác nhận không khớp.",
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (profileLoading) {
    return (
      <div
        className="min-h-[60vh] bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center p-6"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-7 w-7 animate-spin mb-3" aria-hidden="true" />
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Đang tải thông tin tài khoản...
        </p>
      </div>
    );
  }

  if (profileError || !userProfile) {
    return (
      <div className="min-h-[60vh] bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Không thể tải hồ sơ
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Vui lòng đăng nhập lại để xem thông tin tài khoản của bạn.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="min-h-[48px] px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Notice banner */}
        <div aria-live="polite" aria-atomic="true">
          {notice && (
            <div
              role="alert"
              className={`mb-6 p-4 border flex items-center justify-between text-xs font-medium ${
                notice.type === "error"
                  ? "border-[var(--color-danger)] text-[var(--color-danger)] bg-[var(--color-surface)]"
                  : "border-[var(--color-text)] text-[var(--color-text)] bg-[var(--color-surface)]"
              }`}
            >
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Đóng thông báo"
                className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-6">
            <div className="flex items-center gap-3.5 pb-5 border-b border-[var(--color-border)]">
              <div className="w-12 h-12 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center overflow-hidden shrink-0 font-display text-lg font-semibold">
                {avatarUrl && avatarUrl !== DEFAULT_AVATAR && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={getUserName(userProfile)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                  />
                ) : (
                  <span>{getInitial(userProfile)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold truncate">
                  {getUserName(userProfile)}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {getUserEmail(userProfile)}
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1" aria-label="Menu tài khoản">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <Link
                    key={item.id}
                    to={`/profile?tab=${item.id}`}
                    className={`flex items-center gap-3 px-3.5 py-3 min-h-[48px] border transition-colors ${
                      isActive
                        ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]"
                        : "border-transparent hover:border-[var(--color-border)] text-[var(--color-text)]"
                    }`}
                  >
                    <Icon size={17} aria-hidden="true" className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-[0.12em] font-medium">
                        {item.label}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isActive
                            ? "opacity-80"
                            : "text-[var(--color-text-muted)]"
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Area */}
          <main className="lg:col-span-9 space-y-6">
            {activeTab === "profile" && (
              <>
                {/* Identity Hero Card */}
                <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center overflow-hidden shrink-0 font-display text-2xl font-semibold">
                      {avatarUrl &&
                      avatarUrl !== DEFAULT_AVATAR &&
                      !avatarError ? (
                        <img
                          src={avatarUrl}
                          alt={getUserName(userProfile)}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={() => setFailedAvatarUrl(avatarUrl)}
                        />
                      ) : (
                        <span>{getInitial(userProfile)}</span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <span className="atelier-eyebrow block">
                        Hồ sơ cá nhân
                      </span>
                      <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight uppercase">
                        {getUserName(userProfile)}
                      </h1>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                        <ShieldCheck size={14} aria-hidden="true" />
                        <span>
                          Vai trò:{" "}
                          {userProfile.role === "user"
                            ? "Khách hàng"
                            : "Quản trị viên"}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Edit3 size={15} aria-hidden="true" />
                      <span>Chỉnh sửa hồ sơ</span>
                    </button>
                  </div>
                </section>

                {/* Info & Quick Links */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
                    <div className="border-b border-[var(--color-border)] pb-4">
                      <h2 className="font-display text-xl font-semibold">
                        Thông tin liên hệ & giao nhận
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Dữ liệu đồng bộ với sổ địa chỉ mặc định của bạn.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <InfoRow
                        icon={Mail}
                        label="Email"
                        value={getUserEmail(userProfile)}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Số điện thoại"
                        value={getPhone(userProfile)}
                      />
                      <InfoRow
                        icon={CalendarDays}
                        label="Ngày sinh"
                        value={formatDate(
                          userProfile.birthday || userProfile.dateOfBirth
                        )}
                      />
                      <InfoRow
                        icon={User}
                        label="Giới tính"
                        value={getGenderLabel(
                          userProfile.sex || userProfile.gender
                        )}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Địa chỉ giao hàng mặc định"
                        value={displayAddress}
                      />
                    </div>
                  </article>

                  <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between space-y-5">
                    <div className="border-b border-[var(--color-border)] pb-4 flex items-start justify-between">
                      <div>
                        <h2 className="font-display text-xl font-semibold">
                          Voucher & danh mục lưu
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Truy cập nhanh ví ưu đãi và danh sách yêu thích.
                        </p>
                      </div>
                      <Ticket
                        size={20}
                        className="text-[var(--color-text-muted)]"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                      <Link
                        to="/profile?tab=coupons"
                        className="flex items-center justify-between gap-4 p-4 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text)] transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                            <WalletCards size={18} aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.12em] font-semibold">
                              Ví voucher của tôi
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              {walletQuery.isLoading
                                ? "Đang tải số voucher..."
                                : walletQuery.error
                                ? "Không tải được ví voucher"
                                : `${walletStats.usable} voucher khả dụng`}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>

                      <Link
                        to="/profile?tab=favorites"
                        className="flex items-center justify-between gap-4 p-4 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text)] transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                            <Heart size={18} aria-hidden="true" />
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-[0.12em] font-semibold">
                              Sản phẩm yêu thích
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              Xem các thiết kế đã lưu
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                </section>

                {/* Order Stats */}
                <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                    <div>
                      <h2 className="font-display text-xl font-semibold">
                        Tổng quan đơn hàng
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Thống kê từ lịch sử đặt hàng của tài khoản.
                      </p>
                    </div>
                    <Link
                      to="/profile?tab=orders"
                      className="text-xs uppercase tracking-[0.14em] underline underline-offset-4 min-h-[44px] inline-flex items-center"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  {ordersQuery.error ? (
                    <div className="text-xs text-[var(--color-text-muted)] py-4">
                      Không tải được dữ liệu đơn hàng.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {orderStats.map((stat) => (
                        <Link
                          key={stat.status}
                          to={`/profile?tab=orders&status=${stat.status}`}
                          className="p-4 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-text)] transition-colors flex flex-col justify-between gap-2"
                        >
                          <stat.Icon
                            size={18}
                            className="text-[var(--color-text-muted)]"
                            aria-hidden="true"
                          />
                          <div className="text-2xl font-mono font-semibold">
                            {stat.count}
                          </div>
                          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                            {stat.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                {/* Recent Orders */}
                <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                    <div>
                      <h2 className="font-display text-xl font-semibold">
                        Đơn hàng gần đây
                      </h2>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Các đơn hàng mới nhất của bạn.
                      </p>
                    </div>
                    <Link
                      to="/profile?tab=orders"
                      className="text-xs uppercase tracking-[0.14em] underline underline-offset-4 min-h-[44px] inline-flex items-center"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  {ordersQuery.isLoading ? (
                    <div className="text-xs text-[var(--color-text-muted)] py-6">
                      Đang tải đơn hàng...
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="text-xs text-[var(--color-text-muted)] py-6">
                      Bạn chưa có đơn hàng nào.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {recentOrders.map((order) => {
                        const meta =
                          STATUS_META[order.status] || STATUS_META.pending;
                        return (
                          <Link
                            key={order._id || order.id}
                            to="/profile?tab=orders"
                            className="py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-[var(--color-bg)] px-2 -mx-2 transition-colors text-xs"
                          >
                            <strong className="font-mono text-sm">
                              {getOrderId(order)}
                            </strong>
                            <span className="text-[var(--color-text-muted)] font-mono">
                              {formatDateTime(order.createdAt)}
                            </span>
                            <span className="px-2.5 py-0.5 border border-[var(--color-border)] uppercase tracking-wider text-[11px]">
                              {meta.label}
                            </span>
                            <strong className="font-mono text-sm">
                              {formatCurrency(getOrderTotal(order))}
                            </strong>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeTab === "orders" && (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
                <Order isDashboard={true} />
              </div>
            )}

            {activeTab === "coupons" && (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
                <MyCoupons isDashboard={true} />
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
                <Favorites isDashboard={true} />
              </div>
            )}

            {activeTab === "password" && (
              <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
                <div className="border-b border-[var(--color-border)] pb-4 mb-6">
                  <span className="atelier-eyebrow block mb-1">
                    Bảo mật tài khoản
                  </span>
                  <h2 className="font-display text-2xl font-semibold">
                    Đổi mật khẩu
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Sử dụng biểu mẫu bên dưới để cập nhật mật khẩu đăng nhập.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitPassword}
                  className="max-w-md space-y-5"
                >
                  <div>
                    <label
                      htmlFor="profile-current-password"
                      className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
                    >
                      Mật khẩu hiện tại
                    </label>
                    <input
                      id="profile-current-password"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        handlePasswordFormChange(
                          "currentPassword",
                          event.target.value
                        )
                      }
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-new-password"
                      className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
                    >
                      Mật khẩu mới
                    </label>
                    <input
                      id="profile-new-password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        handlePasswordFormChange(
                          "newPassword",
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-confirm-password"
                      className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-2"
                    >
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      id="profile-confirm-password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        handlePasswordFormChange(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      className="min-h-[48px] px-6 py-2.5 border border-[var(--color-border)] text-xs uppercase tracking-[0.16em] font-medium hover:border-[var(--color-text)] transition-colors cursor-pointer"
                    >
                      Đặt lại
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword ||
                        updatePasswordMutation.isPending
                      }
                      className="min-h-[48px] px-6 py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                    >
                      {updatePasswordMutation.isPending
                        ? "Đang lưu..."
                        : "Đổi mật khẩu"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>

      {isEditOpen && (
        <ProfileEditModal
          form={profileForm}
          isSaving={updateProfileMutation.isPending}
          isUploadingAvatar={isUploadingAvatar}
          onChange={handleProfileFormChange}
          onAvatarFileSelect={handleAvatarFileSelect}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleSubmitProfile}
        />
      )}

      {isPasswordOpen && (
        <PasswordModal
          form={passwordForm}
          isSaving={updatePasswordMutation.isPending}
          onChange={handlePasswordFormChange}
          onClose={() => setIsPasswordOpen(false)}
          onSubmit={handleSubmitPassword}
        />
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3.5 text-xs">
    <span className="w-8 h-8 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center shrink-0 text-[var(--color-text-muted)]">
      {React.createElement(icon, { size: 15 })}
    </span>
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-sm font-medium text-[var(--color-text)] mt-0.5 break-words">
        {value || "Chưa cập nhật"}
      </div>
    </div>
  </div>
);

const ProfileEditModal = ({
  form,
  isSaving,
  isUploadingAvatar,
  onChange,
  onAvatarFileSelect,
  onClose,
  onSubmit,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="profile-edit-modal-title"
  >
    <div className="w-full max-w-2xl bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] max-h-[90vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div>
          <h2
            id="profile-edit-modal-title"
            className="font-display text-xl font-semibold"
          >
            Chỉnh sửa thông tin cá nhân
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Cập nhật thông tin hồ sơ và địa chỉ giao hàng mặc định.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ chỉnh sửa"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="edit-fullName"
              className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
            >
              Họ và tên
            </label>
            <input
              id="edit-fullName"
              type="text"
              value={form.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
            />
          </div>

          <div>
            <label
              htmlFor="edit-email"
              className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
            >
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
            />
          </div>

          <div>
            <label
              htmlFor="edit-birthday"
              className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
            >
              Ngày sinh
            </label>
            <input
              id="edit-birthday"
              type="date"
              value={form.birthday}
              onChange={(event) => onChange("birthday", event.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
            />
          </div>

          <div>
            <label
              htmlFor="edit-sex"
              className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
            >
              Giới tính
            </label>
            <select
              id="edit-sex"
              value={form.sex}
              onChange={(event) => onChange("sex", event.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
            >
              <option value="">Chưa cập nhật</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <span className="block text-[11px] uppercase tracking-[0.14em] font-medium">
              Ảnh đại diện
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-[var(--color-border)] bg-[var(--color-bg)]">
              <div className="w-14 h-14 border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center overflow-hidden shrink-0">
                {form.avatar_url ? (
                  <img
                    src={form.avatar_url}
                    alt="Ảnh đại diện"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={22} />
                )}
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 border border-[var(--color-text)] text-xs uppercase tracking-[0.14em] font-medium cursor-pointer hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      onAvatarFileSelect(event.target.files?.[0])
                    }
                  />
                  {isUploadingAvatar ? "Đang tải ảnh..." : "Tải ảnh từ máy"}
                </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(event) =>
                    onChange("avatar_url", event.target.value)
                  }
                  placeholder="Hoặc dán URL ảnh đại diện"
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-5">
          <h3 className="font-display text-lg font-semibold mb-4">
            Địa chỉ giao hàng mặc định
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-addressFullName"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
              >
                Người nhận
              </label>
              <input
                id="edit-addressFullName"
                type="text"
                value={form.addressFullName}
                onChange={(event) =>
                  onChange("addressFullName", event.target.value)
                }
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
              />
            </div>

            <div>
              <label
                htmlFor="edit-addressPhone"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
              >
                Số điện thoại nhận hàng
              </label>
              <input
                id="edit-addressPhone"
                type="tel"
                value={form.addressPhone}
                onChange={(event) =>
                  onChange("addressPhone", event.target.value)
                }
                placeholder="0901234567"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="edit-addressDetail"
                className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
              >
                Số nhà / tên đường
              </label>
              <input
                id="edit-addressDetail"
                type="text"
                value={form.addressDetail}
                onChange={(event) =>
                  onChange("addressDetail", event.target.value)
                }
                className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
              />
            </div>

            <ProfileAddressSelects
              provinceValue={form.provinceCode}
              districtValue={form.districtCode}
              wardValue={form.wardCode}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 border border-[var(--color-border)] text-xs uppercase tracking-[0.14em] font-medium hover:border-[var(--color-text)] transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="min-h-[44px] px-6 py-2.5 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ProfileAddressSelects = ({
  provinceValue,
  districtValue,
  wardValue,
  onChange,
}) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [loadingProvince, setLoadingProvince] = useState(true);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);
  const [hydratedKey, setHydratedKey] = useState("");

  const loadDistricts = useCallback(async (nextProvinceCode) => {
    if (!nextProvinceCode) return [];

    setLoadingDistrict(true);
    try {
      const data = await getDistrictsService(nextProvinceCode);
      const districtsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.districts)
        ? data.districts
        : [];
      const apiDistricts = districtsArray.map(normalizeDistrict);

      if (apiDistricts.length > 0) return apiDistricts;
    } catch (error) {
      console.error("Không thể tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistrict(false);
    }

    return [];
  }, []);

  const loadWards = useCallback(async (nextDistrictCode) => {
    if (!nextDistrictCode) return [];

    setLoadingWard(true);
    try {
      const data = await getWardsService(nextDistrictCode);
      const wardsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.wards)
        ? data.wards
        : [];
      const apiWards = wardsArray.map(normalizeWard);

      if (apiWards.length > 0) return apiWards;
    } catch (error) {
      console.error("Không thể tải danh sách phường/xã:", error);
    } finally {
      setLoadingWard(false);
    }

    return [];
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadProvinces = async () => {
      await Promise.resolve();
      try {
        const apiProvinces = await getProvincesService();
        const provinceSource = Array.isArray(apiProvinces) ? apiProvinces : [];
        if (isMounted) {
          setProvinces(provinceSource.map(normalizeProvince));
        }
      } catch (error) {
        console.error("Không thể tải danh sách tỉnh/thành phố:", error);
        if (isMounted) setProvinces([]);
      } finally {
        if (isMounted) setLoadingProvince(false);
      }
    };

    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const nextHydratedKey = `${provinceValue || ""}|${districtValue || ""}|${
      wardValue || ""
    }`;
    if (!provinces.length || hydratedKey === nextHydratedKey) return;

    const hydrateAddress = async () => {
      await Promise.resolve();
      const province = findLocationByCodeOrName(
        provinces,
        provinceValue,
        (item) => item.displayName || item.name
      );

      if (!province) {
        setHydratedKey(nextHydratedKey);
        return;
      }

      setProvinceCode(province.code);
      onChange("provinceCode", province.displayName || province.name);

      const nextDistricts = await loadDistricts(province.code);
      setDistricts(nextDistricts);

      const district = findLocationByCodeOrName(nextDistricts, districtValue);
      if (!district) {
        setDistrictCode("");
        setWardCode("");
        setWards([]);
        setHydratedKey(nextHydratedKey);
        return;
      }

      setDistrictCode(district.code);
      onChange("districtCode", district.name);

      const nextWards = await loadWards(district.code);
      setWards(nextWards);

      const ward = findLocationByCodeOrName(nextWards, wardValue);
      if (ward) {
        setWardCode(ward.code);
        onChange("wardCode", ward.name);
      } else {
        setWardCode("");
      }

      setHydratedKey(nextHydratedKey);
    };

    hydrateAddress();
  }, [
    districtValue,
    hydratedKey,
    loadDistricts,
    loadWards,
    onChange,
    provinceValue,
    provinces,
    wardValue,
  ]);

  const handleProvinceChange = async (event) => {
    const nextProvinceCode = event.target.value;
    const province = provinces.find((item) => item.code === nextProvinceCode);

    setProvinceCode(nextProvinceCode);
    setDistrictCode("");
    setWardCode("");
    setDistricts([]);
    setWards([]);
    onChange(
      "provinceCode",
      province ? province.displayName || province.name : ""
    );
    onChange("districtCode", "");
    onChange("wardCode", "");
    setHydratedKey("");

    const nextDistricts = await loadDistricts(nextProvinceCode);
    setDistricts(nextDistricts);
  };

  const handleDistrictChange = async (event) => {
    const nextDistrictCode = event.target.value;
    const district = districts.find((item) => item.code === nextDistrictCode);

    setDistrictCode(nextDistrictCode);
    setWardCode("");
    setWards([]);
    onChange("districtCode", district ? district.name : "");
    onChange("wardCode", "");
    setHydratedKey("");

    const nextWards = await loadWards(nextDistrictCode);
    setWards(nextWards);
  };

  const handleWardChange = (event) => {
    const nextWardCode = event.target.value;
    const ward = wards.find((item) => item.code === nextWardCode);

    setWardCode(nextWardCode);
    onChange("wardCode", ward ? ward.name : "");
    setHydratedKey("");
  };

  return (
    <>
      <div>
        <label
          htmlFor="edit-province"
          className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
        >
          Tỉnh / Thành phố
        </label>
        <select
          id="edit-province"
          value={provinceCode}
          onChange={handleProvinceChange}
          disabled={loadingProvince}
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
        >
          <option value="">
            {loadingProvince
              ? "Đang tải tỉnh/thành phố..."
              : "Chọn tỉnh/thành phố"}
          </option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="edit-district"
          className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
        >
          Quận / Huyện
        </label>
        <select
          id="edit-district"
          value={districtCode}
          onChange={handleDistrictChange}
          disabled={!provinceCode || loadingDistrict}
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
        >
          <option value="">
            {loadingDistrict ? "Đang tải quận/huyện..." : "Chọn quận/huyện"}
          </option>
          {districts.map((district) => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="edit-ward"
          className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
        >
          Phường / Xã
        </label>
        <select
          id="edit-ward"
          value={wardCode}
          onChange={handleWardChange}
          disabled={!districtCode || loadingWard}
          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
        >
          <option value="">
            {loadingWard ? "Đang tải phường/xã..." : "Chọn phường/xã"}
          </option>
          {wards.map((ward) => (
            <option key={ward.code} value={ward.code}>
              {ward.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

const PasswordModal = ({ form, isSaving, onChange, onClose, onSubmit }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="password-modal-title"
  >
    <div className="w-full max-w-md bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div>
          <h2
            id="password-modal-title"
            className="font-display text-xl font-semibold"
          >
            Đổi mật khẩu
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="modal-current-pw"
            className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
          >
            Mật khẩu hiện tại
          </label>
          <input
            id="modal-current-pw"
            type="password"
            value={form.currentPassword}
            onChange={(event) =>
              onChange("currentPassword", event.target.value)
            }
            autoComplete="current-password"
            placeholder="Nhập mật khẩu hiện tại"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
          />
        </div>
        <div>
          <label
            htmlFor="modal-new-pw"
            className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
          >
            Mật khẩu mới
          </label>
          <input
            id="modal-new-pw"
            type="password"
            value={form.newPassword}
            onChange={(event) => onChange("newPassword", event.target.value)}
            autoComplete="new-password"
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
          />
        </div>
        <div>
          <label
            htmlFor="modal-confirm-pw"
            className="block text-[11px] uppercase tracking-[0.14em] font-medium mb-1.5"
          >
            Nhập lại mật khẩu mới
          </label>
          <input
            id="modal-confirm-pw"
            type="password"
            value={form.confirmPassword}
            onChange={(event) =>
              onChange("confirmPassword", event.target.value)
            }
            autoComplete="new-password"
            placeholder="Xác nhận mật khẩu mới"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-text)]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 border border-[var(--color-border)] text-xs uppercase tracking-[0.14em]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={
              !form.currentPassword ||
              !form.newPassword ||
              !form.confirmPassword ||
              isSaving
            }
            className="min-h-[44px] px-6 py-2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] disabled:opacity-40"
          >
            {isSaving ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Profile;
