import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import experimentService, { DEFAULT_REC_EXPERIMENT_ID } from "../modules/recommendations/experiments/experiment.service.js";
import experimentAnalyticsService from "../modules/recommendations/experiments/experimentAnalytics.service.js";
import Experiment from "../modules/recommendations/experiments/experiment.model.js";
import Product from "../modules/products/product.model.js";
import User from "../modules/users/user.model.js";
import UserEvent from "../modules/tracking/userEvent.model.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runRealDataABVerification() {
  console.log("================================================================================");
  console.log("🧪 A/B & A/A TESTING FRAMEWORK: 12 PRODUCTION VERIFICATION SCENARIOS");
  console.log("================================================================================\n");

  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();
  console.log("✅ MongoDB và Redis đã kết nối thành công.\n");

  // Đảm bảo experiment mặc định tồn tại ở trạng thái running
  let exp = await Experiment.findOne({ experiment_id: DEFAULT_REC_EXPERIMENT_ID });
  if (!exp) {
    exp = await Experiment.create({
      experiment_id: DEFAULT_REC_EXPERIMENT_ID,
      name: "Hybrid AI Recommendation vs Traditional Recs",
      description: "So sánh thuật toán AI cá nhân hóa đa tầng với gợi ý phổ biến truyền thống",
      status: "running",
      salt: "wf_fashion_recs_2026",
      variants: [
        { name: "A", weight: 50, algorithm: "control_popular" },
        { name: "B", weight: 50, algorithm: "treatment_personalized" },
      ],
      attribution_window_hours: 24,
      traffic_allocation: 100,
    });
    console.log("✨ Đã khởi tạo cấu hình thử nghiệm chuẩn rec_ai_vs_traditional_v1");
  } else {
    exp.status = "running";
    exp.variants = [
      { name: "A", weight: 50, algorithm: "control_popular" },
      { name: "B", weight: 50, algorithm: "treatment_personalized" },
    ];
    await exp.save();
  }
  await experimentService.invalidateExperimentCache(DEFAULT_REC_EXPERIMENT_ID);

  const testProduct = (await Product.findOne({ is_active: true }).lean()) || {
    _id: new mongoose.Types.ObjectId(),
    name: "Classic Linen Shirt",
    price: 350000,
  };

  const results = [];

  // ---------------------------------------------------------------------------
  // SCENARIO 1: DETERMINISTIC ASSIGNMENT HASH DISTRIBUTION
  // ---------------------------------------------------------------------------
  console.log("▶ [Scenario 1] Kiểm tra Phân nhóm Tất định (Deterministic Hash Assignment)");
  let countA = 0;
  let countB = 0;
  const sampleCount = 1000;
  for (let i = 0; i < sampleCount; i++) {
    const subId = `subject_e2e_sim_${i}_seed`;
    const bucket = experimentService.computeHashBucket(subId, exp.salt, exp.experiment_id);
    if (bucket < 50) countA++;
    else countB++;
  }
  const srmSim = experimentAnalyticsService.calculateSRM(countA, countB, 50, 50);
  const s1Passed = countA >= 450 && countA <= 550 && !srmSim.hasSRM && srmSim.pValue > 0.05;
  console.log(`   - 1,000 subjects hash: A = ${countA} (${(countA/10).toFixed(1)}%), B = ${countB} (${(countB/10).toFixed(1)}%)`);
  console.log(`   - SRM Chi-Square: ${srmSim.chiSquare}, p-value: ${srmSim.pValue} => ${srmSim.status}`);
  results.push({ scenario: 1, name: "Deterministic Hash & Balance", passed: s1Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: RELOAD STABILITY (STICKY CACHE)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 2] Kiểm tra Độ ổn định khi tải lại trang (Sticky Cache Across Reloads)");
  const testAnonId = "anon_client_session_99999_uuid";
  const assign1 = await experimentService.assignVariant(testAnonId);
  let stickyConsistent = true;
  for (let i = 0; i < 50; i++) {
    const reassign = await experimentService.assignVariant(testAnonId);
    if (reassign.variant !== assign1.variant) {
      stickyConsistent = false;
      break;
    }
  }
  console.log(`   - Variant ban đầu: ${assign1.variant}, 50 lượt gọi liên tiếp cùng ra: ${assign1.variant} (Consistent: ${stickyConsistent})`);
  results.push({ scenario: 2, name: "Sticky Assignment Invariance", passed: stickyConsistent });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: ANONYMOUS-TO-USER IDENTITY TRANSITION
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 3] Chuyển đổi danh tính ẩn danh sang tài khoản (bindIdentity)");
  const anonVisitor = "anon_visitor_trans_1001";
  const registeredUser = "user_member_trans_1001";
  const anonAssigned = await experimentService.assignVariant(anonVisitor);
  await experimentService.bindIdentity(anonVisitor, registeredUser);
  const userAssigned = await experimentService.assignVariant(registeredUser, {
    userId: registeredUser,
    anonymousId: anonVisitor,
  });
  const s3Passed = userAssigned.variant === anonAssigned.variant;
  console.log(`   - Khách ẩn danh gán: ${anonAssigned.variant} => Đăng nhập gán: ${userAssigned.variant} (Match: ${s3Passed})`);
  results.push({ scenario: 3, name: "Anonymous-to-User Identity Binding", passed: s3Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: VIEWPORT EXPOSURE & ANTI-TAMPERING
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 4] Ghi nhận tiếp xúc thực tế khi vào Viewport & Chống giả mạo Variant");
  const expSubject = "user_viewport_subject_4001";
  const expectedVariant = (await experimentService.assignVariant(expSubject, { experimentId: exp.experiment_id })).variant;
  if (redis) {
    await redis.del(`exp:exposed:${exp.experiment_id}:${expectedVariant}:${expSubject}`);
    await redis.del(`exp:exposure:${expSubject}`);
  }
  const firstExposure = await experimentService.recordExposure({
    subjectId: expSubject,
    experimentId: exp.experiment_id,
    variant: expectedVariant,
  });
  // Lần thứ hai trong 30 phút phải bị dedup
  const secondExposure = await experimentService.recordExposure({
    subjectId: expSubject,
    experimentId: exp.experiment_id,
    variant: expectedVariant,
  });
  const s4Passed = firstExposure === true && secondExposure === false;
  console.log(`   - Lượt tiếp xúc 1: ${firstExposure} (recorded), Lượt tiếp xúc 2: ${secondExposure} (deduped successfully)`);
  results.push({ scenario: 4, name: "Viewport Exposure & Deduplication", passed: s4Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 5: RECOMMENDATION ITEM TOUCH TRACKING
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 5] Ghi nhận Click tương tác sản phẩm gợi ý (Product Touch)");
  const touchUser = "user_touch_buyer_5001";
  await experimentService.recordProductTouch({
    subjectId: touchUser,
    userId: touchUser,
    productId: testProduct._id,
    variant: "B",
  });
  let touchExistsInRedis = false;
  if (redis) {
    const raw = await redis.get(`exp:touch:${touchUser}:${testProduct._id}`);
    touchExistsInRedis = !!raw;
  }
  console.log(`   - Key Redis exp:touch:${touchUser}:${testProduct._id} tồn tại: ${touchExistsInRedis}`);
  results.push({ scenario: 5, name: "Recommendation Product Touch", passed: touchExistsInRedis });

  // ---------------------------------------------------------------------------
  // SCENARIO 6: PURCHASE ATTRIBUTION WITHIN 24H WINDOW
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 6] Quy kết đơn hàng trong Cửa sổ 24 giờ (Attribution Resolution)");
  const attrRes = await experimentService.resolveOrderAttribution(touchUser, [
    { product_id: testProduct._id, price: testProduct.price, quantity: 1 },
  ]);
  const s6Passed =
    attrRes?.experiment_id === DEFAULT_REC_EXPERIMENT_ID &&
    attrRes?.variant === "B" &&
    attrRes?.is_direct_rec_assisted === true &&
    attrRes?.attribution_type === "rec_assisted";
  console.log(`   - Attribution result: variant = ${attrRes?.variant}, rec_assisted = ${attrRes?.is_direct_rec_assisted}, type = ${attrRes?.attribution_type}`);
  results.push({ scenario: 6, name: "24h Purchase Attribution (Rec-assisted)", passed: s6Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 7: ATTRIBUTION OUTSIDE 24H WINDOW (EXPIRED TOUCH)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 7] Kiểm tra Ngoài cửa sổ 24 giờ (Không quy kết rec_assisted)");
  const outsideUser = "user_outside_window_7001";
  // Người này không có touch trong Redis
  const nonAssistedAttr = await experimentService.resolveOrderAttribution(outsideUser, [
    { product_id: testProduct._id, price: testProduct.price, quantity: 1 },
  ]);
  const s7Passed = !nonAssistedAttr?.is_direct_rec_assisted;
  console.log(`   - Khách không tương tác rec: rec_assisted = ${nonAssistedAttr?.is_direct_rec_assisted}, type = ${nonAssistedAttr?.attribution_type || "itt_only"}`);
  results.push({ scenario: 7, name: "Non-assisted Attribution Isolation", passed: s7Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 8: A/A TEST SIMULATION (NO FALSE POSITIVE)
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 8] A/A Testing: Cả 2 nhóm cùng chạy Control (Không dương tính giả)");
  // Giả lập 1,000 lượt ở mỗi nhóm với tỷ lệ chuyển đổi tự nhiên ~5.0% vs 5.2%
  const aaZTest = experimentAnalyticsService.calculateZTest(50, 1000, 52, 1000);
  const s8Passed = !aaZTest.isSignificant && aaZTest.pValue >= 0.05 && aaZTest.verdict === "INCONCLUSIVE";
  console.log(`   - A/A CR: A = ${(aaZTest.rateA*100).toFixed(1)}%, B = ${(aaZTest.rateB*100).toFixed(1)}%`);
  console.log(`   - z-Score: ${aaZTest.zScore}, p-value: ${aaZTest.pValue} => Significance: ${aaZTest.isSignificant}`);
  results.push({ scenario: 8, name: "A/A Test False Discovery Guard", passed: s8Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 9: SAMPLE RATIO MISMATCH ANOMALY DETECTION
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 9] Phát hiện Bất thường Tỷ lệ Phân nhóm (SRM Critical Alert)");
  const srmMismatch = experimentAnalyticsService.calculateSRM(700, 300, 50, 50);
  const s9Passed = srmMismatch.hasSRM === true && srmMismatch.pValue < 0.001;
  console.log(`   - SRM Test (700 vs 300): Chi-Square = ${srmMismatch.chiSquare}, p-value = ${srmMismatch.pValue} => ${srmMismatch.status}`);
  results.push({ scenario: 9, name: "SRM Anomaly Detection (p < 0.001)", passed: s9Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 10: EMERGENCY ROLLBACK & KILL-SWITCH
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 10] Cơ chế Rollback Khẩn cấp (100% Control A, isAssigned = false)");
  await experimentService.updateExperimentStatus(DEFAULT_REC_EXPERIMENT_ID, {
    rollbackToControl: true,
  });
  const emergencyCheck = await experimentService.assignVariant("user_emergency_probe_01");
  const s10Passed = emergencyCheck.variant === "A" && emergencyCheck.algorithm === "control_popular" && emergencyCheck.isAssigned === false;
  console.log(`   - Sau rollback: variant = ${emergencyCheck.variant}, algorithm = ${emergencyCheck.algorithm}, isAssigned = ${emergencyCheck.isAssigned}`);
  results.push({ scenario: 10, name: "Emergency Rollback Kill-switch", passed: s10Passed });

  // Khôi phục trạng thái running cho các test tiếp theo
  await experimentService.updateExperimentStatus(DEFAULT_REC_EXPERIMENT_ID, {
    status: "running",
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 11: MULTI-INSTANCE REDIS CACHE VERSION INVALIDATION
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 11] Đồng bộ Đa Instance qua Redis Version Invalidation");
  let versionBefore = 0;
  if (redis) {
    versionBefore = parseInt((await redis.get(`exp:config:version:${DEFAULT_REC_EXPERIMENT_ID}`)) || "0", 10);
  }
  await experimentService.invalidateExperimentCache(DEFAULT_REC_EXPERIMENT_ID);
  let versionAfter = 0;
  if (redis) {
    versionAfter = parseInt((await redis.get(`exp:config:version:${DEFAULT_REC_EXPERIMENT_ID}`)) || "0", 10);
  }
  const s11Passed = versionAfter > versionBefore;
  console.log(`   - Redis config version: ${versionBefore} -> ${versionAfter} (Incremented: ${s11Passed})`);
  results.push({ scenario: 11, name: "Multi-Instance Cache Invalidation", passed: s11Passed });

  // ---------------------------------------------------------------------------
  // SCENARIO 12: USER CONSENT REVOCATION / DENIAL BYPASS
  // ---------------------------------------------------------------------------
  console.log("\n▶ [Scenario 12] Quyền Riêng tư: Người dùng từ chối theo dõi (consentStatus: denied)");
  const consentDeniedUser = await experimentService.assignVariant("user_privacy_optout_999", {
    consentStatus: "denied",
  });
  const s12Passed =
    consentDeniedUser.variant === "A" &&
    consentDeniedUser.algorithm === "control_popular" &&
    consentDeniedUser.isAssigned === false &&
    consentDeniedUser.reason === "consent_denied";
  console.log(`   - Khách từ chối: variant = ${consentDeniedUser.variant}, reason = ${consentDeniedUser.reason}, isAssigned = ${consentDeniedUser.isAssigned}`);
  results.push({ scenario: 12, name: "Privacy Consent Denial Guard", passed: s12Passed });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("📊 KẾT QUẢ KIỂM CHỨNG 12 KỊCH BẢN THỰC TẾ TRÊN DATABASE & REDIS");
  console.log("================================================================================");
  let allPassed = true;
  results.forEach((r) => {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} | Scenario ${String(r.scenario).padStart(2, "0")}: ${r.name}`);
    if (!r.passed) allPassed = false;
  });
  console.log("================================================================================");
  console.log(`KẾT LUẬN CUỐI CÙNG: ${allPassed ? "TẤT CẢ 12 KỊCH BẢN ĐẠT CHUẨN (100% PASS)" : "CÓ KỊCH BẢN THẤT BẠI"}`);
  console.log("================================================================================\n");

  // Đảm bảo experiment A/A Staging ở trạng thái draft
  await Experiment.updateOne(
    { $or: [{ experiment_id: "AA_Recommendation_Validation" }, { experiment_id: "aa_recommendation_validation" }] },
    { $set: { status: "draft" } }
  );
  await experimentService.invalidateExperimentCache("AA_Recommendation_Validation");

  if (redis) await redis.quit();
  await mongoose.disconnect();
}

runRealDataABVerification().catch((err) => {
  console.error("❌ Lỗi thực thi kịch bản kiểm chứng:", err);
  process.exit(1);
});
