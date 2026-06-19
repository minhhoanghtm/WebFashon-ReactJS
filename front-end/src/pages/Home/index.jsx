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
import { useFavoriteStore } from "@/store/favorite.store";
import { getAllCategoriesService } from "@/services/category.service";
import "./home.css";

import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";
import { useAuthStore } from "../../store/auth.store";

const Home = () => {
  const { products: apiProducts, isLoading, error } = useProducts();
  const { homeSearchTerm = "" } = useOutletContext() || {};
  const favoriteItems = useFavoriteStore((state) => state.items);
  const toggleFavorite = useFavoriteStore((state) => state.toggleProduct);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [vouchers, setVouchers] = useState([]);
  const [claimedIds, setClaimedIds] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => String(item.id))),
    [favoriteItems],
  );

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(false);
      const data = await getAllCategoriesService();
      setCategories(data || []);
    } catch (err) {
      console.error("Lỗi khi nạp danh mục trang chủ:", err);
      setCategoriesError(true);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      categories
        .filter((cat) => cat?._id && cat?.name)
        .map((cat) => [String(cat._id), cat.name]),
    );
  }, [categories]);

  const normalizedProducts = useMemo(() => {
    const sourceProducts = Array.isArray(apiProducts) ? apiProducts : [];
    return sourceProducts.map((product, index) =>
      normalizeProduct(product, index, categoryMap, false),
    );
  }, [apiProducts, categoryMap]);

  const filteredProducts = useMemo(() => {
    let result = normalizedProducts;

    const keyword = normalizeSearchText(homeSearchTerm);
    if (keyword) {
      result = result.filter((product) =>
        [product.name, product.category, product.description].some((value) =>
          normalizeSearchText(value).includes(keyword),
        ),
      );
    }

    if (selectedCategoryId && selectedCategoryId !== "all") {
      result = result.filter((product) => {
        const prodCatId = String(product.category_id || "");
        return prodCatId === String(selectedCategoryId);
      });
    }

    return result;
  }, [normalizedProducts, homeSearchTerm, selectedCategoryId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, []);

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

        {/* 2. Product Categories */}
        <CategoryShowcase
          categories={categories}
          loading={categoriesLoading}
          error={categoriesError}
          onRetry={fetchCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* 3. Featured Products */}
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
          title={
            selectedCategoryId === "all"
              ? "Sản phẩm nổi bật"
              : categoryMap[selectedCategoryId] || "Sản phẩm nổi bật"
          }
        />

        {/* 4. Voucher / Flash Sale Banner */}
        <PromotionBannerSection />

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
