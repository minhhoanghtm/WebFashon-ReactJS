import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag, ShieldCheck, Tag, Sparkles, Check, Truck, Gift } from "lucide-react";
import { useCartStore } from "../../stores/cartStore";
import { Button } from "../../components/ui/Button";
import { voucherApi, productApi } from "../../api/endpoints";
import { SafeImage } from "../../components/ui/SafeImage";

export function Cart() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);
  const addItem = useCartStore((state) => state.addItem);

  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState("");
  const [shippingCity, setShippingCity] = useState("hanoi");
  const [crossSellProducts, setCrossSellProducts] = useState([]);

  const subtotal = getTotal();
  const isFreeStandard = subtotal >= 1000000;
  const isFreeExpress = subtotal >= 2000000;

  // Estimated shipping fee
  const shippingFee = isFreeStandard ? 0 : shippingCity === "other" ? 35000 : 25000;
  const total = Math.max(0, subtotal - discount + shippingFee);

  // Load complementary products for cross-sell
  useEffect(() => {
    let active = true;
    async function loadCrossSells() {
      try {
        const res = await productApi.getAll({ limit: 4 });
        const list = res.data || res || [];
        if (active && Array.isArray(list)) {
          setCrossSellProducts(list.slice(0, 3));
        }
      } catch (e) {
        // Ignore
      }
    }
    loadCrossSells();
    return () => {
      active = false;
    };
  }, []);

  const handleApplyVoucher = async (e) => {
    if (e) e.preventDefault();
    if (!voucherCode.trim()) return;
    try {
      const res = await voucherApi.applyVoucher({
        code: voucherCode.trim(),
        orderTotal: subtotal,
      });
      const disc = res.data?.discountAmount || res.discountAmount || Math.round(subtotal * 0.1);
      setDiscount(disc);
      setVoucherMsg(`Đã áp dụng mã "${voucherCode.toUpperCase()}" (-${disc.toLocaleString("vi-VN")} ₫)`);
    } catch (err) {
      // Mock acceptable demo discount
      const mockDisc = voucherCode.toUpperCase().includes("10") ? Math.round(subtotal * 0.1) : 50000;
      setDiscount(mockDisc);
      setVoucherMsg(`Đã áp dụng mã "${voucherCode.toUpperCase()}" (-${mockDisc.toLocaleString("vi-VN")} ₫)`);
    }
  };

  const handleQuickApply = (code) => {
    setVoucherCode(code);
    const mockDisc = code === "ATELIER10" ? Math.round(subtotal * 0.1) : 50000;
    setDiscount(mockDisc);
    setVoucherMsg(`Đã áp dụng mã "${code}" (-${mockDisc.toLocaleString("vi-VN")} ₫)`);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-[#161619] border border-[rgba(244,240,232,0.15)] flex items-center justify-center text-[#6b6973]">
          <ShoppingBag size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl uppercase text-[#f4f0e8]">
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="text-xs text-[#9a989f] max-w-sm mx-auto">
            Khám phá những thiết kế may đo mới nhất và chọn lựa trang phục ưng ý cho tủ đồ của bạn.
          </p>
        </div>
        <Link to="/products">
          <Button variant="signal" size="lg">
            Khám Phá Bộ Sưu Tập Mới
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="pb-6 border-b border-[rgba(244,240,232,0.1)] mb-6">
        <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
          QUẢN LÝ ĐƠN HÀNG
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#f4f0e8]">
          GIỎ HÀNG MAY ĐO ({items.length})
        </h1>
      </div>

      {/* Free Shipping & Express Milestone Progress Indicator */}
      <div className="mb-8 p-5 bg-[#161619] border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Truck size={15} className="text-[#e65100]" />
            <span className="font-display uppercase text-[#f4f0e8] font-bold">
              {isFreeExpress
                ? "✦ BẠN ĐÃ ĐẠT: FREESHIP HỎA TỐC + HỘP QUÀ TẶNG ATELIER VIP"
                : isFreeStandard
                ? "✦ BẠN ĐẠT MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC"
                : `Mua thêm ${(1000000 - subtotal).toLocaleString("vi-VN")} ₫ để được FREESHIP`}
            </span>
          </div>
          <span className="font-mono text-[#e65100] font-bold">
            {Math.min(100, Math.round((subtotal / 2000000) * 100))}%
          </span>
        </div>

        <div className="w-full h-2 bg-[#0c0c0e] overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#e65100] to-[#ff6d00] transition-all duration-500"
            style={{ width: `${Math.min(100, (subtotal / 2000000) * 100)}%` }}
          />
        </div>

        {/* Milestone Badges */}
        <div className="flex justify-between text-[10px] font-mono text-[#9a989f] pt-1">
          <span className={subtotal >= 1000000 ? "text-emerald-400 font-bold" : ""}>
            ✓ 1.000.000 ₫: Freeship Tiêu Chuẩn
          </span>
          <span className={subtotal >= 2000000 ? "text-emerald-400 font-bold" : ""}>
            ✓ 2.000.000 ₫: Hộp Quà VIP + Giao Hỏa Tốc
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Cart Items Ledger */}
        <div className="lg:col-span-8 space-y-4">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-3 border-b border-[rgba(244,240,232,0.1)] text-xs font-mono uppercase text-[#9a989f]">
            <div className="col-span-6">Thiết Kế</div>
            <div className="col-span-2 text-center">Đơn Giá</div>
            <div className="col-span-2 text-center">Số Lượng</div>
            <div className="col-span-2 text-right">Tổng</div>
          </div>

          {items.map((item) => {
            const itemPrice = item.price || item.new_price || 0;
            const itemId = item._id || item.id;
            return (
              <div
                key={itemId}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 bg-[#121215] border border-[rgba(244,240,232,0.1)]"
              >
                {/* Image & Title */}
                <div className="sm:col-span-6 flex items-center gap-4">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="w-16 sm:w-20 aspect-[3/4] object-cover bg-[#161619]"
                  />
                  <div>
                    <h3 className="font-display text-sm tracking-wide text-[#f4f0e8]">
                      {item.name}
                    </h3>
                    {item.variantDetails && (
                      <span className="text-xs font-mono text-[#9a989f] block mt-0.5">
                        {item.variantDetails}
                      </span>
                    )}
                    <button
                      onClick={() => removeItem(itemId)}
                      className="text-[11px] text-red-400 hover:text-red-300 inline-flex items-center gap-1 mt-2 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="sm:col-span-2 sm:text-center text-xs font-mono text-[#9a989f]">
                  <span className="sm:hidden font-sans">Đơn giá: </span>
                  {itemPrice.toLocaleString("vi-VN")} ₫
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2 flex sm:justify-center items-center">
                  <div className="flex items-center border border-[rgba(244,240,232,0.2)] bg-[#161619]">
                    <button
                      onClick={() => updateQuantity(itemId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-xs hover:bg-white/5"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(itemId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-xs hover:bg-white/5"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="sm:col-span-2 sm:text-right font-display text-sm font-semibold text-[#f4f0e8]">
                  <span className="sm:hidden font-sans text-xs text-[#9a989f]">Thành tiền: </span>
                  {(itemPrice * item.quantity).toLocaleString("vi-VN")} ₫
                </div>
              </div>
            );
          })}

          {/* Cross-Sell Recommendations */}
          {crossSellProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[rgba(244,240,232,0.1)] space-y-4">
              <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block">
                GỢI Ý PHỐI CÙNG (CROSS-SELL)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {crossSellProducts.map((p) => {
                  const pImg =
                    p.displayProduct?.[0] ||
                    p.displayProduct ||
                    p.images?.[0] ||
                    p.image ||
                    "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=300&q=80";

                  return (
                    <div
                      key={p._id}
                      className="p-3 bg-[#161619] border border-white/5 flex items-center gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="w-12 aspect-[3/4] bg-[#0c0c0e] shrink-0 overflow-hidden">
                        <SafeImage src={pImg} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-xs font-bold text-[#f4f0e8] truncate">
                          {p.name}
                        </h4>
                        <div className="text-[11px] font-mono text-[#ff6d00] font-semibold">
                          {(p.price || p.new_price || 0).toLocaleString("vi-VN")} ₫
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          addItem({
                            id: p._id,
                            productId: p._id,
                            name: p.name,
                            price: p.price || p.new_price || 0,
                            image: pImg,
                            quantity: 1,
                          })
                        }
                        className="px-2 py-1 bg-[#202025] hover:bg-[#e65100] text-white text-[10px] font-mono uppercase transition-colors"
                      >
                        + Thêm
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Ledger */}
        <div className="lg:col-span-4">
          <div className="bg-[#121215] border border-[rgba(244,240,232,0.15)] p-6 space-y-6">
            <h3 className="font-display text-base tracking-wider uppercase text-[#f4f0e8] pb-3 border-b border-[rgba(244,240,232,0.1)] font-bold">
              Tóm Tắt Đơn Hàng
            </h3>

            {/* Quick Voucher Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#9a989f] block">
                Mã Giảm Giá Gợi Ý:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickApply("ATELIER10")}
                  className="px-2.5 py-1 bg-[#161619] hover:bg-[#202025] border border-[#e65100]/40 text-[#ff6d00] text-[10px] font-mono uppercase tracking-wider transition-colors"
                >
                  ✦ ATELIER10 (-10%)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickApply("FREESHIP")}
                  className="px-2.5 py-1 bg-[#161619] hover:bg-[#202025] border border-white/20 text-[#f4f0e8] text-[10px] font-mono uppercase tracking-wider transition-colors"
                >
                  ✦ FREESHIP (-50k)
                </button>
              </div>
            </div>

            {/* Voucher input */}
            <form onSubmit={handleApplyVoucher} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="NHẬP MÃ ƯU ĐÃI"
                  className="flex-1 min-h-[40px] px-3 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs text-[#f4f0e8] uppercase font-mono"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Áp Dụng
                </Button>
              </div>
              {voucherMsg && (
                <span className="text-[11px] text-emerald-400 block font-mono">
                  {voucherMsg}
                </span>
              )}
            </form>

            {/* Shipping Estimate Selector */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-xs font-mono uppercase text-[#9a989f] block">
                Dự Toán Vận Chuyển:
              </label>
              <select
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="w-full min-h-[38px] px-3 bg-[#161619] border border-[rgba(244,240,232,0.15)] text-xs text-[#f4f0e8] font-mono focus:border-[#e65100]"
              >
                <option value="hanoi">Hà Nội (25.000 ₫ - Miễn phí đơn từ 1M)</option>
                <option value="hcm">TP. Hồ Chí Minh (25.000 ₫ - Miễn phí đơn từ 1M)</option>
                <option value="other">Tỉnh thành khác (35.000 ₫ - Miễn phí đơn từ 1M)</option>
              </select>
            </div>

            {/* Summary Breakdown */}
            <div className="space-y-3 pt-3 border-t border-[rgba(244,240,232,0.1)] text-xs font-mono">
              <div className="flex justify-between text-[#9a989f]">
                <span>Tạm tính</span>
                <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#ff6d00]">
                  <span>Ưu đãi Voucher</span>
                  <span>-{discount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-[#9a989f]">
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? "MIỄN PHÍ" : `${shippingFee.toLocaleString("vi-VN")} ₫`}</span>
              </div>
              <div className="flex justify-between text-base font-display text-[#f4f0e8] pt-3 border-t border-white/10 font-bold">
                <span>Tổng Thanh Toán</span>
                <span className="text-[#ff6d00]">{total.toLocaleString("vi-VN")} ₫</span>
              </div>
            </div>

            <Button
              variant="signal"
              size="lg"
              className="w-full gap-2 py-4"
              onClick={() => navigate("/checkout")}
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight size={16} />
            </Button>

            <div className="flex items-center gap-2 text-[11px] text-[#9a989f] justify-center pt-2">
              <ShieldCheck size={14} className="text-[#e65100]" />
              <span>Bảo mật giao dịch mã hóa SSL 256-bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
