import { loginApi, registerApi, resetPasswordApi, sendOTPApi, sendResetOTPApi, verifyOTPApi } from "@/api/authApi";

//login
export const loginService = async (data) => {
    const res = await loginApi(data);
    return res.data;
};

//register
export const registerService = async (data) => {
    //xu ly logic
    const res = await registerApi(data);
    return res.data;
};

//logout
export const logout = () => {
    localStorage.removeItem("accessToken");
};

export const sendOTPServive = async (data) => {
    const res = await sendOTPApi(data);
    return res.data;
}

export const sendResetOTPService = async (data) => {
    const res = await sendResetOTPApi(data);
    return res.data;
}

export const verifyOTPService = async (data) => {
    const res = await verifyOTPApi(data);
    return res.data;
}

export const resetPasswordService = async (data) => {
    const res = await resetPasswordApi(data);
    return res.data;
}
