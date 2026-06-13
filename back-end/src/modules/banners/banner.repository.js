import Banner from "./banner.model.js";

class BannerRepository {
  async find(query = {}, sort = { sortOrder: 1, createdAt: -1 }, skip = 0, limit = 100) {
    const filter = { isDeleted: false, ...query };
    return await Banner.find(filter).sort(sort).skip(skip).limit(limit).lean();
  }

  async findOne(query) {
    const filter = { isDeleted: false, ...query };
    return await Banner.findOne(filter);
  }

  async findById(id) {
    const filter = { _id: id, isDeleted: false };
    return await Banner.findOne(filter);
  }

  async create(bannerData) {
    return await Banner.create(bannerData);
  }

  async updateOne(query, updateData) {
    return await Banner.updateOne({ isDeleted: false, ...query }, updateData);
  }

  async updateMany(query, updateData) {
    return await Banner.updateMany({ isDeleted: false, ...query }, updateData);
  }

  async findOneAndUpdate(query, updateData, options = { new: true }) {
    return await Banner.findOneAndUpdate({ isDeleted: false, ...query }, updateData, options);
  }

  async aggregate(pipeline) {
    // Pipeline should ideally contain $match: { isDeleted: false } at the beginning
    const processedPipeline = [
      { $match: { isDeleted: false } },
      ...pipeline
    ];
    return await Banner.aggregate(processedPipeline);
  }

  async countDocuments(query = {}) {
    const filter = { isDeleted: false, ...query };
    return await Banner.countDocuments(filter);
  }
}

export default new BannerRepository();
