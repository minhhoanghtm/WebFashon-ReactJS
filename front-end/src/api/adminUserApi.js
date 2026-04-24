const USER_STORAGE_KEY = "admin_user_management_data";
const USER_SEED_VERSION_KEY = "admin_user_seed_version";
const USER_SEED_VERSION = "v1";
const USER_SEED_URL = "/mock/admin-users.json";

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

export const initializeAdminUserApi = async () => {
  const currentVersion = localStorage.getItem(USER_SEED_VERSION_KEY);

  if (!localStorage.getItem(USER_STORAGE_KEY) || currentVersion !== USER_SEED_VERSION) {
    const response = await fetch(USER_SEED_URL);

    if (!response.ok) {
      throw new Error("Không thể tải dữ liệu tài khoản.");
    }

    const seedData = await response.json();
    writeStorage(USER_STORAGE_KEY, seedData);
    localStorage.setItem(USER_SEED_VERSION_KEY, USER_SEED_VERSION);
  }
};

const getStoredUsers = () => readStorage(USER_STORAGE_KEY, []);

export const getAllUsersApi = async () =>
  simulateFetch(() => ({
    ok: true,
    status: 200,
    json: async () =>
      getStoredUsers().sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
      ),
  }));

export const addUserApi = async (payload) =>
  simulateFetch(() => {
    const users = getStoredUsers();

    if (users.some((item) => item.userName === payload.userName)) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ message: "Tên đăng nhập đã tồn tại." }),
      };
    }

    const now = new Date().toISOString();
    const newUser = {
      ...payload,
      _id: `user-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    writeStorage(USER_STORAGE_KEY, [newUser, ...users]);

    return {
      ok: true,
      status: 201,
      json: async () => newUser,
    };
  });

export const updateUserApi = async (id, payload) =>
  simulateFetch(() => {
    const users = getStoredUsers();
    const currentUser = users.find((item) => item._id === id);

    if (!currentUser) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Không tìm thấy tài khoản." }),
      };
    }

    if (users.some((item) => item._id !== id && item.userName === payload.userName)) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ message: "Tên đăng nhập đã tồn tại." }),
      };
    }

    const updatedUser = {
      ...currentUser,
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const nextUsers = users.map((item) => (item._id === id ? updatedUser : item));
    writeStorage(USER_STORAGE_KEY, nextUsers);

    return {
      ok: true,
      status: 200,
      json: async () => updatedUser,
    };
  });

export const deleteUserApi = async (id) =>
  simulateFetch(() => {
    const users = getStoredUsers();
    const currentUser = users.find((item) => item._id === id);

    if (!currentUser) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Không tìm thấy tài khoản." }),
      };
    }

    writeStorage(
      USER_STORAGE_KEY,
      users.filter((item) => item._id !== id)
    );

    return {
      ok: true,
      status: 200,
      json: async () => currentUser,
    };
  });
