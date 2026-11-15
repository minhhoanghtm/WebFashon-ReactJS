import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  Activity,
  Layers,
  Settings,
} from "lucide-react";
import { adminApi, categoryApi, productApi } from "../../api/endpoints";
import { Button, Input, Badge } from "../../components/ui/Button";
import { SafeImage } from "../../components/ui/SafeImage";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 148500000,
    totalOrders: 218,
    totalProducts: 48,
    totalCustomers: 1250,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#f4f0e8]">
            Bảng Điều Khiển Hệ Thống
          </h1>
        </div>
        <Badge variant="signal">Live Data</Badge>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 tabular-nums">
        <div className="p-5 bg-[#121215] border border-white/10 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Tổng Doanh Thu</span>
          <div className="font-display text-2xl font-bold text-[#f4f0e8]">
            {stats.totalRevenue.toLocaleString("vi-VN")} ₫
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">↑ 18.2% so với tháng trước</span>
        </div>

        <div className="p-5 bg-[#121215] border border-white/10 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Đơn Hàng Đã Xử Lý</span>
          <div className="font-display text-2xl font-bold text-[#f4f0e8]">
            {stats.totalOrders}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">98.5% giao thành công</span>
        </div>

        <div className="p-5 bg-[#121215] border border-white/10 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Thiết Kế Đang Bán</span>
          <div className="font-display text-2xl font-bold text-[#f4f0e8]">
            {stats.totalProducts}
          </div>
          <span className="text-[11px] text-blue-400 font-mono">14 danh mục active</span>
        </div>

        <div className="p-5 bg-[#121215] border border-white/10 space-y-2">
          <span className="text-xs font-mono uppercase text-[#9a989f]">Khách Hàng Đăng Ký</span>
          <div className="font-display text-2xl font-bold text-[#f4f0e8]">
            {stats.totalCustomers}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">↑ 124 người dùng mới</span>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-[#121215] border border-white/10 p-6 space-y-4">
        <h3 className="font-display text-sm uppercase text-[#f4f0e8]">
          Giao Dịch Gần Nhất
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[#9a989f] uppercase">
                <th className="py-2.5">Mã Đơn</th>
                <th className="py-2.5">Khách Hàng</th>
                <th className="py-2.5">Giá Trị</th>
                <th className="py-2.5">Phương Thức</th>
                <th className="py-2.5">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-3 font-mono font-bold text-[#f4f0e8]">ORD-998241</td>
                <td className="py-3 text-[#9a989f]">Nguyễn Văn A</td>
                <td className="py-3 font-mono">1.850.000 ₫</td>
                <td className="py-3 font-mono">COD</td>
                <td className="py-3"><Badge variant="warning">Đang giao</Badge></td>
              </tr>
              <tr>
                <td className="py-3 font-mono font-bold text-[#f4f0e8]">ORD-982103</td>
                <td className="py-3 text-[#9a989f]">Lê Thị B</td>
                <td className="py-3 font-mono">980.000 ₫</td>
                <td className="py-3 font-mono">MOMO</td>
                <td className="py-3"><Badge variant="success">Hoàn tất</Badge></td>
              </tr>
              <tr>
                <td className="py-3 font-mono font-bold text-[#f4f0e8]">ORD-975112</td>
                <td className="py-3 text-[#9a989f]">Trần Minh C</td>
                <td className="py-3 font-mono">2.450.000 ₫</td>
                <td className="py-3 font-mono">VNPAY</td>
                <td className="py-3"><Badge variant="success">Hoàn tất</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll().then((res) => {
      const list = res.data || res || [];
      setCategories(Array.isArray(list) ? list : []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">QUẢN LÝ DANH MỤC</span>
          <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
            Danh Mục Sản Phẩm ({categories.length})
          </h1>
        </div>
        <Button variant="signal" size="sm" className="gap-1.5">
          <Plus size={14} /> Thêm Danh Mục
        </Button>
      </div>

      <div className="bg-[#121215] border border-white/10 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[#9a989f] uppercase bg-[#161619]">
              <th className="p-3">Tên Danh Mục</th>
              <th className="p-3">Slug</th>
              <th className="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map((c) => (
              <tr key={c._id} className="hover:bg-white/5">
                <td className="p-3 font-display font-medium text-[#f4f0e8]">{c.name}</td>
                <td className="p-3 font-mono text-[#9a989f]">{c.slug}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="text-blue-400 hover:text-blue-300"><Edit size={14} /></button>
                  <button className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productApi.getAll({ limit: 50 }).then((res) => {
      const list = res.data || res || [];
      setProducts(Array.isArray(list) ? list : []);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">KHO HÀNG ATELIER</span>
          <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
            Quản Lý Sản Phẩm ({products.length})
          </h1>
        </div>
        <Button variant="signal" size="sm" className="gap-1.5">
          <Plus size={14} /> Thêm Thiết Kế
        </Button>
      </div>

      <div className="bg-[#121215] border border-white/10 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[#9a989f] uppercase bg-[#161619]">
              <th className="p-3">Sản Phẩm</th>
              <th className="p-3">Danh Mục</th>
              <th className="p-3">Giá Bán</th>
              <th className="p-3">Tồn Kho</th>
              <th className="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-white/5">
                <td className="p-3 flex items-center gap-2.5">
                  <SafeImage
                    src={p.displayProduct?.[0] || p.displayProduct || p.image}
                    alt={p.name}
                    className="w-10 h-12 object-cover bg-black"
                  />
                  <span className="font-display font-medium text-[#f4f0e8] truncate max-w-[200px]">{p.name}</span>
                </td>
                <td className="p-3 text-[#9a989f]">{p.category?.name || "Atelier"}</td>
                <td className="p-3 font-mono font-bold text-[#f4f0e8]">{(p.price || p.new_price || 0).toLocaleString("vi-VN")} ₫</td>
                <td className="p-3 font-mono">{p.stock ?? 50}</td>
                <td className="p-3 text-right space-x-2">
                  <button className="text-blue-400 hover:text-blue-300"><Edit size={14} /></button>
                  <button className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState([
    { _id: "ORD-998241", customer: "Nguyễn Văn A", phone: "0900000001", total: 1850000, status: "Đang giao" },
    { _id: "ORD-982103", customer: "Lê Thị B", phone: "0900000002", total: 980000, status: "Hoàn tất" },
    { _id: "ORD-975112", customer: "Trần Minh C", phone: "0900000003", total: 2450000, status: "Đang xử lý" },
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">ĐƠN HÀNG TOÀN HỆ THỐNG</span>
          <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
            Quản Lý Đơn Hàng ({orders.length})
          </h1>
        </div>
      </div>

      <div className="bg-[#121215] border border-white/10 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[#9a989f] uppercase bg-[#161619]">
              <th className="p-3">Mã Đơn</th>
              <th className="p-3">Khách Hàng</th>
              <th className="p-3">Số Điện Thoại</th>
              <th className="p-3">Tổng Tiền</th>
              <th className="p-3">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-white/5">
                <td className="p-3 font-mono font-bold text-[#f4f0e8]">{o._id}</td>
                <td className="p-3 text-[#f4f0e8]">{o.customer}</td>
                <td className="p-3 font-mono text-[#9a989f]">{o.phone}</td>
                <td className="p-3 font-mono font-bold">{o.total.toLocaleString("vi-VN")} ₫</td>
                <td className="p-3"><Badge variant={o.status === "Hoàn tất" ? "success" : "warning"}>{o.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCustomers() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">DỮ LIỆU NGƯỜI DÙNG</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Quản Lý Khách Hàng
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Quản lý danh sách thành viên thân thiết và hạng thẻ Atelier.</p>
      </div>
    </div>
  );
}

export function AdminCoupons() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <span className="text-xs font-mono uppercase text-[#e65100]">KHUYẾN MÃI</span>
          <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
            Quản Lý Mã Giảm Giá
          </h1>
        </div>
        <Button variant="signal" size="sm">+ Thêm Voucher</Button>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Cấu hình mức giảm giá % hoặc tiền mặt cho đơn hàng và vận chuyển.</p>
      </div>
    </div>
  );
}

export function AdminCampaigns() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">TIẾP THỊ</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Chiến Dịch Khuyến Mãi
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Chiến dịch Flash Sale và bộ sưu tập ra mắt theo mùa.</p>
      </div>
    </div>
  );
}

export function AdminBanners() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">TRUYỀN THÔNG THỊ GIÁC</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Quản Lý Banners
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Cập nhật hình ảnh banner trang chủ và các phân vùng quảng bá.</p>
      </div>
    </div>
  );
}

export function AdminLookbooks() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">NGHỆ THUẬT</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Quản Lý Lookbooks
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Biên tập các bộ ảnh thời trang và gắn tag sản phẩm may đo.</p>
      </div>
    </div>
  );
}

export function AdminChats() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">HỘI THOẠI TRỰC TIẾP</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Trung Tâm Tin Nhắn CSKH
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6 flex items-center justify-center min-h-[300px] text-center">
        <div>
          <MessageSquare size={36} className="mx-auto text-[#6b6973] mb-2" />
          <h3 className="font-display text-base text-[#f4f0e8] uppercase">Kênh tư vấn trực tiếp Socket.io</h3>
          <p className="text-xs text-[#9a989f]">Đang lắng nghe yêu cầu tư vấn may đo từ khách hàng.</p>
        </div>
      </div>
    </div>
  );
}

export function AdminUserActivity() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">GIÁM SÁT THỜI GIAN THỰC</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Hành Vi & Dòng Sự Kiện Người Dùng
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Luồng sự kiện telemetry đang hoạt động</span>
        </div>
        <p className="text-xs text-[#9a989f]">Theo dõi số lượt xem sản phẩm, thêm giỏ và thao tác checkout bảo mật.</p>
      </div>
    </div>
  );
}

export function AdminAbTesting() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">TỐI ƯU HÓA</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Thử Nghiệm Phân Tách A/B Testing
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Đo lường tỉ lệ chuyển đổi giữa biến thể Hero split và Hero catalogue grid.</p>
      </div>
    </div>
  );
}

export function AdminPages() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">NỘI DUNG TĨNH</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Quản Lý Trang Chính Sách & Pháp Lý
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6">
        <p className="text-xs text-[#9a989f]">Soạn thảo các trang điều khoản, vận chuyển, đổi trả và tôn chỉ may đo.</p>
      </div>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-white/10">
        <span className="text-xs font-mono uppercase text-[#e65100]">CẤU HÌNH</span>
        <h1 className="font-display text-2xl font-bold uppercase text-[#f4f0e8]">
          Cài Đặt Hệ Thống & Website
        </h1>
      </div>
      <div className="bg-[#121215] border border-white/10 p-6 space-y-4 max-w-xl">
        <Input label="Tên Thương Hiệu" defaultValue="WebFashion Atelier" />
        <Input label="Email CSKH" defaultValue="atelier@404studio.example" />
        <Input label="Hotline Showroom" defaultValue="+84900000001" />
        <Button variant="signal" size="md">Lưu Cấu Hình</Button>
      </div>
    </div>
  );
}
