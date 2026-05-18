import api from "./api";

export const uploadImageApi = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post("/upload", formData, {
    skipAuth: true, // 👈 tự xử lý trong interceptor
  });

  return res.data;
};