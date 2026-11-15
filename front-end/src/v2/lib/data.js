import api from "@/api/axiosClient";

export const unwrap = (value) => value?.data?.data ?? value?.data ?? value ?? [];
export const money = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n || 0));
export const imageOf = (item) => item?.thumbnail || item?.image || item?.images?.[0]?.url || item?.images?.[0] || "/default-avatar.svg";
export const labelOf = (item) => item?.name || item?.title || item?.code || "Chưa có tên";
export async function fetchList(path, fallback = []) { try { const result = unwrap(await api.get(path)); return Array.isArray(result) ? result : (result?.items || result?.products || fallback); } catch { return fallback; } }
export async function fetchOne(path, fallback = null) { try { return unwrap(await api.get(path)) || fallback; } catch { return fallback; } }
export const post = (path, body) => api.post(path, body);
