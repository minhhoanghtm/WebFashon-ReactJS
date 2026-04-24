import { loginApi, registerApi } from "@/api/authApi";

//login
export const login = async (data) => {
    const res = await loginApi(data);

    //xu ly logic
    const token = res.data.token;
    localStorage.setItem("token", token);
    return res.data;
};

//register
export const register = async (data) => {
    //xu ly logic
    const res = await registerApi(data);
    return res.data;
};

//logout
export const logout = () => {
    localStorage.removeItem("token");
};