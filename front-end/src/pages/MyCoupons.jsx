import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, ShoppingBag, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import voucherApi from "../api/voucher.api";
import { useAuthStore } from "../store/auth.store";

const MyCoupons = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState("CLAIMED"); // CLAIMED, USED, EXPIRED
  const [walletItems, setWalletItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await voucherApi.getUserWallet(activeTab);
      if (res.success) {
        setWalletItems(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải ví voucher của bạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // toast.info("Vui lòng đăng nhập để xem ví voucher!");
      // navigate("/login");
      setLoading(false);
      return;
    }
    fetchWallet();
  }, [isAuthenticated, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/40 py-12 px-6 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Ticket className="h-7 w-7 text-indigo-600" />
              <span>Ví Voucher Của Tôi</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Quản lý các mã giảm giá bạn đã tích lũy và sử dụng khi mua sắm
            </p>
          </div>
          
          <button
            onClick={() => navigate("/vouchers")}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/45 dark:text-indigo-400 dark:hover:bg-indigo-900 text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span>Săn thêm Voucher</span>
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
          {[
            { key: "CLAIMED", label: "Khả dụng" },
            { key: "USED", label: "Đã sử dụng" },
            { key: "EXPIRED", label: "Hết hạn" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all relative cursor-pointer ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-650"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm text-slate-400">Đang đọc dữ liệu ví voucher...</p>
          </div>
        ) : walletItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/60 dark:border-slate-800 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-slate-350" />
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-600 dark:text-slate-300">
                Không có voucher nào ở mục này
              </p>
              <p className="text-xs text-slate-400">
                {activeTab === "CLAIMED"
                  ? "Ví của bạn hiện đang trống. Hãy đi săn thêm mã giảm giá ngay!"
                  : activeTab === "USED"
                  ? "Bạn chưa từng sử dụng voucher nào. Đặt hàng và áp mã nhé!"
                  : "Tuyệt vời, bạn không có voucher nào bị hết hạn."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {walletItems.map((item) => {
              const v = item.voucherId;
              if (!v) return null; // Avoid crashing on corrupted DB references
              
              return (
                <div
                  key={item._id}
                  className={`group relative bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-hidden min-h-[170px] transition duration-200 ${
                    activeTab !== "CLAIMED" ? "opacity-75 hover:opacity-100" : ""
                  }`}
                >
                  {/* Circle notches for ticket aesthetic */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-10"></div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === "CLAIMED"
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40"
                          : activeTab === "USED"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                          : "bg-slate-150 text-slate-400 dark:bg-slate-800"
                      }`}
                    >
                      <Ticket className="h-6 w-6" />
                    </div>
                    
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded uppercase">
                          {v.code}
                        </span>
                        {activeTab === "USED" && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Đã dùng
                          </span>
                        )}
                        {activeTab === "EXPIRED" && (
                          <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">
                            Quá hạn
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {v.name}
                      </h3>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {v.description || "Không có mô tả thêm."}
                      </p>

                      <div className="text-[11px] text-slate-400 pt-1">
                        {activeTab === "CLAIMED" && (
                          <span>Hạn dùng: <span className="font-bold text-red-500">{new Date(v.endDate).toLocaleDateString("vi-VN")}</span></span>
                        )}
                        {activeTab === "USED" && item.usedAt && (
                          <span>Sử dụng lúc: <span className="font-semibold">{new Date(item.usedAt).toLocaleString("vi-VN")}</span></span>
                        )}
                        {activeTab === "EXPIRED" && (
                          <span className="text-red-400">Voucher đã hết hạn từ ngày {new Date(v.endDate).toLocaleDateString("vi-VN")}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card bottom section */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Mức giảm</div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {v.discountType === "percentage" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}đ`}
                      </div>
                    </div>

                    {activeTab === "CLAIMED" && (
                      <button
                        onClick={() => navigate("/cart", { state: { applyVoucher: v.code } })}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow shadow-indigo-500/10 transition cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Dùng Ngay</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoupons;
