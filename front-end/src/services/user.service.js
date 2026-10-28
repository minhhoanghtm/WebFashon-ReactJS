import { authMeApi, updatePasswordApi, updateProfileApi } from "@/api/userApi";

export const authMeService = async () => {
  const res = await authMeApi();
  return res?.data ?? res;
};

export const updatePasswordService = async (data) => {
  const res = await updatePasswordApi(data);
  return res?.data ?? res;
};

export const updateProfileService = async (data) => {
  const res = await updateProfileApi(data);
  return res?.data ?? res;
};
