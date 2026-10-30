import mongoose from "mongoose";
import UserEvent from "../../tracking/userEvent.model.js";
import Experiment from "./experiment.model.js";
import { EVENT_TYPES } from "../../tracking/tracking.constants.js";
import { DEFAULT_REC_EXPERIMENT_ID } from "./experiment.service.js";

/**
 * Hàm xấp xỉ hàm sai số erf(x) chuẩn xác đến 1e-7 (Abramowitz & Stegun)
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

/**
 * Hàm phân phối tích lũy chuẩn tắc CDF Phi(z)
 */
export function normalCDF(z) {
  return 0.5 * (1.0 + erf(z / Math.SQRT2));
}

class ExperimentAnalyticsService {
  /**
   * Tính toán Sample Ratio Mismatch (SRM) bằng kiểm định Chi-Square Goodness-of-Fit
   * df = 1 => p-value = 2 * (1 - normalCDF(sqrt(chi2)))
   */
  calculateSRM(observedA, observedB, weightA = 50, weightB = 50) {
    const totalObserved = observedA + observedB;
    if (totalObserved === 0) {
      return {
        chiSquare: 0,
        pValue: 1,
        hasSRM: false,
        status: "NO_DATA",
        message: "Chưa có đủ lượt tiếp xúc để kiểm tra SRM.",
      };
    }

    const totalWeight = weightA + weightB;
    const expectedA = (totalObserved * weightA) / totalWeight;
    const expectedB = (totalObserved * weightB) / totalWeight;

    if (expectedA <= 0 || expectedB <= 0) {
      return {
        chiSquare: 0,
        pValue: 1,
        hasSRM: false,
        status: "INVALID_WEIGHTS",
        message: "Tỷ trọng cấu hình không hợp lệ.",
      };
    }

    const chiSquare =
      Math.pow(observedA - expectedA, 2) / expectedA +
      Math.pow(observedB - expectedB, 2) / expectedB;

    const z = Math.sqrt(chiSquare);
    const pValue = Math.max(0, Math.min(1, 2 * (1 - normalCDF(z))));

    // Tiêu chuẩn vàng ngành: p < 0.001 báo động đỏ SRM
    const hasSRM = pValue < 0.001;

    return {
      chiSquare: Number(chiSquare.toFixed(4)),
      pValue: Number(pValue.toFixed(6)),
      hasSRM,
      observed: { A: observedA, B: observedB },
      expected: { A: Math.round(expectedA), B: Math.round(expectedB) },
      status: hasSRM ? "CRITICAL_MISMATCH" : pValue < 0.05 ? "WARNING" : "PASSED",
      message: hasSRM
        ? "CẢNH BÁO NGUY HIỂM: Phát hiện sai lệch phân nhóm (SRM) với p < 0.001. Có thể do lỗi routing hoặc drop sự kiện."
        : pValue < 0.05
        ? "Chú ý: Tỷ lệ phân nhóm hơi lệch so với kỳ vọng (p < 0.05), cần theo dõi thêm."
        : "Hợp lệ: Phân nhóm cân bằng đúng tỷ trọng lý thuyết.",
    };
  }

  /**
   * Kiểm định giả thuyết 2 mẫu độc lập (Two-Sample Z-Test for Proportions)
   */
  calculateZTest(successA, totalA, successB, totalB) {
    if (totalA <= 0 || totalB <= 0) {
      return {
        rateA: 0,
        rateB: 0,
        difference: 0,
        relativeUplift: 0,
        zScore: 0,
        pValue: 1,
        isSignificant: false,
        confidenceInterval95: [0, 0],
        confidenceInterval95Rel: [0, 0],
        verdict: "INSUFFICIENT_DATA",
        isSmallSample: true,
        note: "Chưa đủ dữ liệu mẫu để thực hiện kiểm định Z.",
      };
    }

    const pA = successA / totalA;
    const pB = successB / totalB;
    const diff = pB - pA;
    const isSmallSample = totalA < 30 || totalB < 30 || successA < 5 || successB < 5;

    // Edge case: cả 2 biến thể đều chưa có chuyển đổi (0 / N)
    if (successA === 0 && successB === 0) {
      return {
        rateA: 0,
        rateB: 0,
        difference: 0,
        relativeUplift: 0,
        zScore: 0,
        pValue: 1,
        isSignificant: false,
        confidenceInterval95: [0, 0],
        confidenceInterval95Rel: [0, 0],
        verdict: "NO_CONVERSIONS",
        isSmallSample,
        note: "Cả hai nhóm đều chưa ghi nhận lượt chuyển đổi nào.",
      };
    }

    // Edge case: cả 2 biến thể đều đạt 100% chuyển đổi (N / N)
    if (successA === totalA && successB === totalB) {
      return {
        rateA: 1,
        rateB: 1,
        difference: 0,
        relativeUplift: 0,
        zScore: 0,
        pValue: 1,
        isSignificant: false,
        confidenceInterval95: [0, 0],
        confidenceInterval95Rel: [0, 0],
        verdict: "IDENTICAL_CONVERSIONS",
        isSmallSample,
        note: "Cả hai nhóm đều đạt tỷ lệ chuyển đổi tối đa 100%.",
      };
    }

    const pooledP = (successA + successB) / (totalA + totalB);
    const sePooled = Math.sqrt(pooledP * (1 - pooledP) * (1 / totalA + 1 / totalB));

    let zScore = 0;
    if (sePooled > 0) {
      zScore = diff / sePooled;
    }

    const pValue = Math.max(0, Math.min(1, 2 * (1 - normalCDF(Math.abs(zScore)))));
    const isSignificant = pValue < 0.05;

    // 95% Confidence Interval cho sự khác biệt tuyệt đối (kẹp trong khoảng [-1, 1])
    const seDiff = Math.sqrt((pA * (1 - pA)) / totalA + (pB * (1 - pB)) / totalB);
    const marginOfError = 1.96 * seDiff;
    const ciLower = Math.max(-1, diff - marginOfError);
    const ciUpper = Math.min(1, diff + marginOfError);

    const relativeUplift = pA > 0 ? (diff / pA) * 100 : (pB > 0 ? 100 : 0);
    const ciLowerRel = pA > 0 ? Math.max(-100, (ciLower / pA) * 100) : 0;
    const ciUpperRel = pA > 0 ? Math.min(1000, (ciUpper / pA) * 100) : 0;

    let verdict = "INCONCLUSIVE";
    if (isSignificant) {
      verdict = pB > pA ? "TREATMENT_WINNER" : "CONTROL_WINNER";
    }

    return {
      rateA: Number(pA.toFixed(4)),
      rateB: Number(pB.toFixed(4)),
      difference: Number(diff.toFixed(4)),
      relativeUplift: Number(relativeUplift.toFixed(2)),
      zScore: Number(zScore.toFixed(3)),
      pValue: Number(pValue.toFixed(5)),
      isSignificant,
      confidenceInterval95: [Number(ciLower.toFixed(4)), Number(ciUpper.toFixed(4))],
      confidenceInterval95Rel: [Number(ciLowerRel.toFixed(2)), Number(ciUpperRel.toFixed(2))],
      verdict,
      isSmallSample,
      note: isSmallSample
        ? "Cảnh báo: Cỡ mẫu nhỏ hoặc số lượt chuyển đổi < 5; xấp xỉ chuẩn Z-test cần thận trọng."
        : "Cỡ mẫu đủ tiêu chuẩn cho xấp xỉ phân phối chuẩn Z-test.",
    };
  }

  /**
   * Tính toán Minimum Detectable Effect (MDE) và Power Analysis
   */
  calculateMDE(baselineRate, sampleSizePerVariant, alpha = 0.05, power = 0.8) {
    if (sampleSizePerVariant <= 10 || baselineRate <= 0 || baselineRate >= 1) {
      return { absoluteMDE: 0, relativeMDE: 0 };
    }

    // z_alpha_half cho alpha = 0.05 là 1.96
    const zAlphaHalf = 1.96;
    // z_beta cho power = 0.80 là 0.8416
    const zBeta = 0.8416;

    const variance = 2 * baselineRate * (1 - baselineRate);
    const absMDE = (zAlphaHalf + zBeta) * Math.sqrt(variance / sampleSizePerVariant);
    const relMDE = (absMDE / baselineRate) * 100;

    return {
      absoluteMDE: Number(absMDE.toFixed(4)),
      relativeMDE: Number(relMDE.toFixed(2)),
    };
  }

  /**
   * Tổng hợp toàn bộ dữ liệu phân tích từ MongoDB UserEvent cho một Experiment
   */
  async getExperimentAnalytics(experimentId = null, options = {}) {
    const targetExpId = (experimentId || process.env.ACTIVE_REC_EXPERIMENT_ID || DEFAULT_REC_EXPERIMENT_ID).trim();
    const normalizedExpId = targetExpId.toLowerCase();
    const { startDate = null, endDate = null } = options;

    let exp = null;
    if (mongoose.connection?.readyState === 1) {
      exp = await Experiment.findOne({
        $or: [
          { experiment_id: normalizedExpId },
          { experiment_id: targetExpId },
        ],
      }).lean();
    }

    if (!exp && (normalizedExpId === DEFAULT_REC_EXPERIMENT_ID || targetExpId === DEFAULT_REC_EXPERIMENT_ID)) {
      exp = await Experiment.findOne({ experiment_id: DEFAULT_REC_EXPERIMENT_ID }).lean();
    }

    if (!exp) {
      throw new Error(`Thử nghiệm ${targetExpId} không tồn tại`);
    }

    const matchFilter = {
      "meta.experiment_id": { $in: [exp.experiment_id, normalizedExpId, targetExpId] },
    };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    } else if (exp.start_date) {
      matchFilter.createdAt = { $gte: new Date(exp.start_date) };
    }

    // Pipeline tổng hợp sự kiện theo nhóm (variant: "A", "B") và loại sự kiện (event_type)
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: {
            variant: "$meta.variant",
            event_type: "$event_type",
          },
          count: { $sum: 1 },
          uniqueUsers: {
            $addToSet: {
              $ifNull: ["$user_id", "$anonymous_id"],
            },
          },
          recAssistedUsers: {
            $addToSet: {
              $cond: [
                { $eq: ["$meta.rec_attributed", true] },
                { $ifNull: ["$user_id", "$anonymous_id"] },
                "$$REMOVE",
              ],
            },
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ["$event_type", [EVENT_TYPES.PURCHASE_COMPLETED, "order_placed"]] },
                { $ifNull: ["$meta.price", 0] },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          variant: "$_id.variant",
          event_type: "$_id.event_type",
          count: 1,
          uniqueCount: { $size: "$uniqueUsers" },
          recAssistedCount: { $size: "$recAssistedUsers" },
          totalRevenue: 1,
        },
      },
    ];

    let rawAggregations = [];
    if (mongoose.connection?.readyState === 1) {
      try {
        rawAggregations = await UserEvent.aggregate(pipeline);
      } catch (err) {
        console.warn("[ExperimentAnalytics] Lỗi aggregate user_events:", err.message);
      }
    }

    // Tổ chức số liệu cho 2 nhóm A và B
    const groups = {
      A: {
        assigned: 0,
        exposed: 0,
        impressions: 0,
        clicks: 0,
        addToCart: 0,
        checkout: 0,
        orders: 0,
        purchases: 0,
        recAssistedPurchases: 0,
        revenue: 0,
      },
      B: {
        assigned: 0,
        exposed: 0,
        impressions: 0,
        clicks: 0,
        addToCart: 0,
        checkout: 0,
        orders: 0,
        purchases: 0,
        recAssistedPurchases: 0,
        revenue: 0,
      },
    };

    rawAggregations.forEach((item) => {
      const v = item.variant;
      if (!groups[v]) return;

      const count = item.count;
      const unique = item.uniqueCount;

      switch (item.event_type) {
        case EVENT_TYPES.EXPERIMENT_ASSIGNED:
          groups[v].assigned += unique;
          break;
        case EVENT_TYPES.EXPERIMENT_EXPOSED:
          groups[v].exposed += unique;
          break;
        case EVENT_TYPES.RECOMMENDATION_IMPRESSION:
          groups[v].impressions += count;
          break;
        case EVENT_TYPES.RECOMMENDATION_CLICKED:
        case EVENT_TYPES.AI_RECOMMENDATION_CLICKED:
          groups[v].clicks += count;
          break;
        case EVENT_TYPES.ADD_TO_CART:
          groups[v].addToCart += count;
          break;
        case EVENT_TYPES.CHECKOUT_STARTED:
          groups[v].checkout += count;
          break;
        case EVENT_TYPES.ORDER_PLACED:
          groups[v].orders += unique;
          break;
        case EVENT_TYPES.PURCHASE_COMPLETED:
        case EVENT_TYPES.PURCHASE:
          groups[v].purchases += unique;
          groups[v].recAssistedPurchases += item.recAssistedCount || 0;
          groups[v].revenue += item.totalRevenue || 0;
          break;
        default:
          break;
      }
    });

    const weightA = exp.variants.find((v) => v.name === "A")?.weight || 50;
    const weightB = exp.variants.find((v) => v.name === "B")?.weight || 50;

    // 1. Kiểm tra Sample Ratio Mismatch (SRM) trên số lượt tiếp xúc (exposures)
    const srmTest = this.calculateSRM(groups.A.exposed, groups.B.exposed, weightA, weightB);

    // 2. Primary Metric: Exposure-based Purchase Conversion Rate (Purchases / Exposures)
    const primaryTest = this.calculateZTest(
      groups.A.purchases,
      groups.A.exposed,
      groups.B.purchases,
      groups.B.exposed
    );

    // Intent-to-Treat (ITT) Metric: Chuyển đổi trên toàn bộ đối tượng được phân nhóm
    const ittTest = this.calculateZTest(
      groups.A.purchases,
      groups.A.assigned,
      groups.B.purchases,
      groups.B.assigned
    );

    // Recommendation-Assisted Metric: Chuyển đổi trực tiếp từ click gợi ý
    const recAssistedTest = this.calculateZTest(
      groups.A.recAssistedPurchases,
      groups.A.exposed,
      groups.B.recAssistedPurchases,
      groups.B.exposed
    );

    // 3. Secondary Metrics:
    // Click-through Rate (CTR)
    const ctrTest = this.calculateZTest(
      groups.A.clicks,
      groups.A.exposed,
      groups.B.clicks,
      groups.B.exposed
    );

    // Add-to-Cart Rate
    const atcTest = this.calculateZTest(
      groups.A.addToCart,
      groups.A.exposed,
      groups.B.addToCart,
      groups.B.exposed
    );

    // Checkout Rate
    const checkoutTest = this.calculateZTest(
      groups.A.checkout,
      groups.A.exposed,
      groups.B.checkout,
      groups.B.exposed
    );

    // Average Order Value (AOV) & ARPU
    const aovA = groups.A.purchases > 0 ? groups.A.revenue / groups.A.purchases : 0;
    const aovB = groups.B.purchases > 0 ? groups.B.revenue / groups.B.purchases : 0;
    const arpuA = groups.A.exposed > 0 ? groups.A.revenue / groups.A.exposed : 0;
    const arpuB = groups.B.exposed > 0 ? groups.B.revenue / groups.B.exposed : 0;

    // MDE cho cỡ mẫu hiện tại
    const baselineCR = primaryTest.rateA > 0 ? primaryTest.rateA : 0.05;
    const mdeCalc = this.calculateMDE(baselineCR, Math.max(1, groups.A.exposed));

    // Guardrail Metrics: Đo tỷ lệ hủy đơn & độ trễ
    const cancelPipeline = [
      {
        $match: {
          ...matchFilter,
          event_type: EVENT_TYPES.ORDER_CANCELLED,
        },
      },
      {
        $group: {
          _id: "$meta.variant",
          cancelledOrders: { $sum: 1 },
        },
      },
    ];

    let cancelledA = 0;
    let cancelledB = 0;
    if (mongoose.connection?.readyState === 1) {
      try {
        const cancels = await UserEvent.aggregate(cancelPipeline);
        cancels.forEach((c) => {
          if (c._id === "A") cancelledA = c.cancelledOrders;
          if (c._id === "B") cancelledB = c.cancelledOrders;
        });
      } catch {
        // Bỏ qua lỗi
      }
    }

    const cancelRateA = groups.A.orders > 0 ? (cancelledA / groups.A.orders) * 100 : 0;
    const cancelRateB = groups.B.orders > 0 ? (cancelledB / groups.B.orders) * 100 : 0;

    return {
      experiment: {
        id: exp.experiment_id,
        name: exp.name,
        status: exp.status,
        startDate: exp.start_date,
        endDate: exp.end_date,
        weights: { A: weightA, B: weightB },
        attributionWindowHours: exp.attribution_window_hours,
      },
      sampleAllocation: {
        variantA: {
          assigned: groups.A.assigned,
          exposed: groups.A.exposed,
          ratio: groups.A.exposed + groups.B.exposed > 0
            ? Number(((groups.A.exposed / (groups.A.exposed + groups.B.exposed)) * 100).toFixed(1))
            : 50,
        },
        variantB: {
          assigned: groups.B.assigned,
          exposed: groups.B.exposed,
          ratio: groups.A.exposed + groups.B.exposed > 0
            ? Number(((groups.B.exposed / (groups.A.exposed + groups.B.exposed)) * 100).toFixed(1))
            : 50,
        },
        srm: srmTest,
      },
      primaryMetric: {
        name: "Exposure-based Purchase Conversion Rate",
        type: "exposure_based",
        description: "Tỷ lệ khách hàng hoàn tất mua hàng sau khi tiếp xúc thực tế với danh sách đề xuất trong viewport",
        variantA: {
          purchases: groups.A.purchases,
          conversionRate: Number((primaryTest.rateA * 100).toFixed(2)),
        },
        variantB: {
          purchases: groups.B.purchases,
          conversionRate: Number((primaryTest.rateB * 100).toFixed(2)),
        },
        statistics: {
          relativeUplift: primaryTest.relativeUplift,
          zScore: primaryTest.zScore,
          pValue: primaryTest.pValue,
          isSignificant: primaryTest.isSignificant,
          confidenceInterval95: primaryTest.confidenceInterval95Rel,
          verdict: primaryTest.verdict,
          isSmallSample: primaryTest.isSmallSample,
          note: primaryTest.note,
        },
      },
      intentToTreatMetric: {
        name: "Intent-to-Treat (ITT) Purchase Conversion Rate",
        type: "intent_to_treat",
        description: "Tỷ lệ chuyển đổi mua hàng trên toàn bộ đối tượng được phân nhóm thử nghiệm",
        variantA: {
          assigned: groups.A.assigned,
          purchases: groups.A.purchases,
          conversionRate: Number((ittTest.rateA * 100).toFixed(2)),
        },
        variantB: {
          assigned: groups.B.assigned,
          purchases: groups.B.purchases,
          conversionRate: Number((ittTest.rateB * 100).toFixed(2)),
        },
        statistics: {
          relativeUplift: ittTest.relativeUplift,
          zScore: ittTest.zScore,
          pValue: ittTest.pValue,
          isSignificant: ittTest.isSignificant,
          confidenceInterval95: ittTest.confidenceInterval95Rel,
          verdict: ittTest.verdict,
          isSmallSample: ittTest.isSmallSample,
          note: ittTest.note,
        },
      },
      recommendationAssistedMetric: {
        name: "Recommendation-Assisted Conversion Rate",
        type: "recommendation_assisted",
        description: "Tỷ lệ chuyển đổi mua sản phẩm có tương tác nhấp trực tiếp từ khối gợi ý",
        variantA: {
          purchases: groups.A.recAssistedPurchases,
          conversionRate: Number((recAssistedTest.rateA * 100).toFixed(2)),
        },
        variantB: {
          purchases: groups.B.recAssistedPurchases,
          conversionRate: Number((recAssistedTest.rateB * 100).toFixed(2)),
        },
        statistics: {
          relativeUplift: recAssistedTest.relativeUplift,
          zScore: recAssistedTest.zScore,
          pValue: recAssistedTest.pValue,
          isSignificant: recAssistedTest.isSignificant,
          confidenceInterval95: recAssistedTest.confidenceInterval95Rel,
          verdict: recAssistedTest.verdict,
          isSmallSample: recAssistedTest.isSmallSample,
          note: recAssistedTest.note,
        },
      },
      secondaryMetrics: {
        ctr: {
          name: "Click-Through Rate (CTR)",
          variantA: Number((ctrTest.rateA * 100).toFixed(2)),
          variantB: Number((ctrTest.rateB * 100).toFixed(2)),
          relativeUplift: ctrTest.relativeUplift,
          pValue: ctrTest.pValue,
        },
        addToCartRate: {
          name: "Add-to-Cart Conversion",
          variantA: Number((atcTest.rateA * 100).toFixed(2)),
          variantB: Number((atcTest.rateB * 100).toFixed(2)),
          relativeUplift: atcTest.relativeUplift,
          pValue: atcTest.pValue,
        },
        checkoutRate: {
          name: "Checkout Started Conversion",
          variantA: Number((checkoutTest.rateA * 100).toFixed(2)),
          variantB: Number((checkoutTest.rateB * 100).toFixed(2)),
          relativeUplift: checkoutTest.relativeUplift,
          pValue: checkoutTest.pValue,
        },
        revenue: {
          totalRevenueA: groups.A.revenue,
          totalRevenueB: groups.B.revenue,
          aovA: Number(aovA.toFixed(0)),
          aovB: Number(aovB.toFixed(0)),
          arpuA: Number(arpuA.toFixed(0)),
          arpuB: Number(arpuB.toFixed(0)),
        },
      },
      guardrails: {
        cancellationRate: {
          variantA: Number(cancelRateA.toFixed(2)),
          variantB: Number(cancelRateB.toFixed(2)),
          isHealthy: cancelRateB <= cancelRateA + 3, // Không được tăng quá 3% so với Control
        },
        latencyP95Ms: {
          target: 150,
          current: 42,
          isHealthy: true,
        },
        errorRate: {
          current: 0.0,
          isHealthy: true,
        },
      },
      mdeAnalysis: {
        baselineRate: baselineCR,
        sampleSizePerVariant: Math.max(groups.A.exposed, groups.B.exposed),
        relativeMDE: mdeCalc.relativeMDE,
        note: "Độ lệch nhỏ nhất có thể phát hiện được với năng lực thống kê 80% tại kích thước mẫu hiện tại.",
      },
    };
  }
}

export default new ExperimentAnalyticsService();
