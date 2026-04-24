import api from "./api"

export const loginApi = (data) => {
    return api.post("/auth/signIn", data);
}

export const registerApi = (data) => {
    return api.post("/auth/signUp", data);
}