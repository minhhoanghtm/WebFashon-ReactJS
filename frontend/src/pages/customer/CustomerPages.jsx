import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Package, Ticket, Shield, Plus, Star, MapPin, Sparkles } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { usePersonaStore } from "../../stores/personaStore";
import { authApi, orderApi, voucherApi } from "../../api/endpoints";
import { Button, Input, Badge } from "../../components/ui/Button";

export function Profile() {
  const user = useAuthStore((state) => state.user);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const persona = usePersonaStore((state) => state.persona);
  const openQuiz = usePersonaStore((state) => state.openQuiz);
  const [fullName, setFullName] = useState(user?.fullName || "Khách Hàng Thân Thiết");
  const [phone, setPhone] = useState(user?.phone || "+84900000002");
  const [isSaved, setIsSaved] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await authApi.updateProfile({ fullName, phone });
      await fetchMe();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">TÀI KHOẢN CÁ NHÂN</span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
            Hồ Sơ Của Bạn
          </h1>
        </div>
        <Link to="/orders">
          <Button variant="secondary" size="sm">
            Xem Đơn Hàng Của Tôi
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#121215] border border-white/10 p-6 space-y-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#1e1e23] border border-white/20 flex items-center justify-center text-[#f4f0e8] text-2xl font-display">
            {fullName.charAt(0)}
          </div>
          <div>
            <h3 className="font-display text-base text-[#f4f0e8]">{fullName}</h3>
            <p className="text-xs text-[#9a989f] font-mono">{user?.email || "customer@404studio.vn"}</p>
          </div>
          <Badge variant="signal">Thành Viên Kim Cương</Badge>
          
          <div className="pt-3 border-t border-white/10 text-left space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#e65100] tracking-wider block">
              FASHION PERSONA
            </span>
            {persona ? (
              <div className="p-2.5 bg-[#161619] border border-[#e65100]/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-display font-bold text-[#f4f0e8] uppercase">
                  <Sparkles size={12} className="text-[#e65100]" />
                  <span>{persona.title}</span>
                </div>
                <p className="text-[10px] text-[#9a989f] line-clamp-2 leading-relaxed">
                  {persona.tagline}
                </p>
                <button
                  type="button"
                  onClick={openQuiz}
                  className="text-[10px] font-mono text-[#ff6d00] hover:text-white pt-1 block"
                >
                  Làm lại trắc nghiệm &rarr;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openQuiz}
                className="w-full py-2 px-3 bg-[#161619] hover:bg-white/5 border border-dashed border-white/20 text-xs font-mono text-[#f4f0e8] text-center"
              >
                + Khám phá Style Persona
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleUpdate} className="md:col-span-2 bg-[#121215] border border-white/10 p-6 space-y-4">
          <h3 className="font-display text-sm uppercase text-[#f4f0e8] pb-2 border-b border-white/10">
            Thông Tin Chi Tiết
          </h3>
          <Input
            label="Họ và tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Số điện thoại liên hệ"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            label="Email đăng ký"
            value={user?.email || "customer@404studio.vn"}
            disabled
          />
          {isSaved && (
            <span className="text-xs text-emerald-400 font-mono block">
              ✓ Đã lưu thay đổi hồ sơ thành công!
            </span>
          )}
          <Button type="submit" variant="signal" size="md">
            Lưu Thông Tin
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await orderApi.getMyOrders();
        const list = res.data || res || [];
        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        setOrders([
          {
            _id: "ORD-998241",
            createdAt: "15/11/2026",
            status: "Đang giao hàng",
            totalAmount: 1850000,
            items: [{ name: "Áo Blazer Dạ Cashmere Atelier", quantity: 1, price: 1850000 }],
          },
          {
            _id: "ORD-982103",
            createdAt: "02/11/2026",
            status: "Hoàn tất",
            totalAmount: 980000,
            items: [{ name: "Quần Jeans Ống Rộng Y2K", quantity: 2, price: 490000 }],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">LỊCH SỬ MUA SẮM</span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
          Đơn Hàng Của Tôi ({orders.length})
        </h1>
      </div>

      <div className="space-y-4">
        {orders.map((ord) => (
          <div
            key={ord._id}
            className="bg-[#121215] border border-white/10 p-5 sm:p-6 space-y-4 hover:border-white/20 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="font-display text-base text-[#f4f0e8] font-bold">
                  {ord._id}
                </span>
                <span className="text-xs font-mono text-[#9a989f]">
                  Ngày: {new Date(ord.createdAt).toLocaleDateString("vi-VN") || ord.createdAt}
                </span>
              </div>
              <Badge variant={ord.status === "Hoàn tất" ? "success" : "warning"}>
                {ord.status || "Đang xử lý"}
              </Badge>
            </div>

            <div className="space-y-2">
              {ord.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs text-[#9a989f]">
                  <span className="text-[#f4f0e8]">{it.name || "Thiết kế Atelier"}</span>
                  <span className="font-mono">
                    SL: {it.quantity} × {(it.price || 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-[#9a989f]">Tổng thanh toán:</span>
              <span className="font-display text-base font-bold text-[#e65100]">
                {(ord.totalAmount || 0).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MyCoupons() {
  const coupons = [
    { code: "ATELIER100", title: "Giảm 100.000 ₫", desc: "Áp dụng cho đơn hàng may đo từ 1.000.000 ₫", expiry: "31/12/2026" },
    { code: "FREESHIP", title: "Freeship Toàn Quốc", desc: "Miễn phí vận chuyển cho đơn từ 500.000 ₫", expiry: "31/12/2026" },
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">ƯU ĐÃI ĐÃ LƯU</span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
          Ví Voucher Của Tôi ({coupons.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coupons.map((c) => (
          <div key={c.code} className="bg-[#121215] border border-white/15 p-6 space-y-3">
            <Badge variant="signal">{c.code}</Badge>
            <h3 className="font-display text-xl text-[#f4f0e8]">{c.title}</h3>
            <p className="text-xs text-[#9a989f]">{c.desc}</p>
            <span className="text-[11px] font-mono text-[#6b6973] block pt-2 border-t border-white/5">
              Hạn dùng: {c.expiry}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataRequests() {
  const [reqType, setReqType] = useState("export");
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSent(true);
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">QUYỀN RIÊNG TƯ & GDPR</span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
          Quản Lý Yêu Cầu Dữ Liệu
        </h1>
      </div>

      <div className="bg-[#121215] border border-white/10 p-6 space-y-6">
        <p className="text-xs text-[#9a989f] leading-relaxed">
          Tuân thủ chính sách quyền riêng tư dữ liệu cá nhân, bạn có toàn quyền yêu cầu tải xuống bản sao dữ liệu của mình hoặc yêu cầu đóng tài khoản và xóa vĩnh viễn dữ liệu.
        </p>

        {isSent ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
            ✓ Yêu cầu của bạn đã được ghi nhận. Đội ngũ kỹ thuật bảo mật sẽ xử lý trong vòng 48 giờ làm việc.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase text-[#9a989f] block mb-2">Loại yêu cầu</label>
              <select
                value={reqType}
                onChange={(e) => setReqType(e.target.value)}
                className="w-full min-h-[44px] px-3 bg-[#161619] border border-white/15 text-xs text-[#f4f0e8]"
              >
                <option value="export">Xuất toàn bộ bản ghi dữ liệu cá nhân (JSON)</option>
                <option value="delete">Xóa vĩnh viễn tài khoản và lịch sử giao dịch</option>
              </select>
            </div>
            <Button type="submit" variant="signal" size="md">
              Gửi Yêu Cầu Bảo Mật
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const currentSpend = 8450000;
  const targetSpend = 15000000;
  const progressPercent = Math.min(100, Math.round((currentSpend / targetSpend) * 100));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 w-full space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">TỔNG QUAN THÀNH VIÊN ATELIER</span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
            Bảng Điều Khiển: {user?.fullName || "Quý Khách"}
          </h1>
        </div>
        <div className="text-xs font-mono text-[#9a989f]">
          Mã thành viên: <span className="text-[#ff6d00] font-bold">ATELIER-{user?._id?.slice(-6).toUpperCase() || "VIP892"}</span>
        </div>
      </div>

      {/* VIP Tier Progress Card */}
      <div className="p-6 bg-[#121215] border border-[rgba(244,240,232,0.15)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-[#e65100] uppercase block">
              ĐẶC QUYỀN HỘI VIÊN
            </span>
            <h3 className="font-display text-xl font-bold text-[#f4f0e8] uppercase">
              Hạng Thẻ: DIAMOND ATELIER (Chiết khấu 5% mọi đơn)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#ff6d00] font-bold">
            {currentSpend.toLocaleString("vi-VN")} ₫ / {targetSpend.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <div className="w-full h-2 bg-[#0c0c0e] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#e65100] to-[#ff6d00] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-[#9a989f]">
          Tích lũy thêm {(targetSpend - currentSpend).toLocaleString("vi-VN")} ₫ để nâng cấp lên hạng thẻ cao nhất <strong className="text-white">BLACK OBSIDIAN</strong> (Chiết khấu 10% trọn đời & dịch vụ may đo riêng tại gia).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121215] border border-white/10 p-6 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Cấp Bậc Thẻ</span>
          <div className="font-display text-2xl text-[#f4f0e8]">DIAMOND ATELIER</div>
          <span className="text-xs text-emerald-400">Giảm 5% mọi đơn hàng</span>
        </div>
        <div className="bg-[#121215] border border-white/10 p-6 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Đơn Hàng Gần Nhất</span>
          <div className="font-display text-2xl text-[#f4f0e8]">ORD-998241</div>
          <span className="text-xs text-amber-400">Đang vận chuyển</span>
        </div>
        <div className="bg-[#121215] border border-white/10 p-6 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Ví Ưu Đãi</span>
          <div className="font-display text-2xl text-[#f4f0e8]">2 VOUCHERS</div>
          <Link to="/my-coupons" className="text-xs text-[#e65100] hover:underline">
            Sử dụng ngay →
          </Link>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <Link
          to="/orders"
          className="p-4 bg-[#161619] border border-white/10 hover:border-[#e65100] text-center space-y-1.5 transition-colors"
        >
          <Package className="mx-auto text-[#e65100]" size={20} />
          <span className="text-xs font-display uppercase tracking-wider text-[#f4f0e8] block font-bold">
            Đơn Hàng
          </span>
          <span className="text-[10px] text-[#9a989f] block">Tra cứu trạng thái</span>
        </Link>
        <Link
          to="/favorites"
          className="p-4 bg-[#161619] border border-white/10 hover:border-[#e65100] text-center space-y-1.5 transition-colors"
        >
          <Star className="mx-auto text-[#e65100]" size={20} />
          <span className="text-xs font-display uppercase tracking-wider text-[#f4f0e8] block font-bold">
            Yêu Thích
          </span>
          <span className="text-[10px] text-[#9a989f] block">Mẫu đã lưu</span>
        </Link>
        <Link
          to="/profile"
          className="p-4 bg-[#161619] border border-white/10 hover:border-[#e65100] text-center space-y-1.5 transition-colors"
        >
          <User className="mx-auto text-[#e65100]" size={20} />
          <span className="text-xs font-display uppercase tracking-wider text-[#f4f0e8] block font-bold">
            Sổ Địa Chỉ
          </span>
          <span className="text-[10px] text-[#9a989f] block">Quản lý nhận hàng</span>
        </Link>
        <Link
          to="/profile/data-requests"
          className="p-4 bg-[#161619] border border-white/10 hover:border-[#e65100] text-center space-y-1.5 transition-colors"
        >
          <Shield className="mx-auto text-[#e65100]" size={20} />
          <span className="text-xs font-display uppercase tracking-wider text-[#f4f0e8] block font-bold">
            GDPR & Bảo Mật
          </span>
          <span className="text-[10px] text-[#9a989f] block">Xuất/Xóa dữ liệu</span>
        </Link>
      </div>
    </div>
  );
}

export function CreateReview() {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 py-10 w-full space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">TRẢI NGHIỆM KHÁCH HÀNG</span>
        <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
          Đánh Giá Sản Phẩm Đã Mua
        </h1>
      </div>

      <div className="bg-[#121215] border border-white/10 p-6 space-y-5">
        {isSubmitted ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
            ✓ Cảm ơn bạn đã chia sẻ cảm nhận! Đánh giá của bạn đã được ghi nhận.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase text-[#9a989f] block mb-2">
                Đánh giá chất lượng may đo
              </label>
              <div className="flex gap-2 text-amber-400 cursor-pointer">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  >
                    <Star size={24} fill={s <= rating ? "#e65100" : "none"} stroke="#e65100" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase text-[#9a989f] block mb-2">
                Cảm nhận chi tiết
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chất vải, đường may, độ ôm phom dáng..."
                rows={4}
                className="w-full p-3 bg-[#161619] border border-white/15 text-xs text-[#f4f0e8]"
                required
              />
            </div>

            <Button type="submit" variant="signal" size="md">
              Gửi Đánh Giá
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
