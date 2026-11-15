import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const items = [
  ["refreshToken", "Cookie HttpOnly", "Duy trì/đổi phiên đăng nhập", "Website", "14 ngày"],
  ["accessToken, refreshToken", "localStorage", "Token phiên mà client hiện lưu", "Website", "Đến khi đăng xuất/xóa; không thấy TTL trong source"],
  ["webfashion_privacy_consent_v1, webfashion_tracking_consent", "localStorage", "Lựa chọn cookie/analytics và version chính sách", "Website", "Đến khi người dùng xóa storage hoặc version đổi"],
  ["webfashion_anonymous_id, webfashion_anonymous_token", "localStorage", "Định danh khách ẩn danh/ủy quyền thao tác privacy", "Website", "Không thấy TTL trong source"],
  ["webfashion_session_id, webfashion_session_last_active", "localStorage", "Phiên analytics; cửa sổ không hoạt động 30 phút", "Website", "Được thay khi quá 30 phút không hoạt động"],
  ["webfashion_first_touch", "localStorage", "Nguồn truy cập đầu tiên/UTM", "Website", "Không thấy TTL trong source"],
  ["webfashion_tab_id, webfashion_session_touch", "sessionStorage", "Định danh tab và nguồn truy cập của phiên", "Website", "Đóng tab"],
  ["customer_ai_chat_history_{userKey}, customer_ai_chat_metadata_{userKey}", "localStorage", "Lịch sử/ngữ cảnh chat AI", "Website", "Đến khi người dùng xóa chat/storage"],
  ["customer_support_unread_count_{userKey}", "localStorage", "Số tin nhắn hỗ trợ chưa đọc", "Website", "Không thấy TTL trong source"],
  ["customer_chat_draft, customer_chat_auto_open", "sessionStorage", "Bản nháp/trạng thái mở chat hỗ trợ", "Website", "Đóng tab hoặc bị xóa"],
  ["webfashion_theme, theme", "localStorage", "Giao diện sáng/tối", "Website", "Không thấy TTL trong source"],
  ["guest_cart_items, rememberedEmail", "localStorage", "Giỏ khách và lựa chọn ghi nhớ email", "Website", "Không thấy TTL trong source"],
  ["pending_add_to_cart, checkout_items_seed, blockedMessage, 404_announcement_dismissed", "sessionStorage", "Tiếp tục thao tác, checkout, thông báo phiên", "Website", "Đóng tab"],
];

export default function Cookies() {
  useDocumentTitle("Chính sách Cookie — 404STUDIO");
  return <main className="min-h-screen bg-[#FBF9F5] px-4 py-12 text-[#05251C] sm:py-20"><article className="mx-auto max-w-6xl rounded-3xl border border-[#05251C]/10 bg-white p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#6B716E]">Chính sách Cookie</p><h1 className="mt-3 text-3xl font-bold">Cookie và browser storage</h1><p className="mt-3 text-sm text-[#6B716E]">Phiên bản: 2026-11-07 · Ngày hiệu lực: [CẦN CHỦ WEBSITE ĐIỀN: ngày hiệu lực]. Danh sách dưới đây chỉ gồm mục có bằng chứng trong source hiện tại.</p><div className="mt-8 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b"><th className="p-3">Tên</th><th className="p-3">Loại</th><th className="p-3">Mục đích</th><th className="p-3">Bên đặt</th><th className="p-3">Thời hạn</th></tr></thead><tbody>{items.map((row) => <tr key={row[0]} className="border-b align-top">{row.map((cell) => <td key={cell} className="p-3 leading-5 text-slate-600">{cell}</td>)}</tr>)}</tbody></table></div><section className="mt-8 text-sm leading-6 text-slate-600"><h2 className="font-bold text-[#05251C]">SDK bên thứ ba</h2><p>Không tìm thấy mã tải/khởi tạo Google Analytics, Google Tag Manager hoặc Facebook Pixel trong source frontend. Chỉ có trường cấu hình ID trong CMS; chúng không tự chứng minh SDK đang chạy. Tracking hiện có gửi về API nội bộ `/events`.</p><p className="mt-3">Analytics và cá nhân hóa chỉ được cho phép sau lựa chọn hợp lệ. Bạn có thể đổi lựa chọn tại “Quyền riêng tư & Cookie” hoặc xem <Link to="/privacy" className="underline">Chính sách bảo vệ dữ liệu cá nhân</Link>.</p></section></article></main>;
}
