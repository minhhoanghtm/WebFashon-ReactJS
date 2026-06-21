import shippingService from "./shipping.service.js";

class ShippingController {
  async getShippingFee(req, res, next) {
    try {
      const provinces = await shippingService.getProvinces();
      res.status(200).json({
        success: true,
        message: "Lấy danh sách tỉnh thành thành công",
        data: provinces,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDistricts(req, res, next) {
    try {
      const { provinceId } = req.query;
      if (!provinceId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu provinceId",
        });
      }
      const districts = await shippingService.getDistricts(provinceId);
      res.status(200).json({
        success: true,
        message: "Lấy danh sách quận huyện thành công",
        data: districts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWards(req, res, next) {
    try {
      const { districtId } = req.query;
      if (!districtId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu districtId",
        });
      }
      const wards = await shippingService.getWards(districtId);
      res.status(200).json({
        success: true,
        message: "Lấy danh sách phường xã thành công",
        data: wards,
      });
    } catch (error) {
      next(error);
    }
  }

  async calculateFee(req, res, next) {
    try {
      const result = await shippingService.calculateFee(req.body);

      return res.status(200).json({
        success: true,
        message: "Tính phí vận chuyển thành công",
        data: result,
      });
    } catch (error) {
      console.warn("GHN calculateFee failed, returning fallback default fee:", error.response?.data || error.message);
      return res.status(200).json({
        success: true,
        message: "Tính phí vận chuyển mặc định (kết nối vận chuyển bận)",
        data: {
          total: 30000,
          service_fee: 30000,
          insurance_fee: 0,
          pick_station_fee: 0,
          coupon_value: 0,
          cod_fee: 0,
        },
      });
    }
  }
}

export default new ShippingController();