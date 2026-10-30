import axiosClient from "./axiosClient";

export const authMeApi = () => {
  return axiosClient.get("/user/me");
};

export const updatePasswordApi = (data) => {
  return axiosClient.put("/user/updatePassword", data);
};

export const updateProfileApi = (data) => {
  return axiosClient.put("/user/updateProfile", data);
};
