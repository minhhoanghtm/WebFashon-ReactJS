import axiosClient from "./axiosClient";

//lay tinh/thanh
export const getProvincesApi = () => {
    return axiosClient.get("/shipping/provinces");
};

//lay quan/huyen theo tinh/thanh
export const getDistrictsApi = (provinceCode) => {
    return axiosClient.get(`/shipping/districts?provinceId=${provinceCode}`);
};

//lay phuong/xa theo quan/huyen
export const getWardsApi = (districtCode) => {
    return axiosClient.get(`/shipping/wards?districtId=${districtCode}`);
};