import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, Check, ArrowRight, RotateCcw, Palette, ShieldCheck, Heart } from "lucide-react";
import { usePersonaStore, PERSONA_TYPES } from "../../stores/personaStore";
import { Button } from "../ui/Button";

export function AiStyleQuizModal() {
  const isQuizOpen = usePersonaStore((state) => state.isQuizOpen);
  const closeQuiz = usePersonaStore((state) => state.closeQuiz);
  const currentPersona = usePersonaStore((state) => state.persona);
  const savePersona = usePersonaStore((state) => state.savePersona);
  const clearPersona = usePersonaStore((state) => state.clearPersona);

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [palette, setPalette] = useState("");
  const [silhouette, setSilhouette] = useState("");
  const [budget, setBudget] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultPersonaKey, setResultPersonaKey] = useState(null);

  if (!isQuizOpen) return null;

  const handleFinishQuiz = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Logic mapping based on selections
      let selectedKey = "ARCHIVAL_MINIMALIST";
      if (palette === "earthy" || occasion === "resort") {
        selectedKey = "QUIET_LUXURY_EPICUREAN";
      } else if (silhouette === "oversized" || occasion === "party") {
        selectedKey = "AVANT_GARDE_EXPLORER";
      } else if (occasion === "office" || silhouette === "tailored") {
        selectedKey = "MODERN_SARTORIALIST";
      }

      setResultPersonaKey(selectedKey);
      savePersona(selectedKey, { occasion, palette, silhouette, budget });
      setIsAnalyzing(false);
      setStep(5); // Result step
    }, 1200);
  };

  const activePersona = resultPersonaKey ? PERSONA_TYPES[resultPersonaKey] : currentPersona;

  const resetQuiz = () => {
    setStep(1);
    setOccasion("");
    setPalette("");
    setSilhouette("");
    setBudget("");
    setResultPersonaKey(null);
  };

  return (
    <div data-testid="ai-style-quiz-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#121215] border border-[rgba(244,240,232,0.2)] shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeQuiz}
          data-testid="quiz-close-btn"
          className="absolute top-4 right-4 min-h-[36px] min-w-[36px] text-[#9a989f] hover:text-white flex items-center justify-center"
          aria-label="Đóng bài trắc nghiệm"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-[#e65100]" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#e65100]">
            AI FASHION PERSONA PROFILER
          </span>
        </div>

        {/* STEP 1: Dịp Mặc Thường Xuyên */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-[11px] font-mono text-[#6b6973]">BƯỚC 1 / 4</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8] mt-1">
                Dịp xuất hiện chủ đạo của bạn?
              </h2>
              <p className="text-xs text-[#9a989f] mt-1">
                Giúp thuật toán định hình bối cảnh và phom dáng thời trang tương thích nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "office", label: "Công sở & Hội nghị cao cấp", desc: "Sartorial chỉn chu, quyền lực và tinh tế" },
                { id: "party", label: "Dạ tiệc & Sự kiện nghệ thuật", desc: "Hút mắt, ấn tượng và khác biệt" },
                { id: "street", label: "Dạo phố & Cà phê cuối tuần", desc: "Tối giản, phóng khoáng và tự nhiên" },
                { id: "resort", label: "Du lịch & Nghỉ dưỡng sang trọng", desc: "Nhẹ nhàng, bay bổng từ chất liệu tự nhiên" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`quiz-opt-${item.id}`}
                  onClick={() => setOccasion(item.id)}
                  className={`p-4 text-left border transition-all ${
                    occasion === item.id
                      ? "border-[#e65100] bg-[rgba(230,81,0,0.12)] text-[#f4f0e8]"
                      : "border-white/10 bg-[#161619] text-[#9a989f] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs uppercase tracking-wider font-semibold text-[#f4f0e8]">
                      {item.label}
                    </span>
                    {occasion === item.id && <Check size={14} className="text-[#e65100]" />}
                  </div>
                  <p className="text-[11px] text-[#8b8994] mt-1 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                variant="signal"
                size="md"
                data-testid="quiz-next-btn-1"
                disabled={!occasion}
                onClick={() => setStep(2)}
                className="gap-2"
              >
                <span>Tiếp Theo</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Tone Màu Yêu Thích */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-[11px] font-mono text-[#6b6973]">BƯỚC 2 / 4</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8] mt-1">
                Bảng màu thể hiện cái tôi của bạn?
              </h2>
              <p className="text-xs text-[#9a989f] mt-1">
                Màu sắc là ngôn ngữ thầm lặng của cảm xúc và địa vị.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "monochrome", label: "Monochrome Tuyệt Đối", desc: "Đen tuyền, than chì, trắng ngọc trai", colors: ["#000000", "#333333", "#f4f0e8"] },
                { id: "earthy", label: "Tone Đất Tự Nhiên (Earthy)", desc: "Nâu cà phê, be cát, xanh rêu ô-liu", colors: ["#584032", "#c4a482", "#556b2f"] },
                { id: "pastel", label: "Pastel Dịu Mắt", desc: "Xám khói, xanh băng, hồng thạch anh mờ", colors: ["#b0c4de", "#d8bfd8", "#e6e6fa"] },
                { id: "bold", label: "Bold Sắc Nét (Tương phản cao)", desc: "Đỏ rượu vang, xanh hoàng gia, ánh kim", colors: ["#722f37", "#1a365d", "#d4af37"] },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`quiz-opt-${item.id}`}
                  onClick={() => setPalette(item.id)}
                  className={`p-4 text-left border transition-all ${
                    palette === item.id
                      ? "border-[#e65100] bg-[rgba(230,81,0,0.12)] text-[#f4f0e8]"
                      : "border-white/10 bg-[#161619] text-[#9a989f] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs uppercase tracking-wider font-semibold text-[#f4f0e8]">
                      {item.label}
                    </span>
                    {palette === item.id && <Check size={14} className="text-[#e65100]" />}
                  </div>
                  <p className="text-[11px] text-[#8b8994] mt-1 mb-2">{item.desc}</p>
                  <div className="flex gap-1.5">
                    {item.colors.map((c, i) => (
                      <span key={i} className="w-5 h-3 border border-white/20 inline-block" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button variant="secondary" size="md" onClick={() => setStep(1)}>
                Quay Lại
              </Button>
              <Button
                variant="signal"
                size="md"
                data-testid="quiz-next-btn-2"
                disabled={!palette}
                onClick={() => setStep(3)}
                className="gap-2"
              >
                <span>Tiếp Theo</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Phom Dáng & Đường Cắt */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-[11px] font-mono text-[#6b6973]">BƯỚC 3 / 4</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8] mt-1">
                Phom dáng trang phục bạn ưa chuộng?
              </h2>
              <p className="text-xs text-[#9a989f] mt-1">
                Tỷ lệ cấu trúc định hình thần thái và sự thoải mái trong chuyển động.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "tailored", label: "Tailored Slim", desc: "Ôm vừa vặn cơ thể, nhấn eo và đệm vai chuẩn may đo" },
                { id: "relaxed", label: "Relaxed Fit", desc: "Thoải mái tự nhiên, bay bổng và linh hoạt" },
                { id: "oversized", label: "Oversized & Avant-Garde", desc: "Rộng rãi phá cách, vai trễ và độ rủ ấn tượng" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`quiz-opt-${item.id}`}
                  onClick={() => setSilhouette(item.id)}
                  className={`p-4 text-left border transition-all ${
                    silhouette === item.id
                      ? "border-[#e65100] bg-[rgba(230,81,0,0.12)] text-[#f4f0e8]"
                      : "border-white/10 bg-[#161619] text-[#9a989f] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xs uppercase tracking-wider font-semibold text-[#f4f0e8]">
                      {item.label}
                    </span>
                    {silhouette === item.id && <Check size={14} className="text-[#e65100]" />}
                  </div>
                  <p className="text-[11px] text-[#8b8994] leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button variant="secondary" size="md" onClick={() => setStep(2)}>
                Quay Lại
              </Button>
              <Button
                variant="signal"
                size="md"
                data-testid="quiz-next-btn-3"
                disabled={!silhouette}
                onClick={() => setStep(4)}
                className="gap-2"
              >
                <span>Tiếp Theo</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Mức Đầu Tư & Hoàn Tất */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <span className="text-[11px] font-mono text-[#6b6973]">BƯỚC 4 / 4</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-[#f4f0e8] mt-1">
                Mức đầu tư lý tưởng cho một thiết kế?
              </h2>
              <p className="text-xs text-[#9a989f] mt-1">
                Để hệ thống đề xuất các bộ sưu tập chuẩn tầm giá mong muốn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "accessible", label: "Dưới 2.000.000 ₫", desc: "Thiết kế may đo ứng dụng hằng ngày" },
                { id: "signature", label: "2.000.000 ₫ - 5.000.000 ₫", desc: "Bộ sưu tập giới hạn Signature" },
                { id: "couture", label: "Trên 5.000.000 ₫", desc: "Haute Couture & Thiết kế độc bản thủ công" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`quiz-opt-${item.id}`}
                  onClick={() => setBudget(item.id)}
                  className={`p-4 text-left border transition-all ${
                    budget === item.id
                      ? "border-[#e65100] bg-[rgba(230,81,0,0.12)] text-[#f4f0e8]"
                      : "border-white/10 bg-[#161619] text-[#9a989f] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-xs uppercase tracking-wider font-semibold text-[#f4f0e8]">
                      {item.label}
                    </span>
                    {budget === item.id && <Check size={14} className="text-[#e65100]" />}
                  </div>
                  <p className="text-[11px] text-[#8b8994] leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t border-white/10">
              <Button variant="secondary" size="md" onClick={() => setStep(3)}>
                Quay Lại
              </Button>
              <Button
                variant="signal"
                size="md"
                data-testid="quiz-submit-btn"
                disabled={!budget || isAnalyzing}
                onClick={handleFinishQuiz}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-1">✦</span>
                    <span>AI Đang Phân Tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Xem Hồ Sơ Phong Cách</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: KẾT QUẢ PERSONA */}
        {step === 5 && activePersona && (
          <div data-testid="quiz-result-card" className="space-y-6 animate-fade-in text-center sm:text-left">
            <div className="p-6 bg-[#161619] border border-[#e65100]/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                <Sparkles size={80} className="text-[#e65100]" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-widest text-[#e65100] uppercase border border-[#e65100]/50 px-2 py-0.5">
                  FASHION PERSONA ĐỘC BẢN
                </span>
                <span className="text-[10px] font-mono text-[#9a989f]">
                  Hoàn tất: Hôm nay
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#f4f0e8] tracking-tight">
                {activePersona.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#ff6d00] font-medium mt-1">
                {activePersona.tagline}
              </p>

              <p className="text-xs text-[#9a989f] leading-relaxed mt-4 max-w-xl">
                {activePersona.description}
              </p>

              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#6b6973] block mb-1.5">
                    Bảng màu signature:
                  </span>
                  <div className="flex gap-2">
                    {activePersona.palette.map((c, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: c }} />
                        <span className="text-[10px] font-mono text-[#8b8994]">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-[#6b6973] block mb-1.5">
                    Gợi ý phối đồ cho bạn:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activePersona.recommendedCategories.map((cat, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-[#0c0c0e] border border-white/10 text-[#f4f0e8]">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={resetQuiz}
                className="text-xs font-mono text-[#9a989f] hover:text-[#f4f0e8] flex items-center gap-1.5 py-2"
              >
                <RotateCcw size={14} />
                <span>Làm lại bài trắc nghiệm</span>
              </button>

              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  data-testid="quiz-finish-close-btn"
                  onClick={closeQuiz}
                  className="flex-1 sm:flex-none"
                >
                  Đóng
                </Button>
                <Button
                  variant="signal"
                  size="md"
                  onClick={() => {
                    closeQuiz();
                    navigate("/products");
                  }}
                  className="flex-1 sm:flex-none gap-2"
                >
                  <span>Khám Phá Thiết Kế Phù Hợp</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
