// src/modules/orders/order.service.js
import orderFacade from "./order.facade.js";

/**
 * Service layer for order operations used by test scenarios and other parts of the app.
 * It simply forwards calls to the OrderFacade which contains the core command logic.
 */
export const createOrder = async (userId, orderData) => {
  return await orderFacade.createOrder(userId, orderData);
};

// Export the facade as default for compatibility with any existing imports.
export default orderFacade;
