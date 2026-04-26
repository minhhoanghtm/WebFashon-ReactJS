import {
  getAllProductApi,
  initializeProductManagementApi,
} from "./productManagementApi";
import {
  getUserProfileApi,
  initializeUserAccountApi,
} from "./userAccountApi";

const CART_STORAGE_KEY = "shopping_cart_data";
const CART_VERSION_KEY = "shopping_cart_version";
const CART_VERSION = "v1";

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

const buildCartState = (cart, cartItems) => {
  const normalizedItems = cartItems.map((item) => ({
    ...item,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
  }));

  const total_items = normalizedItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );
  const total_price = normalizedItems.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );

  return {
    cart: {
      ...(cart || {}),
      total_items,
      total_price,
      updatedAt: new Date().toISOString(),
    },
    cartItems: normalizedItems,
  };
};

const getStoredCartState = () =>
  readStorage(CART_STORAGE_KEY, {
    cart: null,
    cartItems: [],
  });

const enrichCartItems = (cartItems, products) =>
  cartItems.map((item) => ({
    ...item,
    product_id:
      products.find((product) => product._id === item.product_id) ||
      item.product_id ||
      null,
  }));

export const initializeCartApi = async () => {
  const currentVersion = localStorage.getItem(CART_VERSION_KEY);

  if (
    localStorage.getItem(CART_STORAGE_KEY) &&
    currentVersion === CART_VERSION
  ) {
    return;
  }

  await Promise.all([
    initializeUserAccountApi(),
    initializeProductManagementApi(),
  ]);

  const [profileResponse, productResponse] = await Promise.all([
    getUserProfileApi(),
    getAllProductApi(),
  ]);

  const profileData = await profileResponse.json();
  const productData = await productResponse.json();

  const seededItems = (productData || [])
    .filter((item) => item.is_active)
    .slice(0, 3)
    .map((item, index) => ({
      _id: `cart-item-${index + 1}`,
      cart_id: "cart-user-01",
      product_id: item._id,
      variant_id: index === 0 ? "default-black-l" : null,
      quantity: index === 0 ? 2 : 1,
      price: item.new_price,
    }));

  const now = new Date().toISOString();
  const initialState = buildCartState(
    {
      _id: "cart-user-01",
      user_id: profileData?._id || "user-profile-01",
      createdAt: now,
      updatedAt: now,
    },
    seededItems,
  );

  writeStorage(CART_STORAGE_KEY, initialState);
  localStorage.setItem(CART_VERSION_KEY, CART_VERSION);
};

export const getCartApi = async () =>
  simulateFetch(async () => {
    const storedState = getStoredCartState();
    const productResponse = await getAllProductApi();
    const products = await productResponse.json();
    const nextState = buildCartState(storedState.cart, storedState.cartItems);

    writeStorage(CART_STORAGE_KEY, nextState);

    return {
      ok: true,
      status: 200,
      json: async () => ({
        cart: nextState.cart,
        cartItems: enrichCartItems(nextState.cartItems, products),
      }),
    };
  });

export const updateCartItemApi = async (itemId, payload) =>
  simulateFetch(async () => {
    const storedState = getStoredCartState();
    const currentItem = storedState.cartItems.find((item) => item._id === itemId);

    if (!currentItem) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Khong tim thay san pham trong gio hang." }),
      };
    }

    const nextItems = storedState.cartItems.map((item) =>
      item._id === itemId
        ? {
            ...item,
            ...payload,
            quantity: Math.max(1, Number(payload.quantity ?? item.quantity)),
          }
        : item,
    );

    const nextState = buildCartState(storedState.cart, nextItems);
    writeStorage(CART_STORAGE_KEY, nextState);

    const productResponse = await getAllProductApi();
    const products = await productResponse.json();

    return {
      ok: true,
      status: 200,
      json: async () => ({
        cart: nextState.cart,
        cartItems: enrichCartItems(nextState.cartItems, products),
      }),
    };
  });

export const deleteCartItemApi = async (itemId) =>
  simulateFetch(async () => {
    const storedState = getStoredCartState();
    const currentItem = storedState.cartItems.find((item) => item._id === itemId);

    if (!currentItem) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "Khong tim thay san pham trong gio hang." }),
      };
    }

    const nextItems = storedState.cartItems.filter((item) => item._id !== itemId);
    const nextState = buildCartState(storedState.cart, nextItems);
    writeStorage(CART_STORAGE_KEY, nextState);

    const productResponse = await getAllProductApi();
    const products = await productResponse.json();

    return {
      ok: true,
      status: 200,
      json: async () => ({
        cart: nextState.cart,
        cartItems: enrichCartItems(nextState.cartItems, products),
      }),
    };
  });
