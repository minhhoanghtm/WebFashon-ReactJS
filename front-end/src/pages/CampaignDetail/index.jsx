import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Zap, Clock, Calendar, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import campaignApi from "@/api/campaignApi";
import useServerCountdown from "@/hooks/useServerCountdown";
import { useFavoriteStore } from "@/store/favorite.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const CampaignDetail = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);
  const favoriteIds = new Set(favoriteItems.map((item) => String(item.id)));

  useDocumentTitle(data?.campaign?.name || "Chiến dịch ưu đãi");

  const fetchCampaignDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await campaignApi.getCampaignBySlug(slug, { page, limit });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết chiến dịch:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, page]);

  useEffect(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  const handleCountdownEnd = useCallback(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  const countdown = useServerCountdown(
    data?.campaign?.endAt,
    data?.serverTime,
    handleCountdownEnd
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-sm font-semibold text-neutral-600">Đang tải chiến dịch ưu đãi...</p>
      </div>
    );
  }

  if (!data || !data.campaign) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
          <Zap size={32} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Chiến dịch không tồn tại</h2>
        <p className="text-neutral-500 max-w-md">
          Chương trình ưu đãi này có thể đã kết thúc hoặc đường dẫn không chính xác.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-neutral-800 transition"
        >
          <ArrowLeft size={18} />
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  const { campaign, products = [], pagination } = data;
  const isFlashSale = campaign.type === "flash_sale";
  const isEnded = countdown.isEnded || campaign.status === "ended";

  const formatNumber = (num) => String(num || 0).padStart(2, "0");

  return (
    <div className="bg-[#FBF9F5] min-h-screen pb-16 select-none">
      {/* Campaign Header / Hero */}
      <div
        className="w-full py-16 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden bg-[#05251C] border-b border-[#073D2A]"
      >
        <div className="max-w-[1536px] mx-auto relative z-10">
          {/* Breadcrumb back */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FBF9F5]/80 hover:text-[#F5DD20] bg-[#073D2A] border border-[#FBF9F5]/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm transition"
          >
            <ArrowLeft size={14} />
            <span>Trang chủ Atelier</span>
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#073D2A] border border-[#FBF9F5]/20 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.25em] text-[#F5DD20] mb-4">
                {isFlashSale ? <Zap size={14} fill="currentColor" /> : <Sparkles size={14} />}
                <span>{isFlashSale ? "Flash Sale Giờ Vàng" : "Chiến Dịch Mùa Đặc Biệt"}</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#FBF9F5] mb-4 font-display uppercase leading-[0.92]">
                {campaign.name}
              </h1>
              <p className="text-[#D1D9CF] text-xs sm:text-sm max-w-2xl leading-relaxed">
                Cơ hội sở hữu những thiết kế may đo độc bản tại 404Studio với chính sách ưu đãi độc quyền. Số lượng phát hành giới hạn!
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-[#073D2A]/80 backdrop-blur-md border border-[#FBF9F5]/20 p-6 rounded-3xl min-w-[300px] shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F5DD20] mb-4 uppercase tracking-[0.2em]">
                <Clock size={16} />
                <span>{isEnded ? "Chiến dịch đã kết thúc" : "Thời gian còn lại:"}</span>
              </div>

              {!isEnded ? (
                <div className="grid grid-cols-4 gap-2 text-center font-display font-black text-[#05251C]">
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <span className="text-xl sm:text-2xl">{formatNumber(countdown.days)}</span>
                    <span className="block text-[9px] text-[#6B716E] font-sans font-bold uppercase mt-0.5">Ngày</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <span className="text-xl sm:text-2xl">{formatNumber(countdown.hours)}</span>
                    <span className="block text-[9px] text-[#6B716E] font-sans font-bold uppercase mt-0.5">Giờ</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <span className="text-xl sm:text-2xl">{formatNumber(countdown.minutes)}</span>
                    <span className="block text-[9px] text-[#6B716E] font-sans font-bold uppercase mt-0.5">Phút</span>
                  </div>
                  <div className="bg-[#F5DD20] p-3 rounded-2xl shadow-sm">
                    <span className="text-xl sm:text-2xl text-[#05251C]">{formatNumber(countdown.seconds)}</span>
                    <span className="block text-[9px] text-[#05251C]/70 font-sans font-bold uppercase mt-0.5">Giây</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 text-center py-3 rounded-2xl text-sm font-semibold text-white/90">
                  Chương trình đã khép lại. Cảm ơn bạn đã quan tâm!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Grid */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Danh sách sản phẩm ưu đãi
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Hiển thị {products.length} trên tổng số {pagination?.total || 0} sản phẩm
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-neutral-500 shadow-sm border border-neutral-100">
            <Zap className="mx-auto w-12 h-12 text-neutral-300 mb-3" />
            <p className="font-semibold">Chưa có sản phẩm nào trong chiến dịch này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod._id || prod.id}
                product={prod}
                isFavorite={favoriteIds.has(String(prod._id || prod.id))}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition"
            >
              Trang trước
            </button>
            <span className="text-sm font-semibold text-neutral-600 px-3">
              Trang {page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;

