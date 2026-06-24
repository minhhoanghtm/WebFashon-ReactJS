import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Gift,
  KeyRound,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
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
import { findFallbackProvince, vietnamAddressData } from "../Checkout/VietnamAddressData";
import "./profile.css";

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
  code: String(province.code),
  name: province.name,
  displayName: removeAdministrativePrefix(province.name),
  districts: province.districts || [],
});

const normalizeDistrict = (district) => ({
  code: String(district.code),
  name: district.name,
  wards: district.wards || [],
});

const normalizeWard = (ward) => ({
  code: String(ward.code),
  name: ward.name,
});

const findLocationByCodeOrName = (items, value, getDisplayName = (item) => item.name) => {
  if (!value) return null;
  const textValue = String(value);
  const normalizedValue = normalizeSearchText(textValue);

  return (
    items.find((item) => String(item.code) === textValue) ||
    items.find((item) => {
      const normalizedName = normalizeSearchText(item.name);
      const normalizedDisplayName = normalizeSearchText(getDisplayName(item));
      return normalizedName === normalizedValue || normalizedDisplayName === normalizedValue;
    }) ||
    null
  );
};

const STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    icon: Clock3,
    className: "is-pending",
  },
  confirmed: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    className: "is-confirmed",
  },
  shipping: {
    label: "Đang giao",
    icon: Truck,
    className: "is-shipping",
  },
  delivered: {
    label: "Hoàn thành",
    icon: CheckCircle2,
    className: "is-delivered",
  },
  cancelled: {
    label: "Đã hủy",
    icon: XCircle,
    className: "is-cancelled",
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
  if (profile.address && typeof profile.address === "object") return [profile.address];
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
      safeAddress.district || safeAddress.districtName || safeAddress.districtCode || "",
    wardValue: safeAddress.ward || safeAddress.wardName || safeAddress.wardCode || "",
  };
};

const formatAddress = (address) => {
  if (!address) return "Chưa cập nhật";

  const { provinceValue, districtValue, wardValue } = getAddressLocationValues(address);
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

  const { provinceValue, districtValue, wardValue } = getAddressLocationValues(address);
  let provinceName = provinceValue;
  let districtName = districtValue;
  let wardName = wardValue;

  try {
    const apiProvinces = await getProvincesService();
    const provinceSource =
      Array.isArray(apiProvinces) && apiProvinces.length > 0
        ? apiProvinces
        : vietnamAddressData;
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
        Array.isArray(provinceDetail?.districts)
          ? provinceDetail.districts
          : findFallbackProvince(province.code)?.districts || []
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

  return [
    address.addressDetail || address.detail,
    wardName,
    districtName,
    provinceName,
  ]
    .filter(Boolean)
    .join(", ") || "Chưa cập nhật";
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
    addressPhone: primaryAddress?.phone || profile.phone || profile.phoneNumber || "",
    addressDetail: primaryAddress?.addressDetail || primaryAddress?.detail || "",
    provinceCode: provinceValue,
    districtCode: districtValue,
    wardCode: wardValue,
  };
};

const Profile = () => {
  const navigate = useNavigate();
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
  const [resolvedAddress, setResolvedAddress] = useState("Chưa cập nhật");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [userProfile?.avatar_url, userProfile?.avatar, userProfile?.image]);

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
      const fallbackAddress = formatAddress(primaryAddress);
      setResolvedAddress(fallbackAddress);

      if (!primaryAddress) {
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
    const usableCount = walletItems.filter((item) => item.status === "CLAIMED").length;
    const usedCount = walletItems.filter((item) => item.status === "USED").length;
    return {
      total: walletItems.length,
      usable: usableCount,
      used: usedCount,
    };
  }, [walletItems]);

  const menuItems = [
    {
      label: "Thông tin cá nhân",
      description: "Hồ sơ tài khoản",
      to: "/profile",
      icon: User,
      active: true,
    },
    {
      label: "Đơn hàng của tôi",
      description: "Theo dõi mua hàng",
      to: "/orders",
      icon: Package,
    },
    {
      label: "Ví voucher",
      description: "Mã đang sở hữu",
      to: "/my-coupons",
      icon: WalletCards,
    },
    {
      label: "Săn voucher",
      description: "Ưu đãi đang mở",
      to: "/vouchers",
      icon: Sparkles,
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

    if (hasAddressInput && !/^[0-9]{9,11}$/.test(profileForm.addressPhone.trim())) {
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
      <div className="profile-page">
        <div className="profile-shell">
          <div className="profile-loading">
            <span className="profile-spinner" />
            <p>Đang tải thông tin tài khoản...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !userProfile) {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <div className="profile-empty">
            <h2>Không thể tải hồ sơ</h2>
            <p>Vui lòng đăng nhập lại để xem thông tin tài khoản.</p>
            <button type="button" onClick={() => navigate("/login")}>
              Đến trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(userProfile);

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {notice && (
          <div className={`profile-notice profile-notice--${notice.type}`}>
            {notice.text}
            <button type="button" onClick={() => setNotice(null)} aria-label="Đóng">
              <X size={16} />
            </button>
          </div>
        )}

        <aside className="profile-sidebar">
          <div className="profile-sidebar__user">
            <div className="profile-sidebar__avatar">
              {avatarUrl && avatarUrl !== DEFAULT_AVATAR && !avatarError ? (
                <img 
                  src={avatarUrl} 
                  alt={getUserName(userProfile)} 
                  onError={() => setAvatarError(true)} 
                />
              ) : (
                <span>{getInitial(userProfile)}</span>
              )}
            </div>
            <div>
              <h2>{getUserName(userProfile)}</h2>
              <p>{getUserEmail(userProfile)}</p>
            </div>
          </div>

          <nav className="profile-menu" aria-label="Menu tài khoản">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const className = item.active
                ? "profile-menu__item is-active"
                : "profile-menu__item";

              return (
                <Link key={item.label} to={item.to} className={className}>
                  <span className="profile-menu__icon">
                    <Icon size={19} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              className="profile-menu__item"
              onClick={() => {
                setNotice(null);
                setIsPasswordOpen(true);
              }}
            >
              <span className="profile-menu__icon">
                <KeyRound size={19} />
              </span>
              <span>
                <strong>Đổi mật khẩu</strong>
                <small>Bảo mật tài khoản</small>
              </span>
            </button>
          </nav>
        </aside>

        <main className="profile-main">
          <section className="profile-hero">
            <div className="profile-hero__cover" aria-hidden="true" />
            <div className="profile-hero__body">
              <div className="profile-hero__identity">
                <div className="profile-hero__avatar">
                  {avatarUrl && !avatarError ? (
                    <img 
                      src={avatarUrl} 
                      alt={getUserName(userProfile)} 
                      onError={() => setAvatarError(true)} 
                    />
                  ) : (
                    <span>{getInitial(userProfile)}</span>
                  )}
                </div>
                <div>
                  <h1>{getUserName(userProfile)}</h1>
                  <span className="profile-role">
                    <ShieldCheck size={14} />
                    Vai trò: {userProfile.role || "user"}
                  </span>
                </div>
              </div>

              <div className="profile-hero__actions">
                <button type="button" onClick={openEditModal}>
                  <Edit3 size={18} />
                  Chỉnh sửa thông tin
                </button>
              </div>
            </div>
          </section>

          <section className="profile-grid profile-grid--two">
            <article className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h2>Thông tin cá nhân</h2>
                  <p>Dữ liệu lấy từ hồ sơ tài khoản hiện tại.</p>
                </div>
              </div>

              <div className="profile-info-list">
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={getUserEmail(userProfile)}
                />
                <InfoRow icon={Phone} label="Số điện thoại" value={getPhone(userProfile)} />
                <InfoRow
                  icon={CalendarDays}
                  label="Ngày sinh"
                  value={formatDate(userProfile.birthday || userProfile.dateOfBirth)}
                />
                <InfoRow
                  icon={User}
                  label="Giới tính"
                  value={getGenderLabel(userProfile.sex || userProfile.gender)}
                />
                <InfoRow
                  icon={MapPin}
                  label="Địa chỉ giao hàng"
                  value={resolvedAddress}
                />
              </div>
            </article>

            <article className="profile-card">
              <div className="profile-card__header">
                <div>
                  <h2>Voucher & ưu đãi</h2>
                  <p>Liên kết đến các trang voucher hiện có.</p>
                </div>
                <Ticket className="profile-card__title-icon" size={22} />
              </div>

              <div className="profile-action-list">
                <Link to="/my-coupons" className="profile-action-card">
                  <span className="profile-action-card__icon is-indigo">
                    <WalletCards size={24} />
                  </span>
                  <span>
                    <strong>Ví voucher của tôi</strong>
                    <small>
                      {walletQuery.isLoading
                        ? "Đang tải số voucher..."
                        : walletQuery.error
                          ? "Không tải được ví voucher"
                          : `${walletStats.usable} voucher có thể dùng`}
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </Link>

                <Link to="/vouchers" className="profile-action-card">
                  <span className="profile-action-card__icon is-rose">
                    <Gift size={24} />
                  </span>
                  <span>
                    <strong>Săn mã giảm giá</strong>
                    <small>Nhận thêm ưu đãi đang mở trên hệ thống</small>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </article>
          </section>

          <section className="profile-card">
            <div className="profile-card__header profile-card__header--row">
              <div>
                <h2>Tổng quan đơn hàng</h2>
                <p>Thống kê từ lịch sử đơn hàng thật của tài khoản.</p>
              </div>
              <Link to="/orders">Xem tất cả</Link>
            </div>

            {ordersQuery.error ? (
              <div className="profile-inline-state">
                Không tải được dữ liệu đơn hàng.
              </div>
            ) : (
              <div className="profile-order-stats">
                {orderStats.map((stat) => (
                  <Link key={stat.status} to="/orders" className="profile-stat">
                    <span>
                      <stat.Icon size={18} />
                    </span>
                    <strong>{stat.count}</strong>
                    <small>{stat.label}</small>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="profile-card">
            <div className="profile-card__header profile-card__header--row">
              <div>
                <h2>Hoạt động gần đây</h2>
                <p>Các đơn hàng mới nhất của bạn.</p>
              </div>
              <Link to="/orders">Xem tất cả</Link>
            </div>

            {ordersQuery.isLoading ? (
              <div className="profile-inline-state">Đang tải đơn hàng...</div>
            ) : recentOrders.length === 0 ? (
              <div className="profile-inline-state">Bạn chưa có đơn hàng nào.</div>
            ) : (
              <div className="profile-order-table" role="table">
                <div className="profile-order-table__head" role="row">
                  <span>Mã đơn</span>
                  <span>Ngày đặt</span>
                  <span>Trạng thái</span>
                  <span>Tổng tiền</span>
                </div>
                {recentOrders.map((order) => {
                  const meta = STATUS_META[order.status] || STATUS_META.pending;
                  return (
                    <Link
                      key={order._id || order.id}
                      to="/orders"
                      className="profile-order-table__row"
                      role="row"
                    >
                      <strong>{getOrderId(order)}</strong>
                      <span>{formatDateTime(order.createdAt)}</span>
                      <span className={`profile-status ${meta.className}`}>
                        {meta.label}
                      </span>
                      <strong>{formatCurrency(getOrderTotal(order))}</strong>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </main>
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
  <div className="profile-info-row">
    <span className="profile-info-row__icon">
      {React.createElement(icon, { size: 20 })}
    </span>
    <span>
      <small>{label}</small>
      <strong>{value || "Chưa cập nhật"}</strong>
    </span>
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
  <div className="profile-modal" role="dialog" aria-modal="true">
    <div className="profile-modal__panel profile-modal__panel--wide">
      <div className="profile-modal__header">
        <div>
          <h2>Chỉnh sửa thông tin</h2>
          <p>Cập nhật các trường đang được backend hỗ trợ.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="profile-form__grid">
          <label>
            <span>Họ và tên</span>
            <input
              type="text"
              value={form.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Ngày sinh</span>
            <input
              type="date"
              value={form.birthday}
              onChange={(event) => onChange("birthday", event.target.value)}
            />
          </label>
          <label>
            <span>Giới tính</span>
            <select
              value={form.sex}
              onChange={(event) => onChange("sex", event.target.value)}
            >
              <option value="">Chưa cập nhật</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </label>
          <div className="profile-avatar-upload profile-form__full">
            <span>Ảnh đại diện</span>
            <div className="profile-avatar-upload__body">
              <div className="profile-avatar-upload__preview">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Ảnh đại diện" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="profile-avatar-upload__content">
                <label className="profile-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => onAvatarFileSelect(event.target.files?.[0])}
                  />
                  {isUploadingAvatar ? "Đang tải ảnh..." : "Tải ảnh từ máy"}
                </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(event) => onChange("avatar_url", event.target.value)}
                  placeholder="Hoặc dán URL ảnh đại diện"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="profile-form__section">
          <h3>Địa chỉ giao hàng mặc định</h3>
        </div>

        <div className="profile-form__grid">
          <label>
            <span>Người nhận</span>
            <input
              type="text"
              value={form.addressFullName}
              onChange={(event) => onChange("addressFullName", event.target.value)}
            />
          </label>
          <label>
            <span>Số điện thoại nhận hàng</span>
            <input
              type="tel"
              value={form.addressPhone}
              onChange={(event) => onChange("addressPhone", event.target.value)}
              placeholder="0901234567"
            />
          </label>
          <label className="profile-form__full">
            <span>Số nhà / tên đường</span>
            <input
              type="text"
              value={form.addressDetail}
              onChange={(event) => onChange("addressDetail", event.target.value)}
            />
          </label>
          <ProfileAddressSelects
            provinceValue={form.provinceCode}
            districtValue={form.districtCode}
            wardValue={form.wardCode}
            onChange={onChange}
          />
        </div>

        <div className="profile-form__actions">
          <button type="button" className="profile-button secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="profile-button primary" disabled={isSaving}>
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
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);
  const [hydratedKey, setHydratedKey] = useState("");

  const loadDistricts = useCallback(async (nextProvinceCode) => {
    if (!nextProvinceCode) return [];

    setLoadingDistrict(true);
    try {
      const province = await getDistrictsService(nextProvinceCode);
      const apiDistricts = Array.isArray(province?.districts)
        ? province.districts.map(normalizeDistrict)
        : [];

      if (apiDistricts.length > 0) return apiDistricts;
    } catch (error) {
      console.error("Không thể tải danh sách quận/huyện:", error);
    } finally {
      setLoadingDistrict(false);
    }

    return (findFallbackProvince(nextProvinceCode)?.districts || []).map(
      normalizeDistrict
    );
  }, []);

  const loadWards = useCallback(
    async (nextDistrictCode, nextProvinceCode = provinceCode) => {
      if (!nextDistrictCode) return [];

      setLoadingWard(true);
      try {
        const district = await getWardsService(nextDistrictCode);
        const apiWards = Array.isArray(district?.wards)
          ? district.wards.map(normalizeWard)
          : [];

        if (apiWards.length > 0) return apiWards;
      } catch (error) {
        console.error("Không thể tải danh sách phường/xã:", error);
      } finally {
        setLoadingWard(false);
      }

      const fallbackDistrict = findFallbackProvince(nextProvinceCode)?.districts.find(
        (district) => district.code === String(nextDistrictCode)
      );

      return (fallbackDistrict?.wards || []).map(normalizeWard);
    },
    [provinceCode]
  );

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvince(true);
      try {
        const apiProvinces = await getProvincesService();
        const provinceSource =
          Array.isArray(apiProvinces) && apiProvinces.length > 0
            ? apiProvinces
            : vietnamAddressData;
        setProvinces(provinceSource.map(normalizeProvince));
      } catch (error) {
        console.error("Không thể tải danh sách tỉnh/thành phố:", error);
        setProvinces(vietnamAddressData.map(normalizeProvince));
      } finally {
        setLoadingProvince(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    const nextHydratedKey = `${provinceValue || ""}|${districtValue || ""}|${wardValue || ""}`;
    if (!provinces.length || hydratedKey === nextHydratedKey) return;

    const hydrateAddress = async () => {
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

      const nextWards = await loadWards(district.code, province.code);
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
    onChange("provinceCode", province ? province.displayName || province.name : "");
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
      <label>
        <span>Tỉnh / Thành phố</span>
        <select
          value={provinceCode}
          onChange={handleProvinceChange}
          disabled={loadingProvince}
        >
          <option value="">
            {loadingProvince ? "Đang tải tỉnh/thành phố..." : "Chọn tỉnh/thành phố"}
          </option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.displayName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Quận / Huyện</span>
        <select
          value={districtCode}
          onChange={handleDistrictChange}
          disabled={!provinceCode || loadingDistrict}
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
      </label>

      <label>
        <span>Phường / Xã</span>
        <select value={wardCode} onChange={handleWardChange} disabled={!districtCode || loadingWard}>
          <option value="">
            {loadingWard ? "Đang tải phường/xã..." : "Chọn phường/xã"}
          </option>
          {wards.map((ward) => (
            <option key={ward.code} value={ward.code}>
              {ward.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
};

const PasswordModal = ({ form, isSaving, onChange, onClose, onSubmit }) => (
  <div className="profile-modal" role="dialog" aria-modal="true">
    <div className="profile-modal__panel">
      <div className="profile-modal__header">
        <div>
          <h2>Đổi mật khẩu</h2>
          <p>Sử dụng API đổi mật khẩu hiện có của hệ thống.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <label>
          <span>Mật khẩu hiện tại</span>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(event) => onChange("currentPassword", event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          <span>Mật khẩu mới</span>
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => onChange("newPassword", event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          <span>Nhập lại mật khẩu mới</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <div className="profile-form__actions">
          <button type="button" className="profile-button secondary" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="profile-button primary" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default Profile;
