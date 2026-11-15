import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import privacyApi from "@/api/privacyApi";

const owner = "[CẦN CHỦ WEBSITE ĐIỀN: tên pháp nhân/chủ thể kiểm soát dữ liệu, mã số doanh nghiệp, địa chỉ, email và số điện thoại tiếp nhận yêu cầu]";

export default function Privacy() {
  useDocumentTitle("Chính sách bảo vệ dữ liệu cá nhân — 404STUDIO");
  const [policy, setPolicy] = useState({ version: "…", effectiveDate: "…" });

  useEffect(() => {
    privacyApi.getPolicy().then((response) => {
      const data = response?.data?.data || response?.data || response;
      if (data?.version) setPolicy(data);
    }).catch(() => {});
  }, []);

  const sections = [
    ["Bên kiểm soát dữ liệu", owner],
    ["Dữ liệu được thu thập", "Tài khoản: họ tên, số điện thoại, email, ngày sinh, giới tính, mật khẩu (được băm ở máy chủ). Địa chỉ giao hàng: họ tên người nhận, số điện thoại, mã tỉnh/huyện/xã, địa chỉ chi tiết. Hệ thống còn lưu lựa chọn đồng ý, lịch sử tương tác/tracking khi được đồng ý, mã phiên/anonymous ID trong localStorage và nội dung hội thoại AI lưu cục bộ trên trình duyệt."],
    ["Mục đích", "Tạo và bảo vệ tài khoản; xác minh OTP; xử lý đơn hàng, thanh toán, giao hàng; hỗ trợ khách hàng; và chỉ khi bạn đồng ý, phân tích/cá nhân hóa. Marketing là tùy chọn."],
    ["Bên nhận dữ liệu", "MoMo hoặc VNPay khi bạn chọn thanh toán tương ứng; GHN khi dùng chức năng tính/giao hàng; Google khi bạn đăng nhập Google; và nhà cung cấp AI được cấu hình (OpenRouter, OpenAI hoặc Gemini) khi dùng chat/embedding AI. [CẦN CHỦ WEBSITE ĐIỀN: tên pháp nhân, quốc gia xử lý, hợp đồng/xử lý dữ liệu và danh sách nhà cung cấp đang thực tế bật ở production]."],
    ["Thời hạn lưu", "[CẦN CHỦ WEBSITE ĐIỀN: thời hạn cho tài khoản, đơn hàng/hóa đơn, log, dữ liệu tracking, bản sao lưu và tiêu chí xóa/ẩn danh]."],
    ["Rủi ro có thể phát sinh", "Truy cập trái phép, lộ lọt hoặc xử lý ngoài phạm vi do sự cố kỹ thuật hay bên nhận dữ liệu. [CẦN CHỦ WEBSITE ĐIỀN: biện pháp bảo mật, quy trình ứng phó sự cố và đầu mối thông báo]."],
    ["Quyền của chủ thể dữ liệu", "Bạn có thể yêu cầu được biết, đồng ý/rút lại đồng ý, xem, chỉnh sửa, xóa, hạn chế xử lý, cung cấp dữ liệu và khiếu nại theo pháp luật. Gửi yêu cầu qua: " + owner],
    ["Cách quản lý lựa chọn", <>Bạn có thể thay đổi cookie/tracking tại mục “Quyền riêng tư & Cookie” trên website. Với tài khoản hoặc yêu cầu xóa dữ liệu, liên hệ đầu mối nêu trên. Việc từ chối/rút lại có thể làm một số chức năng không hoạt động đầy đủ. Xem thêm <Link className="underline" to="/policy">Điều khoản và chính sách khác</Link>.</>],
  ];

  return <main className="min-h-screen bg-[#FBF9F5] px-4 py-12 text-[#05251C] sm:px-6 sm:py-20">
    <article className="mx-auto max-w-3xl rounded-3xl border border-[#05251C]/10 bg-white p-6 shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B716E]">Quyền riêng tư</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Chính sách bảo vệ dữ liệu cá nhân</h1>
      <p className="mt-4 text-sm leading-6 text-[#6B716E]">Phiên bản: {policy.version} · Ngày hiệu lực: {policy.effectiveDate}</p>
      <div className="mt-8 space-y-7">
        {sections.map(([title, content]) => <section key={title}><h2 className="text-lg font-bold">{title}</h2><div className="mt-2 text-sm leading-6 text-[#4B5563]">{content}</div></section>)}
      </div>
    </article>
  </main>;
}
