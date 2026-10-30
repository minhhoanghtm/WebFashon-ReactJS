import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../configs/db.js";
import { getRedisConnection } from "../configs/redis.js";
import Experiment from "../modules/recommendations/experiments/experiment.model.js";
import experimentService from "../modules/recommendations/experiments/experiment.service.js";

export const STAGING_AA_EXP_ID = "AA_Recommendation_Validation";

export async function setupStagingAAExperiment({ initialStatus = "draft" } = {}) {
  await connectDB();
  const redis = getRedisConnection();
  if (redis) await redis.ping();

  console.log("================================================================================");
  console.log("🚀 SETUP EXPERIMENT A/A TESTING TRÊN MÔI TRƯỜNG STAGING");
  console.log("================================================================================");

  // Tìm hoặc tạo mới experiment
  let exp = await Experiment.findOne({
    $or: [
      { experiment_id: STAGING_AA_EXP_ID },
      { experiment_id: STAGING_AA_EXP_ID.toLowerCase() },
    ],
  });

  const experimentData = {
    experiment_id: STAGING_AA_EXP_ID.toLowerCase(),
    name: "A/A Testing: Thuật toán Gợi ý Sản phẩm (Staging)",
    description:
      "Xác thực tính ổn định và cân bằng hệ thống thử nghiệm (Staging). Cả 2 biến thể A và B đều chạy thuật toán Gợi ý phổ biến (control_popular) để kiểm định Zero False Discovery trước khi kích hoạt A/B với người dùng thật.",
    status: initialStatus, // Mặc định ở trạng thái DRAFT theo yêu cầu
    salt: "staging_aa_validation_salt_2026",
    variants: [
      {
        name: "A",
        weight: 50,
        description: "Group A (50%): Thuật toán Gợi ý phổ biến truyền thống (Control)",
        algorithm: "control_popular",
      },
      {
        name: "B",
        weight: 50,
        description: "Group B (50%): Thuật toán Gợi ý phổ biến truyền thống (A/A Validation)",
        algorithm: "control_popular",
      },
    ],
    attribution_window_hours: 24,
    traffic_allocation: 100,
  };

  if (!exp) {
    exp = await Experiment.create(experimentData);
    console.log(`✨ Đã tạo mới Experiment '${STAGING_AA_EXP_ID}' ở trạng thái '${initialStatus}'`);
  } else {
    exp.name = experimentData.name;
    exp.description = experimentData.description;
    exp.variants = experimentData.variants;
    exp.attribution_window_hours = experimentData.attribution_window_hours;
    exp.traffic_allocation = experimentData.traffic_allocation;
    exp.status = initialStatus;
    await exp.save();
    console.log(`🔄 Đã cập nhật Experiment '${STAGING_AA_EXP_ID}' về trạng thái '${initialStatus}'`);
  }

  await experimentService.invalidateExperimentCache(STAGING_AA_EXP_ID);
  console.log("🧹 Đã làm sạch cache cấu hình thử nghiệm và sticky cache trên Redis & In-Memory.");

  console.log("\n📋 THÔNG SỐ CẤU HÌNH HIỆN TẠI:");
  console.log(`- Experiment ID: ${exp.experiment_id} (Alias: ${STAGING_AA_EXP_ID})`);
  console.log(`- Tên thử nghiệm: ${exp.name}`);
  console.log(`- Trạng thái: ${exp.status.toUpperCase()}`);
  console.log(`- Nhánh A: ${exp.variants[0].weight}% - Thuật toán: ${exp.variants[0].algorithm}`);
  console.log(`- Nhánh B: ${exp.variants[1].weight}% - Thuật toán: ${exp.variants[1].algorithm}`);
  console.log(`- Cửa sổ quy kết: ${exp.attribution_window_hours} giờ`);
  console.log(`- Tỷ lệ lưu lượng phân bổ: ${exp.traffic_allocation}%`);
  console.log("================================================================================\n");

  return exp;
}

// Chạy trực tiếp nếu file được gọi từ CLI
if (process.argv[1] && process.argv[1].endsWith("setup-staging-aa-experiment.js")) {
  setupStagingAAExperiment({ initialStatus: "draft" })
    .then(async () => {
      const redis = getRedisConnection();
      if (redis) await redis.quit();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Lỗi cấu hình Staging A/A Experiment:", err);
      process.exit(1);
    });
}
