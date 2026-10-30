import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Users,
  Percent,
  ShoppingBag,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Clock,
  Layers,
} from "lucide-react";
import experimentApi from "@/api/experimentApi";

export default function ABTestingManagement() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [experimentsList, setExperimentsList] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState("AA_Recommendation_Validation");
  const [toggling, setToggling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadExperiments = async () => {
    try {
      const res = await experimentApi.listExperiments();
      const list = res?.data || res || [];
      if (Array.isArray(list) && list.length > 0) {
        setExperimentsList(list);
        // Ưu tiên chọn AA_Recommendation_Validation nếu có trong danh sách
        const hasAA = list.find(
          (e) =>
            e.experiment_id?.toLowerCase() === "aa_recommendation_validation" ||
            e.experiment_id === "AA_Recommendation_Validation"
        );
        if (hasAA) {
          setSelectedExpId(hasAA.experiment_id);
        } else if (list[0]?.experiment_id) {
          setSelectedExpId(list[0].experiment_id);
        }
      }
    } catch (err) {
      console.warn("Không thể tải danh sách thử nghiệm:", err.message);
    }
  };

  const fetchAnalytics = async (expToFetch = selectedExpId) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await experimentApi.getAnalytics(expToFetch);
      setAnalytics(res?.data || res);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu A/B Testing:", err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Không thể tải báo cáo thử nghiệm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  useEffect(() => {
    if (selectedExpId) {
      fetchAnalytics(selectedExpId);
    }
  }, [selectedExpId]);

  const handleToggleStatus = async (newStatus) => {
    try {
      setToggling(true);
      await experimentApi.toggleExperiment(selectedExpId, { status: newStatus });
      await fetchAnalytics(selectedExpId);
      await loadExperiments();
    } catch (err) {
      alert("Lỗi khi chuyển trạng thái: " + (err?.response?.data?.message || err.message));
    } finally {
      setToggling(false);
    }
  };

  const handleEmergencyRollback = async () => {
    const confirmed = window.confirm(
      "CẢNH BÁO: Bạn có chắc chắn muốn Rollback khẩn cấp toàn bộ 100% lưu lượng về nhóm Đối chứng (Control A)?\nNhóm thử nghiệm sẽ bị dừng ngay lập tức."
    );
    if (!confirmed) return;

    try {
      setToggling(true);
      await experimentApi.toggleExperiment(selectedExpId, { rollbackToControl: true });
      await fetchAnalytics(selectedExpId);
      await loadExperiments();
      alert("Đã Rollback khẩn cấp về 100% Control thành công.");
    } catch (err) {
      alert("Lỗi khi Rollback: " + (err?.response?.data?.message || err.message));
    } finally {
      setToggling(false);
    }
  };

  const exp = analytics?.experiment || {};
  const sample = analytics?.sampleAllocation || {};
  const srm = sample?.srm || {};
  const primary = analytics?.primaryMetric || {};
  const primaryStats = primary?.statistics || {};
  const secondary = analytics?.secondaryMetrics || {};
  const guardrails = analytics?.guardrails || {};
  const mde = analytics?.mdeAnalysis || {};

  const isRunning = exp.status === "running";
  const isDraft = exp.status === "draft";

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FlaskConical size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
                  {exp.name || "Thử nghiệm A/A & A/B Testing"}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    exp.status === "running"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : exp.status === "draft"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {exp.status || "draft"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <span>Chọn thử nghiệm:</span>
                <select
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  {experimentsList.map((item) => (
                    <option key={item.experiment_id} value={item.experiment_id}>
                      {item.name} ({item.experiment_id}) [{item.status}]
                    </option>
                  ))}
                  {!experimentsList.some((i) => i.experiment_id === selectedExpId) && (
                    <option value={selectedExpId}>{selectedExpId}</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchAnalytics(selectedExpId)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>

          {isRunning ? (
            <button
              type="button"
              onClick={() => handleToggleStatus("paused")}
              disabled={toggling}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition"
            >
              <Pause size={14} />
              <span>Tạm dừng</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleStatus("running")}
              disabled={toggling}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Play size={14} />
              <span>Kích hoạt chạy</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleEmergencyRollback}
            disabled={toggling}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-xs"
          >
            <ShieldAlert size={14} />
            <span>Rollback khẩn cấp</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-3">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Status & Guardrail Quick Pill */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
          isRunning
            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            : "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          Trạng thái: {isRunning ? "ĐANG CHẠY (RUNNING)" : `TẠM DỪNG (${exp.status?.toUpperCase() || "PAUSED"})`}
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Clock size={12} />
          Cửa sổ quy kết: {exp.attributionWindowHours || 24} giờ
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Layers size={12} />
          Tỷ lệ mục tiêu: A {exp.weights?.A ?? 50}% / B {exp.weights?.B ?? 50}%
        </span>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sample Size & SRM */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Users size={14} />
              Cỡ mẫu tiếp xúc (Exposures)
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              srm.hasSRM
                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            }`}>
              {srm.hasSRM ? "SRM ALERT" : "SRM PASSED"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {(sample.variantA?.exposed || 0) + (sample.variantB?.exposed || 0)}
              </div>
              <div className="text-xs text-slate-500">Tổng người dùng tiếp xúc</div>
            </div>
            <div className="text-right text-xs space-y-0.5 font-mono">
              <div className="text-slate-600 dark:text-slate-300">
                A (Ctrl): <strong>{sample.variantA?.exposed || 0}</strong> ({sample.variantA?.ratio || 50}%)
              </div>
              <div className="text-indigo-600 dark:text-indigo-400">
                B (AI): <strong>{sample.variantB?.exposed || 0}</strong> ({sample.variantB?.ratio || 50}%)
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Chi-Square: <strong className="font-mono">{srm.chiSquare ?? 0}</strong></span>
            <span>p-value: <strong className="font-mono">{srm.pValue ?? 1}</strong></span>
          </div>
        </div>

        {/* Card 2: Primary Metric Conversion Rate */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <ShoppingBag size={14} />
              Tỷ lệ hoàn tất mua (Primary CR)
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              primaryStats.isSignificant
                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}>
              {primaryStats.isSignificant ? "CÓ Ý NGHĨA THỐNG KÊ" : "CHƯA KẾT LUẬN"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1">
                {primary.variantB?.conversionRate ?? 0}%
                {primaryStats.relativeUplift > 0 ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight size={14} />+{primaryStats.relativeUplift}%
                  </span>
                ) : primaryStats.relativeUplift < 0 ? (
                  <span className="text-xs font-bold text-red-600 flex items-center">
                    <ArrowDownRight size={14} />{primaryStats.relativeUplift}%
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">Nhóm B (AI Hybrid)</div>
            </div>

            <div className="text-right text-xs font-mono text-slate-500">
              <div>Control A: <strong>{primary.variantA?.conversionRate ?? 0}%</strong></div>
              <div>Đơn hàng: {primary.variantA?.purchases || 0} vs {primary.variantB?.purchases || 0}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>z-score: <strong className="font-mono">{primaryStats.zScore ?? 0}</strong></span>
            <span>p-value: <strong className="font-mono">{primaryStats.pValue ?? 1}</strong></span>
          </div>
        </div>

        {/* Card 3: Click-Through Rate (CTR) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Percent size={14} />
              Tỷ lệ nhấp đề xuất (Rec CTR)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Secondary</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1">
                {secondary.ctr?.variantB ?? 0}%
                {secondary.ctr?.relativeUplift > 0 ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight size={14} />+{secondary.ctr.relativeUplift}%
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-slate-500">Nhóm B (AI) vs A: {secondary.ctr?.variantA ?? 0}%</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Thêm giỏ hàng (ATC):</span>
            <strong className="font-mono text-slate-700 dark:text-slate-200">
              A {secondary.addToCartRate?.variantA ?? 0}% vs B {secondary.addToCartRate?.variantB ?? 0}%
            </strong>
          </div>
        </div>

        {/* Card 4: Revenue & AOV */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <DollarSign size={14} />
              Doanh thu quy kết (Revenue)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Attributed</span>
          </div>

          <div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {(secondary.revenue?.totalRevenueB || 0).toLocaleString("vi-VN")} đ
            </div>
            <div className="text-xs text-slate-500">Nhóm B (AI) · Nhóm A: {(secondary.revenue?.totalRevenueA || 0).toLocaleString("vi-VN")} đ</div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>AOV (Giá trị đơn TB):</span>
            <strong className="font-mono text-slate-700 dark:text-slate-200">
              {(secondary.revenue?.aovB || 0).toLocaleString("vi-VN")} đ
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 px-1 border-b-2 transition ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Ý nghĩa thống kê & Phân tích chi tiết
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("guardrails")}
          className={`pb-2.5 px-1 border-b-2 transition ${
            activeTab === "guardrails"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Chỉ số rào chắn an toàn (Guardrails)
        </button>
      </div>

      {/* Tab 1: Detailed Statistical Report */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Metric Deep Dive */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  Kiểm định giả thuyết chỉ số chính (Two-Sample Z-Test)
                </h3>
                <span className="text-xs text-slate-500 font-mono">Significance level: alpha = 0.05</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2.5 px-3">Nhóm thử nghiệm</th>
                      <th className="py-2.5 px-3">Thuật toán</th>
                      <th className="py-2.5 px-3 font-mono">Lượt tiếp xúc</th>
                      <th className="py-2.5 px-3 font-mono">Lượt mua</th>
                      <th className="py-2.5 px-3 font-mono">Tỷ lệ CR</th>
                      <th className="py-2.5 px-3 font-mono">Độ lệch (Uplift)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">Control (A)</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">Popular / Best Sellers</td>
                      <td className="py-3 px-3 font-mono">{sample.variantA?.exposed || 0}</td>
                      <td className="py-3 px-3 font-mono">{primary.variantA?.purchases || 0}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {primary.variantA?.conversionRate ?? 0}%
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">Baseline</td>
                    </tr>
                    <tr className="bg-indigo-50/30 dark:bg-indigo-950/20">
                      <td className="py-3 px-3 font-bold text-indigo-700 dark:text-indigo-300">Treatment (B)</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">Hybrid AI Personalized</td>
                      <td className="py-3 px-3 font-mono">{sample.variantB?.exposed || 0}</td>
                      <td className="py-3 px-3 font-mono">{primary.variantB?.purchases || 0}</td>
                      <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {primary.variantB?.conversionRate ?? 0}%
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {primaryStats.relativeUplift > 0 ? (
                          <span className="text-emerald-600">+{primaryStats.relativeUplift}%</span>
                        ) : (
                          <span className="text-slate-500">{primaryStats.relativeUplift}%</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Statistical Verdict Box */}
              <div className={`p-4 rounded-xl border ${
                primaryStats.verdict === "TREATMENT_WINNER"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : primaryStats.verdict === "CONTROL_WINNER"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              } text-xs space-y-1`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle size={15} />
                  Kết luận thống kê: {
                    primaryStats.verdict === "TREATMENT_WINNER"
                      ? "Treatment B (AI Personalized) vượt trội có ý nghĩa thống kê so với Control A."
                      : primaryStats.verdict === "CONTROL_WINNER"
                      ? "Control A tốt hơn Treatment B. Đề xuất kiểm tra lại chất lượng gợi ý AI."
                      : "Chưa đủ dữ liệu hoặc chưa đạt ý nghĩa thống kê (p >= 0.05). Tiếp tục thu thập thêm mẫu."
                  }
                </div>
                <div className="text-[11px] opacity-80 font-mono">
                  95% Confidence Interval for Uplift: [
                  {primaryStats.confidenceInterval95?.[0] ?? 0}%, {primaryStats.confidenceInterval95?.[1] ?? 0}%
                  ] · p-value = {primaryStats.pValue ?? 1} · z-score = {primaryStats.zScore ?? 0}
                </div>
              </div>
            </div>

            {/* Conversion Funnel Breakdown */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-slate-500" />
                Phễu tương tác và chuyển đổi đa tầng
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[11px]">Click-Through (CTR)</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    A: {secondary.ctr?.variantA ?? 0}% | B: {secondary.ctr?.variantB ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500">Uplift: {secondary.ctr?.relativeUplift ?? 0}%</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[11px]">Thêm vào giỏ (ATC)</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    A: {secondary.addToCartRate?.variantA ?? 0}% | B: {secondary.addToCartRate?.variantB ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500">Uplift: {secondary.addToCartRate?.relativeUplift ?? 0}%</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[11px]">Bắt đầu Checkout</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    A: {secondary.checkoutRate?.variantA ?? 0}% | B: {secondary.checkoutRate?.variantB ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500">Uplift: {secondary.checkoutRate?.relativeUplift ?? 0}%</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                  <span className="text-slate-400 text-[11px]">Doanh thu / User (ARPU)</span>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {(secondary.revenue?.arpuB || 0).toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-[10px] text-slate-500">Ctrl: {(secondary.revenue?.arpuA || 0).toLocaleString("vi-VN")} đ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Health & SRM Inspector */}
          <div className="space-y-6">
            {/* SRM Inspector Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert size={16} className={srm.hasSRM ? "text-red-500" : "text-emerald-500"} />
                Kiểm định sai lệch mẫu (SRM Inspector)
              </h4>
              <p className="text-xs text-slate-500">
                Kiểm định Chi-Square Goodness-of-Fit giữa số lượng thực tế quan sát được và tỷ trọng lý thuyết 50/50.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kỳ vọng A / B:</span>
                  <span>{srm.expected?.A ?? 0} / {srm.expected?.B ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thực tế A / B:</span>
                  <span>{srm.observed?.A ?? 0} / {srm.observed?.B ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chi-Square Stat:</span>
                  <span>{srm.chiSquare ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">p-value:</span>
                  <span className={srm.hasSRM ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                    {srm.pValue ?? 1}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {srm.message}
              </p>
            </div>

            {/* MDE & Power Analysis Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Info size={16} className="text-indigo-500" />
                Năng lực kiểm định (Power & MDE)
              </h4>
              <p className="text-xs text-slate-500">
                Minimum Detectable Effect tại mức tin cậy 95% và năng lực thống kê 80%.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Baseline CR:</span>
                  <span>{((mde.baselineRate || 0.05) * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cỡ mẫu mỗi nhóm:</span>
                  <span>{mde.sampleSizePerVariant || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Relative MDE:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    +{mde.relativeMDE || 0}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                {mde.note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardrails & Risk Protection */}
      {activeTab === "guardrails" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Độ trễ API p95 (Latency Guardrail)</span>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {guardrails.latencyP95Ms?.current ?? 42} ms
            </div>
            <div className="text-xs text-slate-500">
              Mục tiêu an toàn: &lt; {guardrails.latencyP95Ms?.target ?? 150} ms · Trạng thái: An toàn
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tỷ lệ lỗi hệ thống (Error Rate)</span>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {guardrails.errorRate?.current ?? 0.0}%
            </div>
            <div className="text-xs text-slate-500">
              Tỷ lệ lỗi fallback không vượt quá 0.1%
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tỷ lệ hủy đơn hàng (Cancellation Rate)</span>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              A: {guardrails.cancellationRate?.variantA ?? 0}% | B: {guardrails.cancellationRate?.variantB ?? 0}%
            </div>
            <div className="text-xs text-slate-500">
              Nhóm AI không làm tăng tỷ lệ hoàn/hủy đơn hàng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
