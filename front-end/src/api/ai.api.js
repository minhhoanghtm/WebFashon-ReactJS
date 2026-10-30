import axiosClient from "./axiosClient";

export const aiApi = {
  semanticSearch: (params) => axiosClient.post("/ai/search", params),
  chat: (payload) => axiosClient.post("/ai/chat", payload),
  syncEmbeddings: (payload) => axiosClient.post("/ai/embeddings/sync", payload),
  getHealth: () => axiosClient.get("/ai/health"),
};

export default aiApi;
