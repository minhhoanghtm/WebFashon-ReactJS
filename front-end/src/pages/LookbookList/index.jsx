import React, { useState, useEffect, useCallback } from 'react';
import { getLookbooksService } from '../../services/page.service';
import { getActiveBannersService } from '../../services/banner.service';
import LookbookHero from './components/LookbookHero';
import LookbookGrid from './components/LookbookGrid';
import EditorialCard from './components/EditorialCard';
import LookbookSkeleton from './components/LookbookSkeleton';
import LoadMoreButton from './components/LoadMoreButton';
import { RefreshCw } from 'lucide-react';

const LookbookList = () => {
  const [lookbookBanner, setLookbookBanner] = useState(null);
  const [lookbooks, setLookbooks] = useState([]);
  
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  // SEO & Meta Tags Configuration
  useEffect(() => {
    document.title = "Lookbooks - Premium Collection | WebFashion";

    const setMetaTag = (nameOrProperty, content, isProperty = false) => {
      let element = isProperty
        ? document.querySelector(`meta[property="${nameOrProperty}"]`)
        : document.querySelector(`meta[name="${nameOrProperty}"]`);

      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', nameOrProperty);
        } else {
          element.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('description', 'Khám phá bộ sưu tập thời trang cao cấp. Cảm hứng thời trang hiện đại, tối giản.');
    setMetaTag('og:title', 'Lookbooks - Bộ sưu tập thời trang cao cấp', true);
    setMetaTag('og:description', 'Khám phá cảm hứng thời trang mới nhất qua những khung hình đầy nghệ thuật.', true);
    setMetaTag('og:type', 'website', true);
    
    if (lookbookBanner?.imageUrl) {
      setMetaTag('og:image', lookbookBanner.imageUrl, true);
    }
  }, [lookbookBanner]);

  // Load Banner & List Data
  const loadData = useCallback(async () => {
    try {
      setIsLoadingBanner(true);
      setIsLoadingList(true);
      setIsError(false);
      setPage(1);

      // 1. Fetch active banners and find the one with position "home_lookbook"
      let banner = null;
      try {
        const banners = await getActiveBannersService();
        banner = banners.find(b => b.position === "home_lookbook");
        setLookbookBanner(banner || null);
      } catch (err) {
        console.error("Lỗi tải Banner Lookbook:", err);
      } finally {
        setIsLoadingBanner(false);
      }

      // 2. Fetch all published lookbooks (no exclusion)
      const res = await getLookbooksService({
        page: 1,
        limit,
        excludeFeatured: false,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      });

      const items = res.pages || res.items || [];
      setLookbooks(items);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error("Lỗi tải danh sách Lookbook:", error);
      setIsError(true);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Load More Pages
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;

      const res = await getLookbooksService({
        page: nextPage,
        limit,
        excludeFeatured: false,
        sortBy: 'publishedAt',
        sortOrder: 'desc'
      });

      const items = res.pages || res.items || [];
      setLookbooks((prev) => [...prev, ...items]);
      setPage(nextPage);
      setTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error("Lỗi tải thêm Lookbook:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, totalPages, isLoadingMore]);

  // Initial Bootstrapping
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Retry trigger on error state
  const handleRetry = () => {
    loadData();
  };

  const heroImage = lookbookBanner?.imageUrl;
  const heroTitle = lookbookBanner?.title;
  const heroSubtitle = lookbookBanner?.subtitle;

  return (
    <main className="min-h-screen bg-white text-neutral-900 pb-24 font-sans rounded-none">
      {/* 1. Fullscreen Editorial Hero */}
      {!isLoadingBanner && lookbookBanner && heroImage && (
        <LookbookHero 
          image={heroImage} 
          title={heroTitle}
          subtitle={heroSubtitle}
        />
      )}

      {/* Main Content Areas */}
      <div className="max-w-7xl mx-auto rounded-none pt-16">
        {isLoadingList ? (
          <div className="px-6 md:px-12 py-12">
            <LookbookSkeleton count={4} />
          </div>
        ) : isError ? (
          /* Error State with retry option */
          <div className="text-center py-24 px-6 mx-auto max-w-md rounded-none">
            <div className="w-12 h-12 bg-neutral-50 text-neutral-500 rounded-none flex items-center justify-center mx-auto mb-4 border border-neutral-200">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Không thể tải dữ liệu</h3>
            <p className="text-xs text-neutral-500 mt-2 mb-6 leading-relaxed font-light">
              Có lỗi xảy ra khi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền của bạn.
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition cursor-pointer rounded-none"
            >
              Thử lại
            </button>
          </div>
        ) : (lookbooks.length === 0 && !lookbookBanner) ? (
          /* Empty State */
          <div className="text-center py-32 px-6 max-w-lg mx-auto rounded-none">
            <h3 className="text-lg font-medium text-neutral-800 italic mb-2">Chưa có Lookbook nào.</h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Các bộ sưu tập mới đang được chuẩn bị. Vui lòng quay lại sau.
            </p>
          </div>
        ) : (
          /* Lookbooks Listing Grid */
          <>
            {lookbooks.length > 0 && (
              <div className="max-w-7xl mx-auto px-6 md:px-12 pb-8 flex items-center justify-between border-b border-neutral-100 mb-12 rounded-none">
                <h2 
                  className="text-xl md:text-3xl font-semibold uppercase tracking-wide text-neutral-800"
                >
                  Bộ sưu tập
                </h2>
              </div>
            )}
            {lookbooks.length > 0 && (
              <LookbookGrid>
                {lookbooks.map((lookbook) => (
                  <EditorialCard
                    key={lookbook._id}
                    title={lookbook.title}
                    excerpt={lookbook.excerpt}
                    image={lookbook.thumbnailUrl || lookbook.bannerUrl}
                    publishedAt={lookbook.publishedAt || lookbook.createdAt}
                    href={`/lookbooks/${lookbook.slug}`}
                  />
                ))}
              </LookbookGrid>
            )}

            {/* Load More Button Trigger */}
            {lookbooks.length > 0 && (
              <LoadMoreButton
                onClick={handleLoadMore}
                isLoadingMore={isLoadingMore}
                hasMore={page < totalPages}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default LookbookList;
