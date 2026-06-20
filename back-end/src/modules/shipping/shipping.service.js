import { ghnClient } from "../../providers/ghn.provider.js";

class ShippingService {
  async getProvinces() {
    const response = await ghnClient.get("/master-data/province");
    return response.data.data;
  }

  async calculateFee({
    from_district_id,
    districtId,
    wardCode,
    weight,
    serviceTypeId,
  }) {
    const reponse = await ghnClient.post(
      "v2/shipping-order/fee",
      {
        service_type_id: serviceTypeId, // 1: Giao hàng nhanh, 2: Giao hàng tiết kiệm
        from_district_id: from_district_id, // ID quận/huyện của địa chỉ lấy hàng (mặc định là quận Hoàn Kiếm, Hà Nội)
        to_district_id: districtId, // ID quận/huyện của địa chỉ nhận hàng
        to_ward_code: wardCode, // Mã phường/xã của địa chỉ nhận hàng
        weight: weight, // Trọng lượng của đơn hàng (tính bằng gram)
      },
      {
        headers: {
          ShopId: Number(process.env.GHN_SHOP_ID),
        },
      },
    );
    return reponse.data.data;
  }
}

export default new ShippingService();
