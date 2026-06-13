import { useMemo, useState, useEffect } from "react";
import { useOutletContext, Link, useNavigate, useLocation } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import HeroBanner from "./HeroBanner";
import LookbookSection from "./LookbookSection";
import TrendingProducts from "./TrendingProducts";
import { mockProducts } from "./homeMockData";
import { normalizeProduct, normalizeSearchText } from "./productAdapter";
import "./home.css";

// Lucide icons for voucher display
import { Ticket, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";
import { useAuthStore } from "../../store/auth.store";
import SectionHeader from "./SectionHeader";

const Home = () => {
  const { products: apiProducts, isLoading, error } = useProducts();
  const { homeSearchTerm = "" } = useOutletContext() || {};
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  // Voucher state
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [vouchers, setVouchers] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);

  const normalizedProducts = useMemo(() => {
    const hasApiProducts = Array.isArray(apiProducts) && apiProducts.length > 0;
    const sourceProducts = hasApiProducts ? apiProducts : mockProducts;

    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, !hasApiProducts),
    );
  }, [apiProducts]);

  const filteredProducts = useMemo(() => {
    const keyword = normalizeSearchText(homeSearchTerm);

    if (!keyword) return normalizedProducts;

    return normalizedProducts.filter((product) =>
      [product.name, product.category, product.description].some((value) =>
        normalizeSearchText(value).includes(keyword),
      ),
    );
  }, [normalizedProducts, homeSearchTerm]);

  const toggleFavorite = (productId) => {
    setFavoriteIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(productId)) {
        nextIds.delete(productId);
      } else {
        nextIds.add(productId);
      }

      return nextIds;
    });
  };

  const fetchVouchers = async () => {
    try {
      setVouchersLoading(true);
      const res = await voucherApi.getPublicVouchers();
      if (res.success) {
        // Show top 3 hot vouchers on the homepage
        setVouchers(res.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Lỗi khi tải voucher trang chủ:", err);
    } finally {
      setVouchersLoading(false);
    }
  };

  const fetchUserWallet = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await voucherApi.getUserWallet();
      if (res.success) {
        const ids = res.data.map((item) => item.voucherId?._id || item.voucherId);
        setClaimedIds(ids.filter(Boolean));
      }
    } catch (err) {
      console.error("Lỗi khi tải ví voucher:", err);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchUserWallet();
  }, [isAuthenticated]);

  const handleClaim = async (voucherId) => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để lưu mã giảm giá!");
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      const res = await voucherApi.claimVoucher(voucherId);
      if (res.success) {
        toast.success("Đã lưu voucher vào ví cá nhân! 🎉");
        setClaimedIds([...claimedIds, voucherId]);
        fetchVouchers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lưu mã thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <div className="home-page">
      <div className="home-page__container">
        <HeroBanner />

        <TrendingProducts
          products={filteredProducts.slice(0, 8)}
          isLoading={isLoading}
          hasError={Boolean(error)}
          isUsingFallback={
            !isLoading && (!Array.isArray(apiProducts) || apiProducts.length === 0)
          }
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />

        <LookbookSection />

        {/* Hot Vouchers Section */}
        {!homeSearchTerm && (
          <section className="home-section home-vouchers mt-8 pt-12 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6">
              <SectionHeader
                eyebrow="Khuyến mãi đặc biệt"
                title="Voucher Hot Hôm Nay"
                subtitle="Nhận ngay ưu đãi đặc biệt trước khi mua sắm"
              />
              <Link
                to="/vouchers"
                className="text-xs font-bold text-amber-700 hover:text-amber-800 transition cursor-pointer"
              >
                Xem tất cả voucher &rarr;
              </Link>
            </div>

            {vouchersLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
              </div>
            ) : vouchers.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
                <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">Hiện chưa có voucher hot công khai</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vouchers.map((v) => {
                  const isClaimed = claimedIds.includes(v._id);
                  const percentRemaining = Math.round((v.remainingQuantity / v.totalQuantity) * 100);

                  return (
                    <div
                      key={v._id}
                      className="group relative bg-[#faf9f6] border border-[#e8e5df] rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden min-h-[175px]"
                    >
                      {/* Left & Right ticket notches */}
                      <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-r border-[#e8e5df] z-10"></div>
                      <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border-l border-[#e8e5df] z-10"></div>

                      <div className="flex gap-3">
                        <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                          <Ticket className="h-5.5 w-5.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded w-fit uppercase">
                            {v.code}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 truncate mt-1">
                            {v.name}
                          </h4>
                          <p className="text-[11px] text-gray-550 mt-0.5 truncate">
                            {v.description || `Giảm ${v.discountType === "percentage" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}đ`}`}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Đơn tối thiểu: {v.minOrderValue.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
                            <span>Còn lại {percentRemaining}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-600 rounded-full"
                              style={{ width: `${percentRemaining}%` }}
                            ></div>
                          </div>
                        </div>

                        {isClaimed ? (
                          <button
                            disabled
                            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg cursor-not-allowed border border-emerald-100 whitespace-nowrap"
                          >
                            Đã Lưu
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaim(v._id)}
                            className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold rounded-lg shadow-sm hover:scale-102 transition cursor-pointer whitespace-nowrap"
                          >
                            Lưu Mã
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
