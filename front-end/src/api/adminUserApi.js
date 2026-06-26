import api from "./api";

const normalizeAddress = (address = {}) => ({
  fullName: address.fullName || "",
  phone: address.phone || "",
  provinceCode: address.provinceCode || address.city || "",
  districtCode: address.districtCode || address.district || "",
  wardCode: address.wardCode || address.ward || "",
  addressDetail: address.addressDetail || address.detail || "",
  isDefault: address.isDefault || false,
});

const normalizeUser = (user = {}) => ({
  ...user,
  userName: user.userName || user.email || "",
  gender:
    user.gender ||
    (user.sex === "male"
      ? "male"
      : user.sex === "female"
        ? "female"
        : "other"),
  dateOfBirth: user.dateOfBirth || (user.birthday ? user.birthday.split("T")[0] : ""),
  addresses: Array.isArray(user.addresses)
    ? user.addresses.map(normalizeAddress)
    : user.address
      ? [normalizeAddress(Array.isArray(user.address) ? user.address[0] : user.address)]
      : [],
});

const normalizePayload = (payload = {}) => {
  const normalized = {
    email: payload.email || "",
    fullName: payload.fullName || "",
    sex: payload.gender === "other" ? undefined : payload.gender,
    birthday: payload.dateOfBirth || null,
    role: payload.role || "user",
    avatar_url: payload.avatar_url || "",
    status: payload.status,
    addresses: Array.isArray(payload.addresses)
      ? payload.addresses.map(normalizeAddress)
      : payload.address
        ? [normalizeAddress(payload.address)]
        : [],
  };

  if (payload.passWord) {
    normalized.passWord = payload.passWord;
  }

  return normalized;
};

const toFetchLikeResponse = (status, data, ok = status >= 200 && status < 300) => ({
  ok,
  status,
  json: async () => data,
});

const toErrorResponse = (error, fallbackMessage) => {
  const responseData = error?.response?.data || { message: fallbackMessage };
  const status = error?.response?.status || 500;
  return toFetchLikeResponse(status, responseData, false);
};

export const initializeAdminUserApi = async () => {
  return true;
};

export const getAllUsersApi = async () => {
  try {
    const res = await api.get("/user/admin/users");
    const users = Array.isArray(res.data?.data) ? res.data.data.map(normalizeUser) : [];
    return toFetchLikeResponse(res.status, users);
  } catch (error) {
    return toErrorResponse(error, "Không thể tải danh sách tài khoản.");
  }
};

export const addUserApi = async (payload) => {
  try {
    const res = await api.post("/user/admin/users", normalizePayload(payload));
    return toFetchLikeResponse(res.status, normalizeUser(res.data?.data));
  } catch (error) {
    return toErrorResponse(error, "Không thể tạo tài khoản.");
  }
};

export const updateUserApi = async (id, payload) => {
  try {
    const res = await api.put(`/user/admin/users/${id}`, normalizePayload(payload));
    return toFetchLikeResponse(res.status, normalizeUser(res.data?.data));
  } catch (error) {
    return toErrorResponse(error, "Không thể cập nhật tài khoản.");
  }
};

export const deleteUserApi = async (id) => {
  try {
    const res = await api.delete(`/user/admin/users/${id}`);
    return toFetchLikeResponse(res.status, normalizeUser(res.data?.data));
  } catch (error) {
    return toErrorResponse(error, "Không thể xóa tài khoản.");
  }
};
