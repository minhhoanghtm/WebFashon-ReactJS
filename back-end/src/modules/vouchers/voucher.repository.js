import Voucher from "./voucher.model.js";
import UserVoucher from "./userVoucher.model.js";
import VoucherUsage from "./voucherUsage.model.js";
import VoucherHistory from "./voucherHistory.model.js";

class VoucherRepository {
  // ==========================================
  // 1. Voucher Methods
  // ==========================================
  async find(query = {}, sort = { createdAt: -1 }, skip = 0, limit = 100) {
    return await Voucher.find(query).sort(sort).skip(skip).limit(limit).lean();
  }

  async findOne(query) {
    return await Voucher.findOne(query);
  }

  async findById(id) {
    return await Voucher.findById(id);
  }

  async countDocuments(query = {}) {
    return await Voucher.countDocuments(query);
  }

  async create(voucherData, options = {}) {
    if (Array.isArray(voucherData)) {
      return await Voucher.create(voucherData, options);
    }
    const voucher = new Voucher(voucherData);
    await voucher.save(options);
    return voucher;
  }

  async insertMany(vouchers, options = {}) {
    return await Voucher.insertMany(vouchers, options);
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    return await Voucher.findOneAndUpdate(query, updateData, options);
  }

  async updateOne(query, updateData, options = {}) {
    return await Voucher.updateOne(query, updateData, options);
  }

  // ==========================================
  // 2. UserVoucher Methods
  // ==========================================
  async findUserVouchers(query = {}) {
    return await UserVoucher.find(query);
  }

  async findUserWallet(filter) {
    return await UserVoucher.find(filter)
      .populate({
        path: "voucherId",
        match: { isDeleted: false },
      })
      .sort({ createdAt: -1 });
  }

  async findOneUserVoucher(query) {
    return await UserVoucher.findOne(query);
  }

  async createUserVoucher(data, options = {}) {
    if (Array.isArray(data)) {
      return await UserVoucher.create(data, options);
    }
    const uv = new UserVoucher(data);
    await uv.save(options);
    return uv;
  }

  async insertManyUserVouchers(data, options = {}) {
    return await UserVoucher.insertMany(data, options);
  }

  async findOneAndUpdateUserVoucher(query, updateData, options = {}) {
    return await UserVoucher.findOneAndUpdate(query, updateData, options);
  }

  async updateUserVoucher(query, updateData, options = {}) {
    return await UserVoucher.updateOne(query, updateData, options);
  }

  async countUserVouchers(query = {}) {
    return await UserVoucher.countDocuments(query);
  }

  // ==========================================
  // 3. VoucherUsage Methods
  // ==========================================
  async createUsage(data, options = {}) {
    if (Array.isArray(data)) {
      return await VoucherUsage.create(data, options);
    }
    const vu = new VoucherUsage(data);
    await vu.save(options);
    return vu;
  }

  async findOneAndUpdateUsage(query, updateData, options = {}) {
    return await VoucherUsage.findOneAndUpdate(query, updateData, options);
  }

  async findUsages(query = {}) {
    return await VoucherUsage.find(query).lean();
  }

  async deleteOneUsage(query, options = {}) {
    return await VoucherUsage.deleteOne(query, options);
  }

  // ==========================================
  // 4. VoucherHistory Methods
  // ==========================================
  async createHistory(data, options = {}) {
    if (Array.isArray(data)) {
      return await VoucherHistory.create(data, options);
    }
    const vh = new VoucherHistory(data);
    await vh.save(options);
    return vh;
  }

  // ==========================================
  // 5. Aggregate Methods
  // ==========================================
  async save(doc, options = {}) {
    return await doc.save(options);
  }

  async aggregateUserVouchers(pipeline) {
    return await UserVoucher.aggregate(pipeline);
  }

  async aggregateUsage(pipeline) {
    return await VoucherUsage.aggregate(pipeline);
  }
}

export default new VoucherRepository();
