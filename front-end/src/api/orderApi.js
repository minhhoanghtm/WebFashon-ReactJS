const ORDER_STORAGE_KEY = "backend_shape_order_data";

const cloneData = (data) => JSON.parse(JSON.stringify(data));

const readStorage = () => {
  const localValue = localStorage.getItem(ORDER_STORAGE_KEY);

  if (!localValue) {
    const fallbackData = { orders: [], orderItems: [] };
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fallbackData));
    return cloneData(fallbackData);
  }

  try {
    return JSON.parse(localValue);
  } catch {
    const fallbackData = { orders: [], orderItems: [] };
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(fallbackData));
    return cloneData(fallbackData);
  }
};

const writeStorage = (data) => {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(data));
  return cloneData(data);
};

const simulateFetch = async (callback, delay = 220) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return callback();
};

export const createOrderApi = async (payload) =>
  simulateFetch(() => {
    const storedData = readStorage();
    const now = new Date().toISOString();
    const order = {
      _id: `order-${Date.now()}`,
      status: "pending",
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    writeStorage({
      ...storedData,
      orders: [...storedData.orders, order],
    });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "Dat hang thanh cong",
        order,
      }),
    };
  });

export const createOrderItemApi = async (payload) =>
  simulateFetch(() => {
    const storedData = readStorage();
    const now = new Date().toISOString();
    const orderItem = {
      _id: `order-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    writeStorage({
      ...storedData,
      orderItems: [...storedData.orderItems, orderItem],
    });

    return {
      ok: true,
      status: 200,
      json: async () => ({
        message: "Them san pham vao don hang thanh cong",
        orderItem,
      }),
    };
  });
