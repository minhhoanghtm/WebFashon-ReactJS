import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Ticket, Sparkles, Loader2, Info, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";
import VoucherDetailModal from "../components/VoucherDetailModal";
import {
  getActiveBannersService,
  trackBannerClickService,
} from "../services/banner.service";
import { useWebsiteSettings } from "../hooks/useWebsiteSettings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const VoucherHunting = ({ isDashboard = false }) => {
  useDocumentTitle("Săn Voucher");
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "WebFashion";

  const [vouchers, setVouchers] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [promoBanners, setPromoBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const fetchVouchers = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    try {
      const res = await voucherApi.getPublicVouchers();
      if (res.success) {
        setVouchers(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách voucher");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      await Promise.resolve();
      fetchVouchers();

      if (isAuthenticated) {
        try {
          const res = await voucherApi.getUserWallet();
          if (isMounted && res.success) {
            const ids = (res.data || []).map(
              (item) => item.voucherId?._id || item.voucherId
            );
            setClaimedIds(ids.filter(Boolean));
          }
        } catch (err) {
          console.error("Lỗi khi tải ví voucher:", err);
        }
      }

      try {
        if (isMounted) setBannersLoading(true);
        const banners = await getActiveBannersService();
        if (isMounted) {
          const filtered = (banners || []).filter(
            (b) => b.position === "home_promotion"
          );
          filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setPromoBanners(filtered);
        }
      } catch (error) {
        console.error("Lỗi khi tải Promotion Banner:", error);
      } finally {
        if (isMounted) setBannersLoading(false);
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchVouchers]);

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
    } else if (
      banner.targetType === "external" &&
      banner.linkUrl &&
      banner.linkUrl.trim() !== ""
    ) {
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
      toast.info("Vui lòng đăng nhập để lưu mã giảm giá!");
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
        toast.success("Lưu voucher thành công!");
        setClaimedIds((prev) => [...prev, voucherId]);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Lưu voucher thất bại. Vui lòng thử lại!"
      );
    }
  };

  const openDetail = (voucher) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  return (
    <div
      className={
        isDashboard
          ? "w-full space-y-6 text-[var(--color-text)]"
          : "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] py-12 px-4 sm:px-6 lg:px-8"
      }
    >
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-7xl space-y-8"}>
        {/* Banner Section */}
        {!isDashboard &&
          (!bannersLoading && promoBanners.length > 0 ? (
            <div
              onClick={() => handleBannerClick(promoBanners[0])}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleBannerClick(promoBanners[0]);
                }
              }}
              className="group relative w-full min-h-[240px] border border-[var(--color-border)] bg-neutral-950 text-white flex items-center overflow-hidden cursor-pointer"
            >
              {promoBanners[0].imageUrl && (
                <img
                  src={promoBanners[0].imageUrl}
                  alt={promoBanners[0].title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
                />
              )}
              <div className="relative z-10 p-8 md:p-12 max-w-2xl space-y-3">
                <span className="atelier-seal">Đặc quyền {siteName}</span>
                <h1 className="font-display text-2xl md:text-4xl font-semibold text-white">
                  {promoBanners[0].title}
                </h1>
                {promoBanners[0].subtitle && (
                  <p className="text-xs md:text-sm text-neutral-300 line-clamp-2">
                    {promoBanners[0].subtitle}
                  </p>
                )}
                {promoBanners[0].buttonText && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-white border-b border-white pb-1">
                      <span>{promoBanners[0].buttonText}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span className="atelier-eyebrow">
                    {siteName} · Voucher Archive
                  </span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                  Đặc quyền ưu đãi Atelier
                </h1>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed font-sans">
                  Lưu trữ các mã ưu đãi may đo từ {siteName} để sử dụng trực tiếp tại bước thanh toán.
                </p>
              </div>
              <div className="h-20 w-20 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                <Ticket className="h-8 w-8 stroke-[1.5]" aria-hidden="true" />
              </div>
            </div>
          ))}

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-4">
            <h2 className="font-display text-xl sm:text-3xl font-extrabold uppercase tracking-tight flex items-center gap-2.5">
              <Ticket className="h-5 w-5" aria-hidden="true" />
              <span>Voucher đang áp dụng</span>
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              {vouchers.length} ưu đãi
            </span>
          </div>

          {loading ? (
            <div
              className="flex flex-col items-center justify-center py-20"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-[var(--color-text)] mb-3"
                aria-hidden="true"
              />
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Đang tải danh sách ưu đãi...
              </p>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] text-center space-y-3 px-4">
              <Ticket
                className="h-10 w-10 text-[var(--color-text-muted)] stroke-[1.5]"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="font-display text-xl font-semibold">
                  Hiện chưa có voucher mới
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Hãy quay lại sau để đón chờ các chương trình ưu đãi tiếp theo.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vouchers.map((v) => {
                const isClaimed = claimedIds.includes(v._id);
                const percentClaimed = Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      ((v.totalQuantity - v.remainingQuantity) /
                        Math.max(1, v.totalQuantity)) *
                        100
                    )
                  )
                );

                return (
                  <article
                    key={v._id}
                    onClick={() => openDetail(v)}
                    className="group relative atelier-ticket p-6 transition-colors flex flex-col justify-between cursor-pointer min-h-[195px] hover:border-foreground"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                        <Ticket className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1.5 pr-6">
                        <div className="text-[11px] font-mono font-bold border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-0.5 w-fit uppercase tracking-wider">
                          {v.code}
                        </div>
                        <h3 className="font-display text-xl font-bold uppercase tracking-tight line-clamp-1">
                          {v.name}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 font-sans">
                          Đơn tối thiểu:{" "}
                          {v.minOrderValue > 0
                            ? `${v.minOrderValue.toLocaleString("vi-VN")}đ`
                            : "0đ"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-dashed border-[var(--color-border)] flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                          <span>Đã nhận {percentClaimed}%</span>
                          <span>Còn {v.remainingQuantity}</span>
                        </div>
                        <div className="h-1 w-full bg-[var(--color-border)] overflow-hidden">
                          <div
                            className="h-full bg-foreground"
                            style={{ width: `${percentClaimed}%` }}
                          />
                        </div>
                      </div>

                      {isClaimed ? (
                        <button
                          type="button"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[44px] px-4 py-2 border border-border bg-secondary text-muted-foreground text-xs uppercase tracking-[0.16em] font-semibold shrink-0 cursor-not-allowed"
                        >
                          ĐÃ LƯU
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaim(v._id);
                          }}
                          className="min-h-[44px] px-4 py-2 border border-foreground bg-foreground text-background text-xs uppercase tracking-[0.16em] font-semibold shrink-0 hover:bg-background hover:text-foreground transition-all cursor-pointer"
                        >
                          LƯU MÃ
                        </button>
                      )}
                    </div>

                    <div className="absolute right-3.5 top-3.5 text-muted-foreground group-hover:text-foreground">
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </article>
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
