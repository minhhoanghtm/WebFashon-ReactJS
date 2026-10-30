import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Sparkles, Clock, ArrowRight, Zap, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import campaignApi from "@/api/campaignApi";
import { useServerCountdown } from "@/hooks/useServerCountdown";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";
import defaultCampaignImage from "@/pages/Home/assets/hero-atelier.jpg";

export const EventWelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const modalRef = useRef(null);
  const triggerElementRef = useRef(null);

  // Blacklist routes: Never disturb users during checkout, cart, or authentication
  const isExcludedPath = [
    "/checkout",
    "/cart",
    "/payment-result",
    "/login",
    "/register",
    "/verify-otp",
    "/reset-password",
  ].some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    if (isExcludedPath) return;

    let isMounted = true;
    let timerId = null;

    const checkActiveEvents = async () => {
      try {
        const res = await campaignApi.getActiveCampaigns();
        if (!res.data?.success || !res.data?.data) return;

        const { serverTime: sTime, campaigns = [] } = res.data.data;
        if (!Array.isArray(campaigns) || campaigns.length === 0) return;

        // Sort by highest priority first
        const sorted = [...campaigns].sort((a, b) => (b.priority || 0) - (a.priority || 0));
        const topEvent = sorted[0];

        if (!topEvent || !topEvent.slug) return;

        // Check frequency capping in localStorage (suppress for 24 hours per event)
        const storageKey = `404_dismissed_event_${topEvent.slug}`;
        const lastDismissed = localStorage.getItem(storageKey);
        if (lastDismissed) {
          const dismissedTime = parseInt(lastDismissed, 10);
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (Date.now() - dismissedTime < oneDayMs) {
            return; // User already dismissed this campaign within 24 hours
          }
        }

        if (isMounted) {
          setEventData(topEvent);
          setServerTime(sTime);

          // Graceful 1.5s delay after page load before opening popup
          timerId = setTimeout(() => {
            if (isMounted) {
              triggerElementRef.current = document.activeElement;
              setIsOpen(true);
            }
          }, 1500);
        }
      } catch (err) {
        console.warn("Event welcome popup check:", err);
      }
    };

    checkActiveEvents();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isExcludedPath]);

  const nowMs = serverTime ? new Date(serverTime).getTime() : Date.now();
  const isUpcoming = eventData?.startAt && new Date(eventData.startAt).getTime() > nowMs;
  const targetTime = isUpcoming ? eventData?.startAt : eventData?.endAt;

  // Countdown timer calculation
  const countdown = useServerCountdown(
    targetTime,
    serverTime,
    () => {
      // Auto close or mark ended
    }
  );

  const handleClose = () => {
    setIsOpen(false);
    if (eventData?.slug) {
      try {
        localStorage.setItem(`404_dismissed_event_${eventData.slug}`, Date.now().toString());
      } catch {
        // Handle private browsing storage restrictions
      }
    }
    // Restore focus
    if (triggerElementRef.current && typeof triggerElementRef.current.focus === "function") {
      triggerElementRef.current.focus();
    }
  };

  // Keyboard accessibility: ESC to close and Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }

      // Basic focus trap within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !eventData) return null;

  const campaignImage = eventData.bannerId?.imageUrl || defaultCampaignImage;
  const isFlash = eventData.type === "flash_sale";
  const discountRule = eventData.discountRule;

  const formatNumber = (num) => String(num || 0).padStart(2, "0");

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-welcome-title"
      >
        {/* Dark Editorial Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[#041E17]/80 backdrop-blur-sm cursor-pointer"
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <motion.div
          ref={modalRef}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[820px] bg-white rounded-3xl shadow-[0_25px_60px_rgba(4,30,23,0.35)] border border-[#062D22]/15 overflow-hidden z-10 my-auto text-[#062D22]"
        >
          {/* Close Button Top Right */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-[#062D22] text-[#062D22] hover:text-[#F5DD20] border border-[#062D22]/10 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
            aria-label="Đóng cửa sổ sự kiện"
          >
            <X size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
            {/* Left Column: Fashion Campaign Image */}
            <div className="md:col-span-5 relative bg-[#062D22] overflow-hidden min-h-[220px] md:min-h-full">
              <img
                src={campaignImage}
                alt={eventData.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062D22]/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#062D22]/20" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-mono tracking-widest text-[#F5DD20] uppercase block">
                  {isUpcoming ? "UPCOMING ATELIER DROP" : isFlash ? "FLASH SALE LIMITED" : "SEASONAL ATELIER DROP"}
                </span>
                <span className="text-xs font-bold tracking-wider uppercase opacity-90">
                  404STUDIO · 2026
                </span>
              </div>
            </div>

            {/* Right Column: Event Details & Action */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-[#F7F6F1]">
              <div>
                {/* Event Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#062D22] text-[#F5DD20] text-[10px] font-extrabold tracking-[0.25em] uppercase mb-4 shadow-xs">
                  {isFlash ? <Zap size={11} /> : <Sparkles size={11} />}
                  <span>{isUpcoming ? "SỰ KIỆN SẮP DIỄN RA" : isFlash ? "GIỜ VÀNG GIỚI HẠN" : "SỰ KIỆN ĐẶC BIỆT"}</span>
                </div>

                {/* Event Heading */}
                <h2
                  id="event-welcome-title"
                  className="text-2xl sm:text-3xl font-display font-black text-[#062D22] uppercase tracking-tight leading-tight"
                >
                  {eventData.name}
                </h2>

                {/* Event Description */}
                <p className="mt-3 text-xs sm:text-sm text-[#747974] leading-relaxed">
                  {discountRule
                    ? `Ưu đãi độc quyền ${
                        discountRule.discountType === "percentage"
                          ? `giảm ${discountRule.discountValue}%`
                          : `giảm ${discountRule.discountValue.toLocaleString("vi-VN")}₫`
                      } cho các thiết kế may đo cao cấp.`
                    : "Khám phá ngay bộ sưu tập may đo số lượng giới hạn mới nhất tại 404Studio."}
                </p>

                {/* Countdown Block (if target time is valid) */}
                {targetTime && !countdown.isEnded && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-white border border-[#062D22]/10 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#747974] uppercase tracking-wider mb-2">
                      <Clock size={13} className="text-[#062D22]" />
                      <span>{isUpcoming ? "Sự kiện bắt đầu trong:" : "Thời gian còn lại:"}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-[#062D22] text-white py-1.5 px-1 rounded-xl">
                        <span className="block text-base sm:text-lg font-black font-mono text-[#F5DD20]">
                          {formatNumber(countdown.days)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                          Ngày
                        </span>
                      </div>
                      <div className="bg-[#062D22] text-white py-1.5 px-1 rounded-xl">
                        <span className="block text-base sm:text-lg font-black font-mono text-[#F5DD20]">
                          {formatNumber(countdown.hours)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                          Giờ
                        </span>
                      </div>
                      <div className="bg-[#062D22] text-white py-1.5 px-1 rounded-xl">
                        <span className="block text-base sm:text-lg font-black font-mono text-[#F5DD20]">
                          {formatNumber(countdown.minutes)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                          Phút
                        </span>
                      </div>
                      <div className="bg-[#062D22] text-white py-1.5 px-1 rounded-xl">
                        <span className="block text-base sm:text-lg font-black font-mono text-[#F5DD20]">
                          {formatNumber(countdown.seconds)}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                          Giây
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to={`/campaigns/${eventData.slug}`}
                  onClick={handleClose}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#062D22] text-[#F7F6F1] hover:bg-[#F5DD20] hover:text-[#062D22] font-display text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Khám phá sự kiện</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-[#747974] hover:text-[#062D22] transition-colors cursor-pointer"
                >
                  Để sau
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventWelcomePopup;

