import Review from "./review.model.js";

class ReviewRepository {
  async create(reviewData) {
    return await Review.create(reviewData);
  }

  async find(query = {}, sort = { createdAt: -1 }) {
    return await Review.find(query).sort(sort);
  }

  async findById(id) {
    return await Review.findById(id);
  }

  async findOne(query) {
    return await Review.findOne(query);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await Review.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await Review.findByIdAndDelete(id);
  }

  async deleteMany(query) {
    return await Review.deleteMany(query);
  }

  async aggregate(pipeline) {
    return await Review.aggregate(pipeline);
  }

  async findOneAndUpdate(query, updateData, options = {}) {
    return await Review.findOneAndUpdate(query, updateData, options);
  }
}

export default new ReviewRepository();
