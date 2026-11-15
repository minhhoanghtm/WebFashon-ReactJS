import React, { useState } from "react";
import { Scissors, X, Check, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

export function SmartSizeAssistantModal({ isOpen, onClose, onSelectSize, currentSelectedSize }) {
  const [height, setHeight] = useState("172");
  const [weight, setWeight] = useState("64");
  const [bodyType, setBodyType] = useState("balanced"); // "slim" | "balanced" | "curvy"
  const [fitPref, setFitPref] = useState("regular"); // "slim" | "regular" | "relaxed"
  const [isCalculated, setIsCalculated] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  if (!isOpen) return null;

  const calculateSize = (e) => {
    e.preventDefault();
    const h = parseFloat(height) || 170;
    const w = parseFloat(weight) || 60;

    // BMI Calculation
    const bmi = w / ((h / 100) * (h / 100));
    let baseSize = "M";

    if (h < 160) {
      baseSize = w < 50 ? "XS" : "S";
    } else if (h <= 168) {
      if (w < 52) baseSize = "S";
      else if (w <= 62) baseSize = "M";
      else baseSize = "L";
    } else if (h <= 178) {
      if (w < 60) baseSize = "M";
      else if (w <= 72) baseSize = "L";
      else baseSize = "XL";
    } else {
      if (w < 70) baseSize = "L";
      else if (w <= 84) baseSize = "XL";
      else baseSize = "XXL";
    }

    // Adjust for fit preference
    const sizeHierarchy = ["XS", "S", "M", "L", "XL", "XXL"];
    let idx = sizeHierarchy.indexOf(baseSize);

    if (fitPref === "relaxed" && idx < sizeHierarchy.length - 1) {
      idx += 1;
    } else if (fitPref === "slim" && idx > 0) {
      idx -= 1;
    }

    const finalSize = sizeHierarchy[idx];

    // Estimated measurements
    const estChest = Math.round(w * 1.35);
    const estWaist = Math.round(w * 1.15);

    setRecommendation({
      size: finalSize,
      confidence: 96,
      bmi: bmi.toFixed(1),
      chest: estChest,
      waist: estWaist,
      advice:
        fitPref === "relaxed"
          ? "Chúng tôi đã tăng thêm 1 size để đảm bảo sự phóng khoáng và độ rủ mềm mại."
          : fitPref === "slim"
          ? "Size này sẽ ôm vừa vặn tôn lên đường nét bờ vai và phần ngực của bạn."
          : "Size chuẩn xác nhất theo tiêu chuẩn may đo tỷ lệ vàng cơ thể người Việt.",
    });

    setIsCalculated(true);
  };

  const handleApply = () => {
    if (recommendation && onSelectSize) {
      onSelectSize(recommendation.size);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#121215] border border-[rgba(244,240,232,0.2)] shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[36px] min-w-[36px] text-[#9a989f] hover:text-white flex items-center justify-center"
          aria-label="Đóng bảng tư vấn size"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Scissors size={16} className="text-[#e65100]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
            SMART SIZE & FIT ARCHITECT
          </span>
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8]">
          Tư Vấn Kích Thước May Đo AI
        </h3>
        <p className="text-xs text-[#9a989f] mt-1 mb-6">
          Nhập số đo cơ bản để thuật toán phân tích tỷ lệ nhân trắc học và đưa ra size chuẩn xác nhất.
        </p>

        {!isCalculated ? (
          <form onSubmit={calculateSize} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block mb-1.5">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  min="140"
                  max="220"
                  required
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full min-h-[42px] px-3 bg-[#161619] border border-white/10 text-sm font-mono text-[#f4f0e8] focus:border-[#e65100]"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block mb-1.5">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  min="35"
                  max="150"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full min-h-[42px] px-3 bg-[#161619] border border-white/10 text-sm font-mono text-[#f4f0e8] focus:border-[#e65100]"
                />
              </div>
            </div>

            {/* Dáng người */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block mb-1.5">
                Dáng người chủ đạo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "slim", label: "Mảnh mai" },
                  { id: "balanced", label: "Cân đối" },
                  { id: "curvy", label: "Đầy đặn" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBodyType(b.id)}
                    className={`min-h-[38px] text-xs font-display uppercase tracking-wider border transition-colors ${
                      bodyType === b.id
                        ? "border-[#e65100] bg-[rgba(230,81,0,0.15)] text-[#ff6d00] font-bold"
                        : "border-white/10 bg-[#161619] text-[#9a989f] hover:text-white"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gu mặc */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#9a989f] block mb-1.5">
                Sở thích độ rộng trang phục
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "slim", label: "Ôm tôn dáng" },
                  { id: "regular", label: "Vừa vặn chuẩn" },
                  { id: "relaxed", label: "Phóng khoáng" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFitPref(f.id)}
                    className={`min-h-[38px] text-xs font-display uppercase tracking-wider border transition-colors ${
                      fitPref === f.id
                        ? "border-[#e65100] bg-[rgba(230,81,0,0.15)] text-[#ff6d00] font-bold"
                        : "border-white/10 bg-[#161619] text-[#9a989f] hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <Button variant="secondary" size="md" type="button" onClick={onClose}>
                Hủy Bỏ
              </Button>
              <Button variant="signal" size="md" type="submit" data-testid="size-calc-btn" className="gap-2">
                <Sparkles size={14} />
                <span>Tính Size Ngay</span>
              </Button>
            </div>
          </form>
        ) : (
          <div data-testid="size-result-box" className="space-y-6 animate-fade-in">
            <div className="p-5 bg-[#161619] border border-[#e65100]/40 text-center relative">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9a989f] block mb-1">
                KÍCH THƯỚC ĐƯỢC ĐỀ XUẤT CHO BẠN
              </span>
              <div className="flex items-center justify-center gap-3 my-2">
                <span className="font-display text-5xl font-black text-[#e65100]">
                  SIZE {recommendation.size}
                </span>
                <span className="px-2.5 py-1 text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {recommendation.confidence}% Phù Hợp
                </span>
              </div>
              <p className="text-xs text-[#f4f0e8]/90 max-w-sm mx-auto leading-relaxed mt-2">
                {recommendation.advice}
              </p>

              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-mono text-[#9a989f]">
                <div>Ước tính vòng ngực: <strong className="text-white">{recommendation.chest} cm</strong></div>
                <div>Ước tính vòng eo: <strong className="text-white">{recommendation.waist} cm</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCalculated(false)}
                className="text-xs font-mono text-[#9a989f] hover:text-[#f4f0e8]"
              >
                Nhập lại số đo
              </button>

              <div className="flex gap-3">
                <Button variant="secondary" size="md" onClick={onClose}>
                  Đóng
                </Button>
                <Button
                  variant="signal"
                  size="md"
                  data-testid="size-apply-btn"
                  onClick={handleApply}
                  className="gap-2"
                >
                  <Check size={14} />
                  <span>Chọn Size {recommendation.size} Này</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
