import axiosClient from "./axiosClient";

export const uploadImageApi = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await axiosClient.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res?.data ?? res;
};
