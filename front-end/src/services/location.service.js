import { getDistrictsApi, getProvincesApi, getWardsApi } from "@/api/locationApi";

export const getProvincesService = async () => {
    try {
        const res = await getProvincesApi();
        return res.data;
    } catch (error) {
        console.error("Lỗi khi fetch tỉnh/thành:", error);
        return [];
    }
};

export const getDistrictsService = async (provinceCode) => {
    try {
        const res = await getDistrictsApi(provinceCode);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi fetch quận/huyện:", error);
        return [];
    }
};

export const getWardsService = async (districtCode) => {
    try {
        const res = await getWardsApi(districtCode);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi fetch phường/xã:", error);
        return [];
    }
};