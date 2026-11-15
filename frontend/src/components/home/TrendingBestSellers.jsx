import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, Star, ShoppingBag, ArrowRight } from "lucide-react";
import { ProductCard } from "../shared/ProductCard";

export function TrendingBestSellers({ products = [] }) {
  const [activeTab, setActiveTab] = useState("trending"); // "trending" | "best_sellers"

  // Partition products into trending and best_sellers
  const trendingList = products.slice(0, 4);
  const bestSellersList = products.length > 4 ? products.slice(4, 8) : products.slice(0, 4);

  const displayList = activeTab === "trending" ? trendingList : bestSellersList;

  return (
    <section className="py-16 sm:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full border-b border-[rgba(244,240,232,0.1)]">
      {/* Header with Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-4 border-b border-[rgba(244,240,232,0.1)]">
        <div>
          <span className="text-xs font-mono tracking-widest text-[#e65100] uppercase block mb-1">
            XU HƯỚNG & ĐƯỢC YÊU THÍCH NHẤT
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#f4f0e8]">
            TRENDING & BEST SELLERS
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1 bg-[#161619] border border-[rgba(244,240,232,0.1)]">
          <button
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase transition-all ${
              activeTab === "trending"
                ? "bg-[#e65100] text-white shadow"
                : "text-[#9a989f] hover:text-[#f4f0e8]"
            }`}
          >
            <Flame size={14} />
            <span>Thịnh Hành Tuần Này</span>
          </button>
          <button
            onClick={() => setActiveTab("best_sellers")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-display tracking-wider uppercase transition-all ${
              activeTab === "best_sellers"
                ? "bg-[#e65100] text-white shadow"
                : "text-[#9a989f] hover:text-[#f4f0e8]"
            }`}
          >
            <Trophy size={14} />
            <span>Bán Chạy Nhất</span>
          </button>
        </div>
      </div>

      {/* Grid of 4 Products */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {displayList.length > 0 ? (
          displayList.map((prod, idx) => (
            <div key={prod._id || idx} className="relative group">
              <ProductCard product={prod} />
              {/* Overlay Ribbon */}
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="px-2 py-0.5 bg-[#0c0c0e]/90 border border-[#e65100]/40 text-[#ff6d00] text-[9px] font-mono uppercase tracking-widest">
                  {activeTab === "trending" ? `TRENDING #${idx + 1}` : `TOP ${idx + 1}`}
                </span>
              </div>
            </div>
          ))
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#161619] animate-pulse border border-white/5" />
          ))
        )}
      </div>

      {/* Bottom Quick Action */}
      <div className="mt-8 text-center">
        <Link
          to={`/products?sort=${activeTab === "trending" ? "trending" : "best_seller"}`}
          className="inline-flex items-center gap-2 text-xs font-display tracking-widest uppercase text-[#9a989f] hover:text-[#e65100] transition-colors py-2"
        >
          <span>Xem Toàn Bộ {activeTab === "trending" ? "Sản Phẩm Thịnh Hành" : "Sản Phẩm Bán Chạy"}</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
