import React, { useState } from "react";
import { Mail, Check, ArrowRight, ShieldCheck, Sparkles, Copy } from "lucide-react";
import { Button } from "../ui/Button";

export function VipNewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setIsSubmitted(true);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("VIPATELIER10");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#121215] to-[#0c0c0e] border-b border-[rgba(244,240,232,0.1)]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(230,81,0,0.12)] border border-[rgba(230,81,0,0.3)] text-[#ff6d00] text-xs font-mono tracking-widest uppercase">
          <Sparkles size={13} />
          <span>ATELIER VIP PRIVILEGE CLUB</span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#f4f0e8]">
          GIA NHẬP CỘNG ĐỒNG MAY ĐO ĐỘC BẢN
        </h2>

        <p className="text-xs sm:text-sm text-[#9a989f] max-w-xl mx-auto leading-relaxed">
          Đăng ký để nhận quyền tiếp cận sớm (Early Access) các đợt ra mắt bộ sưu tập giới hạn, thư mời tham dự Trunk Show và nhận ngay mã ưu đãi 10% cho đơn hàng đầu tiên.
        </p>

        {isSubmitted ? (
          <div className="p-6 bg-[#161619] border border-[#e65100]/60 max-w-md mx-auto space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Check size={22} />
            </div>
            <div>
              <h4 className="font-display text-base font-bold text-[#f4f0e8] uppercase">
                Chào Mừng Bạn Đến Với Atelier VIP!
              </h4>
              <p className="text-xs text-[#9a989f] mt-1">
                Mã ưu đãi 10% đặc quyền đã được kích hoạt cho tài khoản {email}:
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-[#0c0c0e] border border-white/10 font-mono text-sm text-[#ff6d00] font-bold">
              <span>VIPATELIER10</span>
              <button
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                title="Sao chép mã"
              >
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email của bạn..."
                aria-label="Địa chỉ email đăng ký VIP"
                className="w-full min-h-[46px] pl-10 pr-4 bg-[#161619] border border-[rgba(244,240,232,0.15)] focus:border-[#e65100] text-xs text-[#f4f0e8] placeholder-[#6b6973] transition-colors"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6973]" size={16} />
            </div>
            <Button type="submit" variant="signal" size="md" className="shrink-0 gap-2 min-h-[46px]">
              <span>Đăng Ký VIP</span>
              <ArrowRight size={14} />
            </Button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[11px] font-mono text-[#9a989f]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#e65100]" />
            Bảo mật thông tin tuyệt đối
          </span>
          <span>•</span>
          <span>Không gửi thư rác quảng cáo</span>
          <span>•</span>
          <span>Hủy đăng ký bất kỳ lúc nào</span>
        </div>
      </div>
    </section>
  );
}
