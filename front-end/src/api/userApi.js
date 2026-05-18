import api from "./api";

export const authMeApi = () => {
    return api.get("/user/me");
}

export const updatePasswordApi = (data) => {
    return api.put("/user/updatePassword", data);
}

export const updateProfileApi = (data) => {
    return api.put("/user/updateProfile", data);
}