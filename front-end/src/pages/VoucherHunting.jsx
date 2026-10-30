import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ticket, Sparkles, Loader2, Info, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";
import VoucherDetailModal from "../components/VoucherDetailModal";
import { getActiveBannersService, trackBannerClickService } from "../services/banner.service";
import { useWebsiteSettings } from "../hooks/useWebsiteSettings";

const VoucherHunting = ({ isDashboard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "404Studio";

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

    if (user?.role === "admin") {
      toast.warning("Quản trị viên không được phép lưu mã voucher!");
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
    <div className={isDashboard ? "w-full space-y-6" : "min-h-screen bg-[#FBF9F5] py-12 px-4 sm:px-6 lg:px-8 font-sans select-none"}>
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-[1536px] space-y-8"}>
        
        {/* Banner Section */}
        {!isDashboard && (!bannersLoading && promoBanners.length > 0 ? (
          // Dynamic Promotion Banner
          <div
            onClick={() => handleBannerClick(promoBanners[0])}
            className="group relative w-full h-[240px] md:h-[280px] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-[#05251C]/10 bg-[#05251C] flex items-center"
          >
            {/* Background Image */}
            <img
              src={promoBanners[0].imageUrl}
              alt={promoBanners[0].title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition duration-700 pointer-events-none opacity-80"
            />
            
            {/* Elegant dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent transition-opacity duration-300" />
            
            {/* Text Content */}
            <div className="relative z-10 p-8 md:p-12 text-left max-w-[85%] space-y-3 select-none">
              <span className="inline-flex items-center gap-1.5 bg-[#F5DD20] px-3.5 py-0.5 rounded-full text-[10px] font-black tracking-widest text-[#05251C] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Đặc quyền Atelier</span>
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-sm font-display uppercase tracking-tight">
                {promoBanners[0].title}
              </h1>
              {promoBanners[0].subtitle && (
                <p className="text-xs md:text-sm text-neutral-300 font-medium line-clamp-2 max-w-lg">
                  {promoBanners[0].subtitle}
                </p>
              )}
              <div className="pt-1">
                <button
                  className="flex items-center gap-1.5 text-xs font-bold text-white border-b border-[#F5DD20] pb-0.5 hover:gap-2.5 transition-all duration-300 cursor-pointer"
                >
                  {promoBanners[0].buttonText && (
                    <>
                      <span>{promoBanners[0].buttonText}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[#F5DD20]" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Fallback Atelier Banner
          <div className="relative rounded-3xl overflow-hidden bg-[#05251C] border border-[#F5DD20]/30 p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#F5DD20]/15 border border-[#F5DD20]/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#F5DD20]">
                <Sparkles className="h-4 w-4 text-[#F5DD20]" />
                <span>404STUDIO · VOUCHER ARCHIVE</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight font-display uppercase">
                Đặc Quyền May Đo <br/> Dành Cho Khách Hàng
              </h1>
              <p className="text-sm text-neutral-300 font-medium leading-relaxed">
                Khám phá các mã ưu đãi độc quyền từ 404Studio cho đơn hàng thời trang tiếp theo của bạn.
              </p>
            </div>
            <div className="h-36 w-36 bg-white/5 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-md shadow-2xl relative shrink-0">
              <Ticket className="h-16 w-16 text-[#F5DD20] transform -rotate-12 hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
        ))}

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-[#E8E5DF] pb-4">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#05251C] flex items-center gap-2 font-display uppercase">
              <Ticket className="h-5.5 w-5.5 text-[#05251C]" />
              <span>Voucher Đang Áp Dụng</span>
            </h2>
            <span className="text-xs text-[#77736E] font-mono">
              [ {vouchers.length} Ưu đãi có sẵn ]
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-[#05251C] mb-2" />
              <p className="text-sm text-[#77736E]">Đang tải danh sách ưu đãi...</p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#E8E5DF] text-center space-y-3">
              <Ticket className="h-12 w-12 text-[#77736E]" />
              <div className="space-y-1">
                <p className="text-base font-bold text-[#171717]">Hôm nay chưa có voucher mới</p>
                <p className="text-xs text-[#77736E]">Hãy quay lại sau để đón chờ các chương trình đặc quyền tiếp theo nhé!</p>
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
                    className="group relative bg-white border border-[#E8E5DF] hover:border-[#05251C]/40 rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden min-h-[190px]"
                  >
                    {/* Circle notches for ticket aesthetic */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#FBF9F5] border border-[#E8E5DF] z-10"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-[#FBF9F5] border border-[#E8E5DF] z-10"></div>

                    {/* Voucher Card Header */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-[#05251C]/5 rounded-xl flex items-center justify-center text-[#05251C] shrink-0 border border-[#05251C]/15">
                        <Ticket className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 pr-4">
                        <div className="text-xs font-mono font-bold text-[#05251C] bg-[#F5DD20]/30 px-2.5 py-0.5 rounded w-fit uppercase">
                          {v.code}
                        </div>
                        <h3 className="text-base font-extrabold text-[#171717] line-clamp-1 group-hover:text-[#05251C] transition-colors font-heading">
                          {v.name}
                        </h3>
                        <p className="text-xs text-[#77736E] line-clamp-2 leading-relaxed">
                          Đơn tối thiểu: {v.minOrderValue > 0 ? `${v.minOrderValue.toLocaleString("vi-VN")}đ` : "0đ"}
                        </p>
                      </div>
                    </div>

                    {/* Voucher Footer (Progress & Actions) */}
                    <div className="mt-4 pt-4 border-t border-[#E8E5DF] flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-[#77736E] font-bold uppercase">
                          <span>Đã nhận {percentClaimed}%</span>
                          <span>Còn {v.remainingQuantity} lượt</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#05251C] rounded-full"
                            style={{ width: `${percentClaimed}%` }}
                          ></div>
                        </div>
                      </div>

                      {isClaimed ? (
                        <button
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl shrink-0 cursor-not-allowed border border-emerald-200"
                        >
                          Đã Có
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(v._id);
                          }}
                          className="px-4 py-2 bg-[#05251C] hover:bg-[#073D2A] text-[#F5DD20] text-xs font-bold rounded-xl shrink-0 shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
                        >
                          Lưu Mã
                        </button>
                      )}
                    </div>

                    {/* Tooltip hint info icon */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Info className="h-4 w-4 text-[#77736E] hover:text-[#05251C]" />
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
