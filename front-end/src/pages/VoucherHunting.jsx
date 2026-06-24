import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ticket, Sparkles, Loader2, Info, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";
import VoucherDetailModal from "../components/VoucherDetailModal";
import { getActiveBannersService, trackBannerClickService } from "../services/banner.service";

const VoucherHunting = ({ isDashboard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const [vouchers, setVouchers] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banner states
  const [promoBanners, setPromoBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getPublicVouchers();
      if (res.success) {
        setVouchers(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách voucher săn");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWallet = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await voucherApi.getUserWallet();
      if (res.success) {
        // Collect IDs of vouchers already in the user wallet
        const ids = res.data.map((item) => (item.voucherId?._id || item.voucherId));
        setClaimedIds(ids.filter(Boolean));
      }
    } catch (err) {
      console.error("Lỗi khi tải ví voucher:", err);
    }
  };

  const fetchBanners = async () => {
    try {
      setBannersLoading(true);
      const banners = await getActiveBannersService();
      const filtered = banners.filter(b => b.position === "home_promotion");
      filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setPromoBanners(filtered);
    } catch (error) {
      console.error("Lỗi khi tải Promotion Banner cho trang Voucher:", error);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchUserWallet();
    fetchBanners();
  }, [isAuthenticated]);

  const handleBannerClick = async (banner) => {
    const bannerId = banner._id || banner.id;
    if (bannerId) {
      await trackBannerClickService(bannerId);
    }

    if (banner.targetType === "product" && banner.targetId) {
      navigate(`/product/${banner.targetId}`);
    } else if (banner.targetType === "category" && banner.targetId) {
      navigate(`/products?category=${banner.targetId}`);
    } else if (banner.targetType === "lookbook" && banner.targetId) {
      navigate(`/lookbooks/${banner.targetId}`);
    } else if (banner.targetType === "external" && banner.linkUrl && banner.linkUrl.trim() !== "") {
      if (banner.linkUrl.startsWith("#")) {
        const element = document.getElementById(banner.linkUrl.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        window.open(banner.linkUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleClaim = async (voucherId) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để săn mã giảm giá!");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      const res = await voucherApi.claimVoucher(voucherId);
      if (res.success) {
        toast.success("Chúc mừng! Săn voucher thành công 🎉");
        setClaimedIds([...claimedIds, voucherId]);
        // Refresh vouchers list to get updated remaining quantities
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Săn voucher thất bại. Vui lòng thử lại!");
    }
  };

  const openDetail = (voucher) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };


  return (
    <div className={isDashboard ? "w-full space-y-6" : "min-h-screen bg-slate-50/50 dark:bg-slate-900/40 py-12 px-6 font-sans"}>
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-6xl space-y-8"}>
        
        {/* Banner Section */}
        {!isDashboard && (!bannersLoading && promoBanners.length > 0 ? (
          // Dynamic Promotion Banner
          <div
            onClick={() => handleBannerClick(promoBanners[0])}
            className="group relative w-full h-[240px] md:h-[280px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-150/40 bg-gray-50 flex items-center"
          >
            {/* Background Image */}
            <img
              src={promoBanners[0].imageUrl}
              alt={promoBanners[0].title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition duration-700 pointer-events-none"
            />
            
            {/* Elegant overlay matching Voucher page */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent transition-opacity duration-300" />
            
            {/* Text Content */}
            <div className="relative z-10 p-8 md:p-12 text-left max-w-[85%] space-y-3 select-none">
              <span className="inline-flex items-center gap-1.5 bg-indigo-650/80 px-3.5 py-0.5 rounded-full text-[10px] font-black tracking-widest text-indigo-100 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ưu đãi đặc biệt</span>
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
                {promoBanners[0].title}
              </h1>
              {promoBanners[0].subtitle && (
                <p className="text-xs md:text-sm text-gray-250 font-medium line-clamp-2 max-w-lg">
                  {promoBanners[0].subtitle}
                </p>
              )}
              <div className="pt-1">
                <button
                  className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-white pb-0.5 hover:gap-2.5 transition-all duration-300 cursor-pointer"
                >
                  {promoBanners[0].buttonText && (
                    <>
                      <span>{promoBanners[0].buttonText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Fallback static premium purple banner
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-4.5 w-4.5" />
                <span>Ưu đãi từ 404Studio</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Săn Voucher Mỏi Tay <br/> Nhận Ngay Ưu Đãi
              </h1>
              <p className="text-sm text-indigo-100 font-medium">
                Hàng ngàn mã giảm giá hấp dẫn áp dụng cho các sản phẩm của 404Studio. Săn ngay kẻo lỡ!
              </p>
            </div>
            <div className="h-44 w-44 bg-white/10 dark:bg-white/5 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-lg shadow-2xl relative shrink-0">
              <Ticket className="h-20 w-20 text-white/90 transform -rotate-12 hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-full bg-white/5 animate-ping"></div>
            </div>
          </div>
        ))}

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Ticket className="h-5.5 w-5.5 text-indigo-600" />
              <span>Voucher Đang Diễn Ra</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">
              Khám phá {vouchers.length} ưu đãi hôm nay
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm text-slate-400">Đang tải danh sách voucher cực hot...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/60 dark:border-slate-800 text-center space-y-3">
              <Ticket className="h-12 w-12 text-slate-300" />
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-600 dark:text-slate-300">Hôm nay chưa có voucher mới</p>
                <p className="text-xs text-slate-400">Hãy quay lại sau để đón chờ các chương trình khuyến mãi đặc biệt nhé!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vouchers.map((v) => {
                const isClaimed = claimedIds.includes(v._id);
                const percentClaimed = Math.round(((v.totalQuantity - v.remainingQuantity) / v.totalQuantity) * 100);

                return (
                  <div
                    key={v._id}
                    onClick={() => openDetail(v)}
                    className="group relative bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden min-h-[190px]"
                  >
                    {/* Circle notches for ticket aesthetic */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-10"></div>

                    {/* Voucher Card Header */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                        <Ticket className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded w-fit uppercase">
                          {v.code}
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {v.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          Đơn tối thiểu: {v.minOrderValue > 0 ? `${v.minOrderValue.toLocaleString("vi-VN")}đ` : "0đ"}
                        </p>
                      </div>
                    </div>

                    {/* Voucher Footer (Progress & Actions) */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                          <span>Đã nhận {percentClaimed}%</span>
                          <span>Còn {v.remainingQuantity} lượt</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${percentClaimed}%` }}
                          ></div>
                        </div>
                      </div>

                      {isClaimed ? (
                        <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs font-bold rounded-xl shrink-0 cursor-not-allowed border border-emerald-100 dark:border-emerald-900"
                        >
                          Đã Có
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(v._id);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shrink-0 shadow shadow-indigo-500/20 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                          Lưu Mã
                        </button>
                      )}
                    </div>

                    {/* Tooltip hint info icon */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Info className="h-4 w-4 text-slate-400 hover:text-indigo-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <VoucherDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        voucher={selectedVoucher}
        onClaim={handleClaim}
        claimedList={claimedIds}
      />
    </div>
  );
};

export default VoucherHunting;
