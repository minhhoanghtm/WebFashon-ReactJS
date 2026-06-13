import mongoose from "mongoose";
import dotenv from "dotenv";
import Voucher from "../modules/vouchers/voucher.model.js";
import UserVoucher from "../modules/vouchers/userVoucher.model.js";
import voucherService from "../modules/vouchers/voucher.service.js";
import { connectDB } from "../configs/db.js";
import getRedisConnection from "../configs/redis.js";

dotenv.config();

const runTest = async () => {
  console.log("🧪 BẮT ĐẦU TEST CHỐNG RACE CONDITION VOUCHER...");
  
  // 1. Kết nối DB và Redis
  await connectDB();
  const redis = getRedisConnection();
  
  try {
    // 2. Tạo Voucher mẫu giới hạn số lượng là 3
    console.log("\n1️⃣ Thiết lập dữ liệu test...");
    await Voucher.deleteMany({ code: "RACETEST" });
    const voucher = await Voucher.create({
      code: "RACETEST",
      name: "Race Condition Test Voucher",
      description: "Dùng để kiểm thử hệ thống chịu tải và chống nhận vượt số lượng",
      discountType: "fixed",
      discountValue: 20000,
      totalQuantity: 3,
      remainingQuantity: 3,
      startDate: new Date(Date.now() - 3600000), // Bắt đầu từ 1 tiếng trước
      endDate: new Date(Date.now() + 3600000 * 24), // Kết thúc sau 24 tiếng
      status: "ACTIVE",
    });
    console.log(`✅ Đã tạo Voucher RACETEST với tổng số lượng: ${voucher.totalQuantity}`);

    // Tạo các UserIDs giả lập
    const userIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
    ];
    await UserVoucher.deleteMany({ voucherId: voucher._id });

    // ----------------------------------------------------
    // KỊCH BẢN 1: 5 Người Dùng Khác Nhau Săn Cùng 1 Lúc (Voucher chỉ có 3 lượt)
    // ----------------------------------------------------
    console.log("\n2️⃣ KỊCH BẢN 1: Gửi đồng thời 5 request claim từ 5 users khác nhau...");
    const claimPromises = userIds.map((userId) => 
      voucherService.claimVoucher(userId.toString(), voucher._id.toString())
        .then((res) => ({ success: true, userId: userId.toString(), msg: "Claim thành công!" }))
        .catch((err) => ({ success: false, userId: userId.toString(), msg: err.message }))
    );

    const results = await Promise.all(claimPromises);
    
    console.log("\n📊 Kết quả các request chạy đồng thời:");
    results.forEach((r, idx) => {
      console.log(`   Req ${idx + 1} (User ${r.userId.substring(18)}): [${r.success ? "SUCCESS" : "FAILED"}] -> ${r.msg}`);
    });

    const updatedVoucher = await Voucher.findById(voucher._id);
    const totalClaimsInDB = await UserVoucher.countDocuments({ voucherId: voucher._id });

    console.log(`\n🔍 Trạng thái voucher sau kịch bản 1:`);
    console.log(`   - Số lượng còn lại trên DB: ${updatedVoucher.remainingQuantity}`);
    console.log(`   - Số lượng đã nhận trong DB: ${updatedVoucher.claimedQuantity}`);
    console.log(`   - Số bản ghi UserVoucher đã được tạo: ${totalClaimsInDB}`);

    if (updatedVoucher.remainingQuantity === 0 && totalClaimsInDB === 3) {
      console.log("🎉 KẾT QUẢ: Thành công! Chỉ có đúng 3 users nhận được voucher. Không có hiện tượng nhận vượt số lượng (Over-claim)!");
    } else {
      console.log("❌ KẾT QUẢ: Thất bại! Hệ thống để xảy ra lỗi race condition về số lượng.");
    }

    // ----------------------------------------------------
    // KỊCH BẢN 2: 1 Người Dùng Gửi Đồng Thời 5 Requests Nhận Voucher (Voucher đã tạo mới)
    // ----------------------------------------------------
    console.log("\n3️⃣ KỊCH BẢN 2: Một người dùng gửi đồng thời 5 request spam nhận cùng 1 voucher...");
    
    await Voucher.deleteMany({ code: "SPAMTEST" });
    const spamVoucher = await Voucher.create({
      code: "SPAMTEST",
      name: "Spam Test Voucher",
      description: "Dùng để kiểm thử chặn spam 1 user nhận nhiều lần",
      discountType: "fixed",
      discountValue: 10000,
      totalQuantity: 10,
      remainingQuantity: 10,
      startDate: new Date(Date.now() - 3600000),
      endDate: new Date(Date.now() + 3600000 * 24),
      status: "ACTIVE",
    });

    const spamUserId = new mongoose.Types.ObjectId();
    await UserVoucher.deleteMany({ voucherId: spamVoucher._id });

    const spamPromises = Array.from({ length: 5 }).map((_, idx) => 
      voucherService.claimVoucher(spamUserId.toString(), spamVoucher._id.toString())
        .then((res) => ({ success: true, index: idx + 1, msg: "Nhận thành công!" }))
        .catch((err) => ({ success: false, index: idx + 1, msg: err.message }))
    );

    const spamResults = await Promise.all(spamPromises);

    console.log("\n📊 Kết quả các request spam chạy đồng thời:");
    spamResults.forEach((r) => {
      console.log(`   Spam Req ${r.index}: [${r.success ? "SUCCESS" : "FAILED"}] -> ${r.msg}`);
    });

    const totalSpamClaimsInDB = await UserVoucher.countDocuments({ userId: spamUserId, voucherId: spamVoucher._id });
    const finalSpamVoucher = await Voucher.findById(spamVoucher._id);

    console.log(`\n🔍 Trạng thái voucher sau kịch bản 2:`);
    console.log(`   - Số lượng đã nhận trong ví của User: ${totalSpamClaimsInDB}`);
    console.log(`   - Số lượng remaining còn lại của Voucher: ${finalSpamVoucher.remainingQuantity}`);

    if (totalSpamClaimsInDB === 1 && finalSpamVoucher.remainingQuantity === 9) {
      console.log("🎉 KẾT QUẢ: Thành công! Chặn spam hoàn hảo nhờ Redis Lock. User chỉ nhận được duy nhất 1 lần!");
    } else {
      console.log("❌ KẾT QUẢ: Thất bại! Hệ thống cho phép user nhận trùng lặp hoặc trừ sai số lượng.");
    }

    // 4. Dọn dẹp dữ liệu test
    console.log("\n4️⃣ Dọn dẹp dữ liệu thử nghiệm...");
    await Voucher.deleteMany({ _id: { $in: [voucher._id, spamVoucher._id] } });
    await UserVoucher.deleteMany({ voucherId: { $in: [voucher._id, spamVoucher._id] } });
    console.log("✅ Đã dọn dẹp sạch sẽ.");

  } catch (error) {
    console.error("❌ Xảy ra lỗi trong quá trình test:", error);
  } finally {
    // Ngắt kết nối DB và đóng Redis
    await mongoose.disconnect();
    if (redis) {
      redis.disconnect();
    }
    console.log("\n🏁 KẾT THÚC TEST.");
    process.exit(0);
  }
};

runTest();
