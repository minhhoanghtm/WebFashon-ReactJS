import { paymentOrderService } from "@/services/order.service";
import { toast } from "react-toastify";

export const handlePayment = async ({
  orderId,
  paymentMethod,
  navigate,
  setLoading,
}) => {
  try {
    setLoading && setLoading(true);

    const res = await paymentOrderService({
      orderId,
      payment_method: paymentMethod,
    });

    // 🟢 COD
    if (paymentMethod === "cod") {
      // alert("Đặt hàng thành công!");
      toast.success("Đặt hàng thành công!");
      navigate("/orders");
      return;
    }

    // 🔵 ONLINE
    if (res?.data?.paymentUrl) {
      window.location.href = res.data.paymentUrl;
      return;
    }

    throw new Error("Không có link thanh toán");

  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      "Lỗi khi thanh toán";

    toast.error(msg);
  } finally {
    setLoading && setLoading(false);
  }
};