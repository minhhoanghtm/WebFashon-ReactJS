import orderService from "../../../orders/order.service.js";

export class SearchOrderTool {
  name = "search_order";

  async execute({ userId }) {
    if (!userId) return [];
    return orderService.getOrdersByUser?.(userId) || [];
  }
}
