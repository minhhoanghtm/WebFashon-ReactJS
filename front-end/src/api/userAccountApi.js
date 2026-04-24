const USER_PROFILE_STORAGE_KEY = "user_account_profile_data";
const USER_PROFILE_VERSION_KEY = "user_account_profile_version";
const USER_PROFILE_VERSION = "v2";
const USER_PROFILE_URL = "/mock/user-account.json";

const USER_ORDER_STORAGE_KEY = "user_account_order_data";
const USER_ORDER_VERSION_KEY = "user_account_order_version";
const USER_ORDER_VERSION = "v2";
const USER_ORDER_URL = "/mock/user-orders.json";

const cloneData = (data) => JSON.parse(JSON.stringify(data));

const readStorage = (key, fallbackData) => {
  const localValue = localStorage.getItem(key);

  if (!localValue) {
    localStorage.setItem(key, JSON.stringify(fallbackData));
    return cloneData(fallbackData);
  }

  try {
    return JSON.parse(localValue);
  } catch {
    localStorage.setItem(key, JSON.stringify(fallbackData));
    return cloneData(fallbackData);
  }
};

const writeStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  return cloneData(data);
};

const simulateFetch = async (callback, delay = 220) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return callback();
};

const fetchSeed = async (url, fallbackMessage) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return response.json();
};

export const initializeUserAccountApi = async () => {
  const currentProfileVersion = localStorage.getItem(USER_PROFILE_VERSION_KEY);
  const currentOrderVersion = localStorage.getItem(USER_ORDER_VERSION_KEY);

  if (
    !localStorage.getItem(USER_PROFILE_STORAGE_KEY) ||
    currentProfileVersion !== USER_PROFILE_VERSION
  ) {
    const profileSeed = await fetchSeed(
      USER_PROFILE_URL,
      "Không thể tải thông tin tài khoản."
    );
    writeStorage(USER_PROFILE_STORAGE_KEY, profileSeed);
    localStorage.setItem(USER_PROFILE_VERSION_KEY, USER_PROFILE_VERSION);
  }

  if (
    !localStorage.getItem(USER_ORDER_STORAGE_KEY) ||
    currentOrderVersion !== USER_ORDER_VERSION
  ) {
    const orderSeed = await fetchSeed(
      USER_ORDER_URL,
      "Không thể tải lịch sử đơn hàng."
    );
    writeStorage(USER_ORDER_STORAGE_KEY, orderSeed);
    localStorage.setItem(USER_ORDER_VERSION_KEY, USER_ORDER_VERSION);
  }
};

const getStoredProfile = () => readStorage(USER_PROFILE_STORAGE_KEY, {});
const getStoredOrders = () =>
  readStorage(USER_ORDER_STORAGE_KEY, { orders: [], orderItems: [] });

export const getUserProfileApi = async () =>
  simulateFetch(() => ({
    ok: true,
    status: 200,
    json: async () => getStoredProfile(),
  }));

export const getUserOrdersApi = async () =>
  simulateFetch(() => ({
    ok: true,
    status: 200,
    json: async () => {
      const { orders, orderItems } = getStoredOrders();
      return { orders, orderItems };
    },
  }));

export const updateUserProfileApi = async (payload) =>
  simulateFetch(() => {
    const currentProfile = getStoredProfile();
    const updatedProfile = {
      ...currentProfile,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    writeStorage(USER_PROFILE_STORAGE_KEY, updatedProfile);

    return {
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    };
  });

export const updateUserPasswordApi = async (nextPassword) =>
  simulateFetch(() => {
    const currentProfile = getStoredProfile();
    const updatedProfile = {
      ...currentProfile,
      passWord: nextPassword,
      updatedAt: new Date().toISOString(),
    };

    writeStorage(USER_PROFILE_STORAGE_KEY, updatedProfile);

    return {
      ok: true,
      status: 200,
      json: async () => updatedProfile,
    };
  });
