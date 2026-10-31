import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket,
  ShoppingBag,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const MyCoupons = ({ isDashboard = false, onNavigateToHunt }) => {
  useDocumentTitle("Ví Voucher");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState("CLAIMED"); // CLAIMED, USED, EXPIRED
  const [walletItems, setWalletItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchWallet = async () => {
      await Promise.resolve();
      if (!isAuthenticated) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setLoading(true);
      try {
        const res = await voucherApi.getUserWallet(activeTab);
        if (isMounted && res.success) {
          setWalletItems(res.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải ví voucher của bạn");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchWallet();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, activeTab]);

  return (
    <div
      className={
        isDashboard
          ? "w-full space-y-6 text-[var(--color-text)]"
          : "min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] py-12 px-4 sm:px-6 lg:px-8"
      }
    >
      <div className={isDashboard ? "space-y-6" : "mx-auto max-w-7xl space-y-8"}>
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight flex items-center gap-2.5">
              <Ticket className="h-6 w-6" aria-hidden="true" />
              <span>Ví voucher của tôi</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
              Quản lý các mã ưu đãi đã lưu và áp dụng khi thanh toán đơn hàng.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigateToHunt ? onNavigateToHunt() : navigate("/vouchers")
            }
            className="inline-flex items-center gap-2 min-h-[44px] bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium px-5 py-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Săn thêm voucher</span>
          </button>
        </div>

        {/* Tab Headers */}
        <div
          className="flex border-b border-[var(--color-border)] gap-6"
          role="tablist"
          aria-label="Trạng thái voucher"
        >
          {[
            { key: "CLAIMED", label: "Khả dụng" },
            { key: "USED", label: "Đã sử dụng" },
            { key: "EXPIRED", label: "Hết hạn" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`min-h-[44px] pb-3 text-xs uppercase tracking-[0.14em] border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "border-[var(--color-text)] text-[var(--color-text)] font-semibold"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading ? (
          <div
            className="flex flex-col items-center justify-center py-20"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-[var(--color-text)] mb-3"
              aria-hidden="true"
            />
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Đang tải dữ liệu ví voucher...
            </p>
          </div>
        ) : walletItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] text-center space-y-3 px-4">
            <AlertCircle
              className="h-10 w-10 text-[var(--color-text-muted)] stroke-[1.5]"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="font-display text-xl font-semibold">
                Không có voucher nào ở mục này
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {activeTab === "CLAIMED"
                  ? "Ví của bạn hiện đang trống. Hãy khám phá kho ưu đãi ngay!"
                  : activeTab === "USED"
                  ? "Bạn chưa từng sử dụng voucher nào."
                  : "Bạn không có voucher nào bị quá hạn."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {walletItems.map((item) => {
              const v = item.voucherId;
              if (!v) return null;

              return (
                <article
                  key={item._id}
                  className={`bg-[var(--color-surface)] border border-[var(--color-border)] p-5 flex flex-col justify-between min-h-[170px] ${
                    activeTab !== "CLAIMED" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                      <Ticket className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 uppercase tracking-wider">
                          {v.code}
                        </span>
                        {activeTab === "USED" && (
                          <span className="text-[10px] border border-[var(--color-border)] px-1.5 py-0.5 uppercase tracking-wider">
                            Đã dùng
                          </span>
                        )}
                        {activeTab === "EXPIRED" && (
                          <span className="text-[10px] border border-[var(--color-danger)] text-[var(--color-danger)] px-1.5 py-0.5 uppercase tracking-wider">
                            Quá hạn
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg font-semibold line-clamp-1">
                        {v.name}
                      </h3>

                      <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                        {v.description || "Không có mô tả thêm."}
                      </p>

                      <div className="text-[11px] text-[var(--color-text-muted)] pt-1 font-mono">
                        {activeTab === "CLAIMED" && (
                          <span>
                            HSD:{" "}
                            <strong className="text-[var(--color-text)]">
                              {new Date(v.endDate).toLocaleDateString("vi-VN")}
                            </strong>
                          </span>
                        )}
                        {activeTab === "USED" && item.usedAt && (
                          <span>
                            Đã dùng:{" "}
                            {new Date(item.usedAt).toLocaleString("vi-VN")}
                          </span>
                        )}
                        {activeTab === "EXPIRED" && (
                          <span className="text-[var(--color-danger)]">
                            Hết hạn từ{" "}
                            {new Date(v.endDate).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom section */}
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                        Mức giảm
                      </div>
                      <div className="text-lg font-mono font-semibold">
                        {v.discountType === "percentage"
                          ? `${v.discountValue}%`
                          : `${v.discountValue.toLocaleString("vi-VN")}đ`}
                      </div>
                    </div>

                    {activeTab === "CLAIMED" && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/cart", {
                            state: { applyVoucher: v.code },
                          })
                        }
                        className="inline-flex items-center gap-1.5 min-h-[44px] bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.14em] font-medium px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <ShoppingBag
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>Dùng ngay</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoupons;
