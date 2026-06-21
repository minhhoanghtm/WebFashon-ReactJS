import { ghnClient } from "../../providers/ghn.provider.js";

class ShippingService {
  async getProvinces() {
    const response = await ghnClient.get("/master-data/province");
    const provinces = response.data.data || [];
    return provinces.filter(p => {
      const name = p.ProvinceName || "";
      return !name.toLowerCase().includes("test") &&
             !name.toLowerCase().includes("alert") &&
             !name.endsWith("02") &&
             p.ProvinceID !== 2002 &&
             p.ProvinceID !== 298;
    });
  }

  async getDistricts(provinceId) {
    const response = await ghnClient.post("/master-data/district", {
      province_id: Number(provinceId),
    });
    return response.data.data;
  }

  async getWards(districtId) {
    const response = await ghnClient.post("/master-data/ward", {
      district_id: Number(districtId),
    });
    return response.data.data;
  }

  async calculateFee({
    from_district_id,
    districtId,
    wardCode,
    weight,
    serviceTypeId,
  }) {
    const DEFAULT_SHIPPING_FEE = Number(process.env.DEFAULT_SHIPPING_FEE) || 30000;

    try {
      const response = await ghnClient.post(
        "v2/shipping-order/fee",
        {
          service_type_id: Number(serviceTypeId || 2), // 1: Giao hàng nhanh, 2: Giao hàng tiết kiệm
          from_district_id: Number(from_district_id || 1489), // ID quận/huyện của địa chỉ lấy hàng (mặc định là quận Hoàn Kiếm, Hà Nội: 1489)
          to_district_id: Number(districtId), // ID quận/huyện của địa chỉ nhận hàng
          to_ward_code: String(wardCode), // Mã phường/xã của địa chỉ nhận hàng
          weight: Number(weight || 500), // Trọng lượng của đơn hàng (tính bằng gram)
        },
        {
          headers: {
            ShopId: Number(process.env.GHN_SHOP_ID),
          },
        },
      );
      return response.data.data;
    } catch (error) {
      console.error(
        "⚠️ [Shipping] GHN API lỗi, sử dụng phí ship mặc định:",
        error.message,
      );
      return {
        total: DEFAULT_SHIPPING_FEE,
        service_fee: DEFAULT_SHIPPING_FEE,
        insurance_fee: 0,
        is_fallback: true,
      };
    }
  }
}

export default new ShippingService();
