import RecommendedSection from "./RecommendedSection";
import { useMemo, useState, useEffect, useLayoutEffect, useRef } from "react";
import { useOutletContext, useNavigate, useLocation } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import HeroBanner from "./HeroBanner";
import InteractiveTypographySection from "./InteractiveTypographySection";
import DraggableCollectionsGallery from "./DraggableCollectionsGallery";
import BrandIntroductionEditorial from "./BrandIntroductionEditorial";
import FlashSaleSection from "./FlashSaleSection";
import LookbookSection from "./LookbookSection";
import TrendingProducts from "./TrendingProducts";
import PromotionBannerSection from "./PromotionBannerSection";
import CategoryShowcase from "./CategoryShowcase";
import VoucherSection from "./VoucherSection";
import SectionErrorBoundary from "@/components/common/SectionErrorBoundary";
import { normalizeProduct, normalizeSearchText } from "./productAdapter";
import { useFavoriteStore } from "@/store/favorite.store";
import { getAllCategoriesService } from "@/services/category.service";
import "./home.css";

import { toast } from "react-toastify";
import voucherApi from "../../api/voucher.api";
import { useAuthStore } from "../../store/auth.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


const Home = () => {
  const homeRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  useDocumentTitle("Trang chủ");
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
    let timeoutId;
    try {
      setCategoriesLoading(true);
      setCategoriesError(false);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Categories timeout")), 8000);
      });
      const data = await Promise.race([getAllCategoriesService(), timeoutPromise]);
      setCategories(data || []);
    } catch (err) {
      console.error("Lỗi khi nạp danh mục trang chủ:", err);
      setCategoriesError(true);
    } finally {
      clearTimeout(timeoutId);
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
    const hasApiProducts = Array.isArray(apiProducts) && apiProducts.length > 0;
    if (hasApiProducts) {
      return apiProducts.map((product, index) =>
        normalizeProduct(product, index, categoryMap),
      );
    }
    return [];
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
    let timeoutId;
    try {
      setVouchersLoading(true);
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Vouchers timeout")), 8000);
      });
      const res = await Promise.race([voucherApi.getPublicVouchers(), timeoutPromise]);
      if (res?.success && Array.isArray(res?.data)) {
        setVouchers(res.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Lỗi khi tải voucher trang chủ:", err);
    } finally {
      clearTimeout(timeoutId);
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

  // ScrollTrigger is limited to the home page so route changes cannot leave stale triggers behind.
  useLayoutEffect(() => {
    if (prefersReduced || !homeRef.current) return undefined;
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      const sections = gsap.utils.toArray(".home-section");
      sections.forEach((section) => {
        const heading = section.querySelector(".home-section-header");
        if (!heading) return;
        gsap.from(heading, {
          autoAlpha: 0,
          y: 22,
          duration: 0.62,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 82%", toggleActions: "play none none reverse" },
        });
      });

      gsap.to(".ambient-blob-terracotta", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: { trigger: homeRef.current, start: "top top", end: "bottom bottom", scrub: 1 },
      });
    }, homeRef);
    return () => context.revert();
  }, [prefersReduced]);

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
    <div ref={homeRef} className="home-page relative overflow-hidden">
      {/* Cinematic Ambient Background Blobs */}
      <div className="ambient-blob-terracotta top-[18%] -left-32" aria-hidden="true" />
      <div className="ambient-blob-stone top-[45%] -right-40" aria-hidden="true" />
      <div className="ambient-blob-terracotta top-[72%] -left-20" aria-hidden="true" />

      {/* Subtle Film Grain Noise Overlay */}
      <div className="editorial-grain-overlay absolute inset-0 z-0 pointer-events-none" aria-hidden="true" />

      <div className="home-page__container relative z-10">
        {/* 1. Fashion Editorial Hero 2D */}
        <SectionErrorBoundary name="Hero Banner">
          <HeroBanner />
        </SectionErrorBoundary>

        {/* 2. Interactive Typography Section */}
        <SectionErrorBoundary name="Interactive Typography">
          <InteractiveTypographySection />
        </SectionErrorBoundary>

        {/* 3. Featured Collections: Horizontal Draggable Gallery */}
        <SectionErrorBoundary name="Bộ sưu tập nổi bật">
          <DraggableCollectionsGallery />
        </SectionErrorBoundary>

        {/* 4. Brand Introduction: Editorial Asymmetrical Layout */}
        <SectionErrorBoundary name="Giới thiệu thương hiệu">
          <BrandIntroductionEditorial />
        </SectionErrorBoundary>

        {/* 5. Flash Sale Giờ Vàng */}
        <SectionErrorBoundary name="Flash Sale">
          <FlashSaleSection
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        </SectionErrorBoundary>

        {/* 7. Product Categories */}
        <SectionErrorBoundary name="Danh mục sản phẩm">
          <CategoryShowcase
            categories={categories}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={fetchCategories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </SectionErrorBoundary>

        {/* 8. Featured Products / New Arrivals */}
        <SectionErrorBoundary name="Sản phẩm nổi bật">
          <TrendingProducts
            products={filteredProducts}
            limit={8}
            isLoading={isLoading}
            hasError={Boolean(error)}
            isUsingFallback={false}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            title={
              selectedCategoryId === "all"
                ? "Sản phẩm nổi bật"
                : categoryMap[selectedCategoryId] || "Sản phẩm nổi bật"
            }
          />
        </SectionErrorBoundary>

        {/* 9. Đề xuất Cá nhân hóa: Dành cho bạn */}
        <SectionErrorBoundary name="Gợi ý dành cho bạn">
          <RecommendedSection
            categoryMap={categoryMap}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        </SectionErrorBoundary>

        {/* 10. Voucher / Promotion Banner */}
        <SectionErrorBoundary name="Banner khuyến mãi">
          <PromotionBannerSection />
        </SectionErrorBoundary>

        {/* 11. Voucher Hot Hôm Nay */}
        <SectionErrorBoundary name="Voucher ưu đãi">
          <VoucherSection
            vouchers={vouchers}
            claimedIds={claimedIds}
            loading={vouchersLoading}
            onClaim={handleClaim}
            homeSearchTerm={homeSearchTerm}
          />
        </SectionErrorBoundary>

        {/* 12. Lookbook / Style Stories */}
        <SectionErrorBoundary name="Lookbook">
          <LookbookSection />
        </SectionErrorBoundary>

        {/* 13. Editorial Marquee Ribbon */}
        <div className="mt-20 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden py-6 border-y border-[#062D22]/15 bg-[#062D22] text-[#F7F6F1] select-none">
          <div className="editorial-marquee-track flex items-center gap-12 text-xs sm:text-sm font-extrabold uppercase tracking-[0.28em]">
            <span>404STUDIO · DIGITAL FASHION ATELIER</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>CRAFTED FOR THE UNCONVENTIONAL</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>BEYOND THE ORDINARY</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>CONTEMPORARY VIETNAMESE TAILORING</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>EST. 2026 · HANOI / SAIGON</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>404STUDIO · DIGITAL FASHION ATELIER</span>
            <span className="text-[#F5DD20]">✦</span>
            <span>CRAFTED FOR THE UNCONVENTIONAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
