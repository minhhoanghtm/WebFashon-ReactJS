import User from "./user.model.js";

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  async findByIdWithoutPassword(id) {
    return await User.findById(id).select("-passWord");
  }

  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findAll() {
    return await User.find().lean();
  }

  async findAllWithoutPassword() {
    return await User.find().select("-passWord").lean();
  }

  async create(userData) {
    return await User.create(userData);
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    return await User.findByIdAndUpdate(id, updateData, options);
  }

  async findByIdAndDelete(id) {
    return await User.findByIdAndDelete(id);
  }

  async countDocuments(query = {}) {
    return await User.countDocuments(query);
  }
}

export default new UserRepository();
