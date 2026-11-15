import React, { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "../ui/Button";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("webfashion_cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("webfashion_cookie_consent", "granted");
    setIsVisible(false);
    // Optional notify API
    fetch("http://localhost:5000/api/privacy/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "granted", categories: ["analytics", "essential"] }),
    }).catch(() => {});
  };

  const handleDecline = () => {
    localStorage.setItem("webfashion_cookie_consent", "denied");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Thông báo bảo mật Cookie"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 bg-[#161619] border border-[rgba(244,240,232,0.15)] shadow-2xl p-5 animate-fade-in"
    >
      <div className="flex items-start gap-3.5 mb-3">
        <ShieldCheck className="text-[#e65100] shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-display text-xs tracking-wider uppercase text-[#f4f0e8] mb-1">
            Quyền riêng tư & Cookie
          </h4>
          <p className="text-xs text-[#9a989f] leading-relaxed">
            Chúng tôi sử dụng cookies nhằm đảm bảo hiệu năng giỏ hàng và cá nhân hóa trải nghiệm may đo.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[rgba(244,240,232,0.1)]">
        <Button variant="ghost" size="sm" onClick={handleDecline}>
          Từ chối
        </Button>
        <Button variant="signal" size="sm" onClick={handleAccept}>
          Chấp thuận
        </Button>
      </div>
    </aside>
  );
}
