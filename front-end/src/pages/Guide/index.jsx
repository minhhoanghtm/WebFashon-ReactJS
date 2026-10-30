import React, { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Sparkles, Ruler, Check, Info } from "lucide-react";

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
    name: "Quần Trousers & Jeans",
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
  useDocumentTitle("Hướng dẫn chọn size — 404STUDIO");
  const [activeTab, setActiveTab] = useState("blazer");

  const currentCategory = sizeCategories.find((c) => c.id === activeTab) || sizeCategories[0];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#05251C] py-12 sm:py-20 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#05251C]/5 border border-[#05251C]/10 text-[10px] font-black tracking-[0.25em] text-[#05251C] uppercase mb-4">
            <Sparkles size={12} className="text-[#05251C]" />
            <span>ACCURATE FIT & SIZING ARCHITECTURE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#05251C] uppercase font-display leading-[0.92] tracking-tighter">
            BẢNG CHỌN SIZE.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-[#6B716E] max-w-lg mx-auto leading-relaxed">
            Mọi thiết kế của 404Studio được may đo theo hệ kích thước tiêu chuẩn phom dáng người Việt với tỷ lệ thư giãn tự nhiên.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-3 mb-10 overflow-x-auto hide-scrollbar pb-2">
          {sizeCategories.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-[#05251C] text-[#F5DD20] shadow-md scale-105"
                    : "bg-white text-[#6B716E] hover:text-[#05251C] border border-[#05251C]/10"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Size Table Card */}
        <div className="bg-white rounded-3xl border border-[#05251C]/10 p-6 sm:p-10 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#05251C]/10">
            <div className="flex items-center gap-2.5">
              <Ruler size={20} className="text-[#05251C]" />
              <h2 className="text-xl sm:text-2xl font-black font-display text-[#05251C] uppercase tracking-tight">
                {currentCategory.name}
              </h2>
            </div>
            <span className="micro-label text-[#6B716E]">ĐƠN VỊ TÍNH: CENTIMETER (CM)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#05251C]/15 bg-[#FBF9F5]">
                  {currentCategory.headers.map((h, idx) => (
                    <th key={idx} className="p-4 font-black uppercase tracking-wider text-[#05251C]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#05251C]/10">
                {currentCategory.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FBF9F5] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`p-4 ${cIdx === 0 ? "font-black text-[#05251C]" : "text-[#6B716E]"}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sizing Tips */}
          <div className="mt-8 p-4 rounded-2xl bg-[#05251C]/5 border border-[#05251C]/10 flex items-start gap-3 text-xs text-[#6B716E] leading-relaxed">
            <Info size={18} className="text-[#05251C] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#05251C]">Lưu ý phom dáng:</strong> Nếu số đo của bạn nằm giữa hai size, hãy chọn size lớn hơn nếu bạn thích mặc kiểu Regular / Oversize thoải mái, hoặc chọn size nhỏ hơn nếu thích mặc kiểu Tailored ôm dáng gọn gàng.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guide;
