import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import privacyApi from "@/api/privacyApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const unwrap = (response) => response?.data?.data || response?.data || response;

export default function DataRequests() {
  useDocumentTitle("Yêu cầu dữ liệu cá nhân — 404STUDIO");
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const loadRequests = () => privacyApi.getDataRequests().then((response) => setRequests(unwrap(response) || [])).catch(() => {});
  useEffect(() => { loadRequests(); }, []);

  const requirePassword = () => {
    if (!currentPassword) { toast.error("Nhập mật khẩu hiện tại để xác thực lại."); return false; }
    return true;
  };
  const download = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "du-lieu-ca-nhan.json"; a.click(); URL.revokeObjectURL(url);
  };
  const exportData = async () => {
    if (!requirePassword()) return;
    try { setLoading(true); download(unwrap(await privacyApi.exportPersonalData(currentPassword))); toast.success("Đã xuất dữ liệu JSON."); setCurrentPassword(""); loadRequests(); }
    catch (error) { toast.error(error?.response?.data?.message || "Không thể xuất dữ liệu."); }
    finally { setLoading(false); }
  };
  const request = async (type) => {
    if (!requirePassword()) return;
    if (type === "ERASURE" && !window.confirm("Tài khoản sẽ bị ẩn danh hóa và đăng xuất. Tiếp tục?")) return;
    try {
      setLoading(true); await privacyApi.submitDataRequest({ type, currentPassword, reason });
      toast.success(type === "ERASURE" ? "Tài khoản đã được ẩn danh hóa." : "Yêu cầu đã được ghi nhận và áp dụng.");
      setCurrentPassword(""); setReason(""); loadRequests();
      if (type === "ERASURE") navigate("/");
    } catch (error) { toast.error(error?.response?.data?.message || "Không thể xử lý yêu cầu."); }
    finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-[#FBF9F5] px-4 py-12 text-[#05251C]"><section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm sm:p-10">
    <Link to="/profile" className="text-sm underline">← Tài khoản</Link><h1 className="mt-5 text-3xl font-bold">Yêu cầu dữ liệu cá nhân</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Mật khẩu hiện tại là bước xác thực lại trước các thao tác nhạy cảm. Đơn hàng cần lưu cho nghĩa vụ kế toán chỉ được ẩn danh hóa, không xóa hoàn toàn.</p>
    <label className="mt-6 block text-sm font-medium">Mật khẩu hiện tại<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2 w-full border p-3" autoComplete="current-password" /></label>
    <label className="mt-4 block text-sm font-medium">Lý do (không bắt buộc)<textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="mt-2 w-full border p-3" /></label>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><button disabled={loading} onClick={exportData} className="border border-[#05251C] px-4 py-3 text-sm font-semibold">Xuất dữ liệu JSON</button><button disabled={loading} onClick={() => request("RESTRICT")} className="border border-[#05251C] px-4 py-3 text-sm font-semibold">Hạn chế xử lý</button><button disabled={loading} onClick={() => request("OBJECT")} className="border border-[#05251C] px-4 py-3 text-sm font-semibold">Phản đối xử lý</button><button disabled={loading} onClick={() => request("ERASURE")} className="border border-red-700 px-4 py-3 text-sm font-semibold text-red-700">Ẩn danh hóa tài khoản</button></div>
    <h2 className="mt-10 text-lg font-bold">Lịch sử yêu cầu</h2><ul className="mt-3 space-y-2 text-sm">{requests.map((item) => <li key={item._id} className="border p-3">{item.type} · {item.status} · {new Date(item.requested_at).toLocaleString("vi-VN")}</li>)}{!requests.length && <li>Chưa có yêu cầu.</li>}</ul>
  </section></main>;
}
