import React, { useState, useEffect, useRef } from "react";
import { X, Shield, BarChart3, Sparkles, Megaphone, Check } from "lucide-react";
import { useConsent } from "@/context/ConsentContext";

export const PrivacyPreferencesModal = () => {
  const {
    isPreferencesOpen,
    closePreferences,
    consentState,
    saveCustom,
    acceptEssentialOnly,
    acceptAll,
  } = useConsent();

  const [categories, setCategories] = useState({
    necessary: true,
    analytics: false,
    personalization: false,
    marketing: false,
  });

  const modalRef = useRef(null);
  const initialFocusRef = useRef(null);

  // Khôi phục toggles theo trạng thái đã lưu khi mở modal
  useEffect(() => {
    if (isPreferencesOpen) {
      setCategories({
        necessary: true,
        analytics: Boolean(consentState.categories?.analytics),
        personalization: Boolean(consentState.categories?.personalization),
        marketing: Boolean(consentState.categories?.marketing),
      });

      // Accessible Focus Management
      setTimeout(() => {
        if (initialFocusRef.current) {
          initialFocusRef.current.focus();
        }
      }, 50);
    }
  }, [isPreferencesOpen, consentState]);

  // Xử lý Escape key để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isPreferencesOpen) {
        closePreferences();
      }
    };
    if (isPreferencesOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Ngăn chặn cuộn trang phía sau modal
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isPreferencesOpen, closePreferences]);

  if (!isPreferencesOpen) return null;

  const handleToggle = (key) => {
    if (key === "necessary") return; // Cookie cần thiết không được tắt
    setCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    saveCustom(categories);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePreferences();
      }}
    >
      <div
        ref={modalRef}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-white/15 bg-[#0C0C0E] text-[#F5F4F0] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-white/80" />
            <h2 id="privacy-modal-title" className="text-base sm:text-lg font-medium tracking-tight text-white">
              Tùy chọn quyền riêng tư
            </h2>
          </div>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={closePreferences}
            aria-label="Đóng bảng tùy chọn"
            className="touch-target flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4 text-xs sm:text-sm">
          <p className="text-xs leading-relaxed text-[#9E9EA8]">
            Tại 404 Studio, chúng tôi tôn trọng quyền kiểm soát dữ liệu của bạn. Dưới đây là các danh mục cookie và dữ liệu được sử dụng trên hệ thống. Bạn có thể bật hoặc tắt từng nhóm tùy theo nhu cầu.
          </p>

          <div className="space-y-3 pt-2">
            {/* 1. Cookie cần thiết */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-4.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white shrink-0">
                    <Shield size={14} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm">Cookie cần thiết</h3>
                    <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded mt-0.5">
                      Bắt buộc
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <div
                    aria-disabled="true"
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-white/40 transition-colors"
                  >
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0" />
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-[#9E9EA8]">
                Bắt buộc để vận hành website như xác thực đăng nhập, giỏ hàng, thanh toán an toàn, giữ hàng tồn kho (Redis Reservation 300s) và chống tấn công CSRF. Không thể vô hiệu hóa.
              </p>
            </div>

            {/* 2. Phân tích và thống kê */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-4.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white shrink-0">
                    <BarChart3 size={14} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm">Phân tích và thống kê (Analytics)</h3>
                    <span className="inline-block text-[10px] uppercase font-medium tracking-wider text-white/60 bg-white/10 px-1.5 py-0.5 rounded mt-0.5">
                      Tùy chọn
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={categories.analytics}
                  id="toggle-analytics"
                  onClick={() => handleToggle("analytics")}
                  className={`touch-target relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    categories.analytics ? "bg-white" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full transition-transform shadow-sm ${
                      categories.analytics ? "translate-x-5 bg-black" : "translate-x-0 bg-white/80"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-[#9E9EA8]">
                Ghi nhận số lượt xem trang, tương tác sản phẩm và thời gian hoạt động để cải thiện tốc độ và trải nghiệm người dùng. Dữ liệu hoàn toàn bảo mật và không thu thập thông tin nhạy cảm.
              </p>
            </div>

            {/* 3. Cá nhân hóa trải nghiệm */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-4.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white shrink-0">
                    <Sparkles size={14} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm">Cá nhân hóa trải nghiệm (Personalization)</h3>
                    <span className="inline-block text-[10px] uppercase font-medium tracking-wider text-white/60 bg-white/10 px-1.5 py-0.5 rounded mt-0.5">
                      Tùy chọn
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={categories.personalization}
                  id="toggle-personalization"
                  onClick={() => handleToggle("personalization")}
                  className={`touch-target relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    categories.personalization ? "bg-white" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full transition-transform shadow-sm ${
                      categories.personalization ? "translate-x-5 bg-black" : "translate-x-0 bg-white/80"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-[#9E9EA8]">
                Sử dụng thuật toán AI Recommendation để gợi ý trang phục và phụ kiện đúng gu thời trang của bạn. Khi tắt mục này, bạn vẫn nhận được gợi ý sản phẩm phổ biến và tìm kiếm bình thường.
              </p>
            </div>

            {/* 4. Marketing */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-4.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white shrink-0">
                    <Megaphone size={14} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm">Marketing & Truyền thông</h3>
                    <span className="inline-block text-[10px] uppercase font-medium tracking-wider text-white/60 bg-white/10 px-1.5 py-0.5 rounded mt-0.5">
                      Tùy chọn
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={categories.marketing}
                  id="toggle-marketing"
                  onClick={() => handleToggle("marketing")}
                  className={`touch-target relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    categories.marketing ? "bg-white" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full transition-transform shadow-sm ${
                      categories.marketing ? "translate-x-5 bg-black" : "translate-x-0 bg-white/80"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] sm:text-xs leading-relaxed text-[#9E9EA8]">
                Đo lường hiệu quả các chiến dịch tiếp thị và phân phối ưu đãi mùa mới. Chúng tôi cam kết tuyệt đối không bán hoặc trao đổi dữ liệu cá nhân cho bên thứ ba.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-white/10 bg-[#0A0A0C] px-5 py-4 sm:px-6">
          <button
            type="button"
            id="modal-reject-all-btn"
            onClick={acceptEssentialOnly}
            className="touch-target inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/20 bg-transparent px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors"
          >
            Từ chối không thiết yếu
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              id="modal-save-custom-btn"
              onClick={handleSave}
              className="touch-target inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <span>Lưu lựa chọn</span>
            </button>

            <button
              type="button"
              id="modal-accept-all-btn"
              onClick={acceptAll}
              className="touch-target inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#F5F4F0] px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-[#0C0C0E] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>Chấp nhận tất cả</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPreferencesModal;
