import orderFacade from "../../../orders/order.facade.js";

export class SearchOrderTool {
  name = "search_order";

  async execute({ userId }) {
    if (!userId) return [];
    return orderFacade.getOrdersByUser?.(userId) || [];
  }
}
