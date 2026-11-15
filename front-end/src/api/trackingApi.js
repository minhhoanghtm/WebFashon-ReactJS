import axiosClient from "./axiosClient";

export const trackingApi = {
  trackEvent: (eventData) => axiosClient.post("/events", eventData),
  trackBatchEvents: (events) => axiosClient.post("/events", { events }),
  updateConsent: (consent) => axiosClient.post("/events/consent", { consent }),
  getSearchHistory: () => axiosClient.get("/search/history"),
  clearSearchHistory: () => axiosClient.delete("/search/history"),
  clearMyData: () => axiosClient.delete("/events/me"),
  getAnalyticsOverview: (params) => axiosClient.get("/events/analytics/overview", { params }),
  getFunnelAnalytics: (params) => axiosClient.get("/events/analytics/funnel", { params }),
  getLiveSessions: (params) => axiosClient.get("/events/presence/live", { params }),
  getSessionTimeline: (sessionId) => axiosClient.get(`/events/presence/session/${sessionId}`),
  getActivityAnalytics: (params) => axiosClient.get("/events/analytics/activity", { params }),
};

export default trackingApi;
