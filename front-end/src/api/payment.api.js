import axiosClient from "./axiosClient";

export const paymentApi = {
  createVNPayPayment: (orderId) => {
    return axiosClient.post(`/payments/vnpay/create/${orderId}`);
  },
  createMomoPayment: (orderId) => {
    return axiosClient.post(`/payments/momo/create/${orderId}`);
  },
};
