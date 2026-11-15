import axiosClient from "./axiosClient";
import { getAnonymousId, getAnonymousToken } from "../utils/anonymousId";

export const privacyApi = {
  getPolicy: () => axiosClient.get("/privacy/policy"),
  exportPersonalData: (currentPassword) => axiosClient.post("/privacy/data-export", { currentPassword }),
  submitDataRequest: ({ type, currentPassword, reason }) => axiosClient.post("/privacy/data-requests", { type, currentPassword, reason }),
  getDataRequests: () => axiosClient.get("/privacy/data-requests"),

  getConsent: (anonymousId) => {
    const anonId = anonymousId || getAnonymousId();
    return axiosClient.get("/privacy/consent", {
      params: anonId ? { anonymous_id: anonId } : {},
      headers: anonId ? { "x-anonymous-id": anonId } : {},
    });
  },

  updateConsent: ({ choice, categories, policyVersion, source = "banner" }) => {
    const anonymousId = getAnonymousId();
    const anonymousToken = getAnonymousToken ? getAnonymousToken() : null;

    return axiosClient.put("/privacy/consent", {
      choice,
      categories,
      policyVersion,
      source,
      anonymous_id: anonymousId,
      anonymous_token: anonymousToken,
    });
  },

  clearMyData: () => {
    const anonymousId = getAnonymousId();
    const anonymousToken = getAnonymousToken ? getAnonymousToken() : null;

    return axiosClient.delete("/events/me", {
      data: {
        anonymous_id: anonymousId,
        anonymous_token: anonymousToken,
      },
      headers: {
        ...(anonymousId && { "x-anonymous-id": anonymousId }),
        ...(anonymousToken && { "x-anonymous-token": anonymousToken }),
      },
    });
  },
};

export default privacyApi;
