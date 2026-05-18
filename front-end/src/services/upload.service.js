import { uploadImageApi } from "@/api/uploadApi";

export const uploadImageService = async (file) => {
  const res = await uploadImageApi(file);
  return res.url;
};