import axiosClient from "./axiosClient"

export const shippingApi = {
    calculateFee: (data) => {
        return axiosClient.post('/shipping/calculate-fee', data);
    }
}