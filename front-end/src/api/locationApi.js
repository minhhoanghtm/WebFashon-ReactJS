import axios from "axios";

//lay tinh/thanh
export const getProvincesApi = () => {
    return axios.get("https://provinces.open-api.vn/api/p/")
};

//lay quan/huyen theo tinh/thanh
export const getDistrictsApi = (provinceCode) => {
    return axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
};

//lay phuong/xa theo quan/huyen
export const getWardsApi = (districtCode) => {
    return axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`)
};