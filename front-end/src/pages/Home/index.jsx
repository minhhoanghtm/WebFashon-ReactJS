import { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import HeroBanner from "./HeroBanner";
import LookbookSection from "./LookbookSection";
import TrendingProducts from "./TrendingProducts";
import PromotionBannerSection from "./PromotionBannerSection";
import CategoryShowcase from "./CategoryShowcase";
import VoucherSection from "./VoucherSection";
import { normalizeProduct, normalizeSearchText } from "./productAdapter";
import "./home.css";

import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";
import { useAuthStore } from "../../store/auth.store";

const Home = () => {
  const { products: apiProducts, isLoading, error } = useProducts();
  const { homeSearchTerm = "" } = useOutletContext() || {};
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [vouchers, setVouchers] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);

  const normalizedProducts = useMemo(() => {
    const sourceProducts = Array.isArray(apiProducts) ? apiProducts : [];
    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, false),
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
        {/* 1. Hero Banner */}
        <HeroBanner />

        {/* 2. Featured Products */}
        <TrendingProducts
          products={filteredProducts}
          limit={8}
          isLoading={isLoading}
          hasError={Boolean(error)}
          isUsingFallback={
            !isLoading && (!Array.isArray(apiProducts) || apiProducts.length === 0)
          }
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />

        {/* 3. Sale Banner */}
        <PromotionBannerSection />

        {/* 4. Category Showcase */}
        <CategoryShowcase />

        {/* 5. Voucher Hot Hôm Nay */}
        <VoucherSection
          vouchers={vouchers}
          claimedIds={claimedIds}
          loading={vouchersLoading}
          onClaim={handleClaim}
          homeSearchTerm={homeSearchTerm}
        />

        {/* 6. Lookbook / Style Suggestion */}
        <LookbookSection />
      </div>
    </div>
  );
};

export default Home;