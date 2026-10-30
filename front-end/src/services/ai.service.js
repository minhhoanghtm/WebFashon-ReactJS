import { aiApi } from "@/api/ai.api";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const semanticSearchAiService = async (params) => {
  return unwrap(await aiApi.semanticSearch(params));
};

export const sendAiChatService = async (payload) => {
  return unwrap(await aiApi.chat(payload));
};

export const syncAiEmbeddingsService = async (payload) => {
  return unwrap(await aiApi.syncEmbeddings(payload));
};

export const getAiHealthService = async () => {
  return unwrap(await aiApi.getHealth());
};
