const PRODUCT_STORAGE_KEY = "staff_product_management_data";
const CATEGORY_STORAGE_KEY = "staff_product_category_data";
const SEED_VERSION_KEY = "staff_product_seed_version";
const SEED_VERSION = "v2";
const SEED_URL = "/mock/product-management.json";

const createSlug = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const fetchSeedData = async () => {
  const response = await fetch(SEED_URL);

  if (!response.ok) {
    throw new Error("Khong the tai file fake api.");
  }

  return response.json();
};

const simulateFetch = async (callback, init = {}) => {
  await new Promise((resolve) => setTimeout(resolve, init.delay ?? 250));
  return callback();
};

export const initializeProductManagementApi = async () => {
  const currentSeedVersion = localStorage.getItem(SEED_VERSION_KEY);

  if (
    !localStorage.getItem(PRODUCT_STORAGE_KEY) ||
    !localStorage.getItem(CATEGORY_STORAGE_KEY) ||
    currentSeedVersion !== SEED_VERSION
  ) {
    const seedData = await fetchSeedData();
    writeStorage(PRODUCT_STORAGE_KEY, seedData.products || []);
    writeStorage(CATEGORY_STORAGE_KEY, seedData.categories || []);
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }
};

const getStoredProducts = () => readStorage(PRODUCT_STORAGE_KEY, []);

const getStoredCategories = () => readStorage(CATEGORY_STORAGE_KEY, []);

export const getAllProductApi = async () =>
  simulateFetch(() => {
    const products = getStoredProducts().sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );

    return {
      ok: true,
      status: 200,
      json: async () => products,
    };
  });

export const getAllCategoryApi = async () =>
  simulateFetch(() => ({
    ok: true,
    status: 200,
    json: async () => getStoredCategories(),
  }));

export const addProductApi = async (payload) =>
  simulateFetch(() => {
    const products = getStoredProducts();
    const now = new Date().toISOString();
    const slug = createSlug(payload.name);

    if (products.some((item) => item.slug === slug)) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ message: "Slug san pham da ton tai." }),
      };
    }

    const newProduct = {
      ...payload,
      _id: `prod-${Date.now()}`,
      slug,
      createdAt: now,
      updatedAt: now,
    };

    writeStorage(PRODUCT_STORAGE_KEY, [...products, newProduct]);

    return {
      ok: true,
      status: 201,
      json: async () => newProduct,
    };
  });

export const updateProductApi = async (id, payload) =>
  simulateFetch(() => {
    const products = getStoredProducts();
    const currentProduct = products.find((item) => item._id === id);

    if (!currentProduct) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Khong tim thay san pham." }),
      };
    }

    const slug = createSlug(payload.name);
    const duplicatedSlug = products.some(
      (item) => item._id !== id && item.slug === slug
    );

    if (duplicatedSlug) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ message: "Slug san pham da ton tai." }),
      };
    }

    const updatedProduct = {
      ...currentProduct,
      ...payload,
      slug,
      updatedAt: new Date().toISOString(),
    };

    const nextProducts = products.map((item) =>
      item._id === id ? updatedProduct : item
    );

    writeStorage(PRODUCT_STORAGE_KEY, nextProducts);

    return {
      ok: true,
      status: 200,
      json: async () => updatedProduct,
    };
  });

export const deleteProductApi = async (id) =>
  simulateFetch(() => {
    const products = getStoredProducts();
    const currentProduct = products.find((item) => item._id === id);

    if (!currentProduct) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Khong tim thay san pham." }),
      };
    }

    const nextProducts = products.filter((item) => item._id !== id);
    writeStorage(PRODUCT_STORAGE_KEY, nextProducts);

    return {
      ok: true,
      status: 200,
      json: async () => currentProduct,
    };
  });
