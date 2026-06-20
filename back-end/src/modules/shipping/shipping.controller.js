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

  async calculateFee(req, res, next) {
    try {
      const result = await shippingService.calculateFee(req.body);

      return res.status(200).json({
        success: true,
        message: "Tính phí vận chuyển thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ShippingController();