import { create } from "zustand";

export const PERSONA_TYPES = {
  ARCHIVAL_MINIMALIST: {
    id: "archival_minimalist",
    title: "Archival Minimalist",
    tagline: "Sự tối giản kiến trúc & Bản sắc trường tồn",
    description: "Bạn đề cao sự tinh giản tuyệt đối trong kết cấu trang phục. Không phô trương, bạn thu hút ánh nhìn bằng chất liệu lụa satin mờ, đường may giấu chỉ và gam màu đơn sắc dứt khoát.",
    palette: ["#0c0c0e", "#28272c", "#f4f0e8", "#8b8994"],
    recommendedCategories: ["Blazer", "Trousers", "Sơ Mi Silk"],
    badgeColor: "#e65100",
  },
  MODERN_SARTORIALIST: {
    id: "modern_sartorialist",
    title: "Modern Sartorialist",
    tagline: "Nghệ thuật may đo chuẩn xác hòa cùng hơi thở đương đại",
    description: "Bạn yêu thích nét chỉn chu của phong cách quý tộc Âu châu nhưng được tái cấu trúc linh hoạt. Sự kết hợp giữa vest dáng relaxed và phụ kiện thủ công là chữ ký phong cách của bạn.",
    palette: ["#1c1d21", "#3c2a21", "#e5e5cb", "#d4af37"],
    recommendedCategories: ["Suit 3 Mảnh", "Áo Gile Len", "Giày Da Oxford"],
    badgeColor: "#d4af37",
  },
  AVANT_GARDE_EXPLORER: {
    id: "avant_garde_explorer",
    title: "Avant-Garde Explorer",
    tagline: "Bất quy tắc, thử nghiệm phom dáng & Tự do biểu đạt",
    description: "Thời trang với bạn là tác phẩm nghệ thuật chuyển động. Bạn thích các thiết kế bất đối xứng, xếp nếp phá cách và các chi tiết kim loại góc cạnh đầy tính vị lai.",
    palette: ["#0f0f11", "#4a4e69", "#9a8c98", "#ff6b6b"],
    recommendedCategories: ["Áo Khoác Trench Bất Đối Xứng", "Quần Ống Rộng Xếp Ly", "Boots Cao Cổ"],
    badgeColor: "#ff6b6b",
  },
  QUIET_LUXURY_EPICUREAN: {
    id: "quiet_luxury_epicurean",
    title: "Quiet Luxury Epicurean",
    tagline: "Sự xa xỉ thầm lặng từ sợi Cashmere & Len Merino",
    description: "Bạn không cần logo thương hiệu để khẳng định vị thế. Đẳng cấp của bạn thể hiện qua sự mềm mại đỉnh cao của sợi dệt tự nhiên, cảm giác chạm thượng hạng và sự thoải mái vô biên.",
    palette: ["#2c2a29", "#e3d5ca", "#d5bdaf", "#9a989f"],
    recommendedCategories: ["Áo Len Cashmere", "Áo Polo Tơ Tằm", "Quần Linen May Đo"],
    badgeColor: "#b5a397",
  },
};

export const usePersonaStore = create((set, get) => ({
  persona: JSON.parse(
    localStorage.getItem("webfashion_style_persona") || "null"
  ),
  isQuizOpen: false,

  openQuiz: () => set({ isQuizOpen: true }),
  closeQuiz: () => set({ isQuizOpen: false }),

  savePersona: (personaKey, answers = {}) => {
    const personaData = PERSONA_TYPES[personaKey] || PERSONA_TYPES.ARCHIVAL_MINIMALIST;
    const finalRecord = {
      ...personaData,
      answers,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem("webfashion_style_persona", JSON.stringify(finalRecord));
    set({ persona: finalRecord });
  },

  clearPersona: () => {
    localStorage.removeItem("webfashion_style_persona");
    set({ persona: null });
  },
}));
