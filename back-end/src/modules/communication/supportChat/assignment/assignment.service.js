import User from "../../../users/user.model.js";

class AssignmentService {
  async findAvailableAdmin() {
    return User.findOne({ role: "admin", status: "active" }).select("_id").lean();
  }
}

export default new AssignmentService();
