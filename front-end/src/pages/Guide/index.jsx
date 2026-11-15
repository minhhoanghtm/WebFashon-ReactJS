import React, { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Sparkles, Ruler, Check, Info, Shield } from "lucide-react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

const sizeCategories = [
  {
    id: "blazer",
    name: "Áo Blazer & Jacket",
    headers: ["Size", "Vai (cm)", "Ngực (cm)", "Dài áo (cm)", "Dài tay (cm)", "Cân nặng gợi ý (kg)"],
    rows: [
      ["S (46)", "44", "102", "72", "61", "55 - 63 kg"],
      ["M (48)", "46", "106", "74", "62.5", "64 - 72 kg"],
      ["L (50)", "48", "110", "76", "64", "73 - 80 kg"],
      ["XL (52)", "50", "114", "78", "65.5", "81 - 90 kg"],
    ],
  },
  {
    id: "shirt",
    name: "Áo Sơ mi & Overshirt",
    headers: ["Size", "Vai (cm)", "Ngực (cm)", "Dài áo (cm)", "Cổ áo (cm)", "Chiều cao gợi ý (cm)"],
    rows: [
      ["S", "47", "108", "72", "38", "1m60 - 1m68"],
      ["M", "49", "112", "74", "39.5", "1m68 - 1m75"],
      ["L", "51", "116", "76", "41", "1m75 - 1m82"],
      ["XL", "53", "120", "78", "42.5", "1m80 - 1m88"],
    ],
  },
  {
    id: "trousers",
    name: "Quần Trousers & Tapered Pants",
    headers: ["Size", "Vòng bụng (cm)", "Mông (cm)", "Dài quần (cm)", "Ống quần (cm)", "Cân nặng (kg)"],
    rows: [
      ["29", "76", "96", "98", "21", "53 - 60 kg"],
      ["30", "79", "99", "100", "21.5", "61 - 67 kg"],
      ["31", "82", "102", "102", "22", "68 - 74 kg"],
      ["32", "85", "105", "103", "22.5", "75 - 82 kg"],
    ],
  },
];

export const Guide = () => {
  const { settings } = useWebsiteSettings();
  const siteName = settings?.general?.siteName || "ATELIER ÉTOILE";
  useDocumentTitle(`Hướng dẫn chọn size — ${siteName}`);
  const [activeTab, setActiveTab] = useState("blazer");

  const currentCategory = sizeCategories.find((c) => c.id === activeTab) || sizeCategories[0];

  return (
    <div className="min-h-screen bg-background text-foreground py-12 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border border-border px-3.5 py-1 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase mb-4">
            <Ruler size={13} strokeWidth={1.5} />
            <span>Quy chuẩn kích cỡ may đo chuẩn quốc tế</span>
          </div>

          <h1 className="font-condensed text-4xl sm:text-6xl font-bold uppercase tracking-tight text-foreground">
            Bảng Quy Đổi Size Chuẩn
          </h1>

          <p className="mt-4 max-w-xl mx-auto text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
            Mỗi thiết kế tại {siteName} được dựng phom theo cấu trúc may đo đương đại.
            Vui lòng đối chiếu số đo cơ thể để lựa chọn kích thước hoàn hảo nhất.
          </p>
        </div>

        {/* Tab selection */}
        <div className="flex justify-center border-b border-border mb-8">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-px">
            {sizeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all border-b-2 cursor-pointer ${
                  activeTab === cat.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Size Table Card */}
        <div className="border border-border bg-card p-6 sm:p-10 mb-12 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-condensed text-xl font-bold uppercase tracking-wide text-foreground">
              Thông số chi tiết: {currentCategory.name}
            </h2>
            <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
              Đơn vị đo: Centimet (cm)
            </span>
          </div>

          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {currentCategory.headers.map((h, i) => (
                  <th key={i} className="py-3 px-4 font-semibold text-foreground tracking-wider uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {currentCategory.rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-3.5 px-4 tabular-nums ${j === 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measurement instructions & Care Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-border bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-foreground">
              <Check size={16} />
              <span>Cách đo kích thước cơ thể chính xác</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed" role="list">
              <li><strong>Rộng vai:</strong> Đo từ điểm nối giữa vai và cánh tay trái sang điểm nối vai phải.</li>
              <li><strong>Vòng ngực:</strong> Quấn thước dây ngang qua điểm nhô cao nhất của ngực.</li>
              <li><strong>Vòng bụng:</strong> Đo quanh phần eo tự nhiên nhỏ nhất, giữ thước dây vừa vặn không thắt chặt.</li>
              <li><strong>Dài tay:</strong> Đo từ đỉnh vai xuống đến mắt cá cổ tay khi thả lỏng tự nhiên.</li>
            </ul>
          </div>

          <div className="border border-border bg-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-foreground">
              <Shield size={16} />
              <span>Chăm sóc trang phục cao cấp</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed" role="list">
              <li><strong>Blazer & Wool Coats:</strong> Luôn giặt khô định kỳ tại cơ sở uy tín để bảo vệ phom ve áo.</li>
              <li><strong>Silk & Lụa tơ tằm:</strong> Giặt tay với dầu gội dịu nhẹ, phơi phẳng nơi râm mát.</li>
              <li><strong>Linen:</strong> Giặt máy chế độ nhẹ, là ủi khi trang phục còn hơi ẩm để giữ nếp mềm tự nhiên.</li>
              <li><strong>Treo giữ:</strong> Luôn sử dụng móc gỗ bản to để giữ phom cấu trúc vai áo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
