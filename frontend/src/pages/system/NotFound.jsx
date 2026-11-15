import React from "react";
import { Link } from "react-router-dom";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 text-center">
      <div className="max-w-md space-y-6 bg-[#121215] border border-[rgba(244,240,232,0.12)] p-8 sm:p-12 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 mx-auto bg-[#e65100]/15 border border-[#e65100]/40 flex items-center justify-center text-[#ff6d00]">
          <Compass size={32} />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
            MÃ LỖI 404
          </span>
          <h1 className="font-display text-3xl font-bold uppercase text-[#f4f0e8]">
            Trang Không Tồn Tại
          </h1>
          <p className="text-xs text-[#9a989f] leading-relaxed">
            Đường dẫn quý khách đang tìm kiếm có thể đã được thay đổi hoặc chưa từng tồn tại trên hệ thống Atelier.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/">
            <Button variant="signal" size="md" className="gap-2">
              <Home size={16} />
              <span>Về Trang Chủ</span>
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" size="md">
              Xem Bộ Sưu Tập
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
