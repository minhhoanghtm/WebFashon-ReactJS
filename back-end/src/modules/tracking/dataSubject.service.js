import bcrypt from "bcrypt";
import crypto from "crypto";
import { AppError } from "../../common/exceptions/AppError.js";
import User from "../users/user.model.js";
import { Order, OrderItem } from "../orders/order.model.js";
import UserEvent from "./userEvent.model.js";
import UserConsent from "./userConsent.model.js";
import DataSubjectRequest from "./dataSubjectRequest.model.js";

const requireRecentPassword = async (userId, currentPassword) => {
  if (!currentPassword) throw new AppError("Cần nhập mật khẩu để xác thực lại.", 401);
  const user = await User.findById(userId).select("+passWord");
  if (!user || user.status === "deleted") throw new AppError("Tài khoản không còn hoạt động.", 404);
  if (!(await bcrypt.compare(currentPassword, user.passWord))) {
    throw new AppError("Xác thực lại không thành công.", 401);
  }
  return user;
};

const logRequest = (userId, type, values = {}) => DataSubjectRequest.create({
  user_id: userId,
  type,
  ...values,
});

class DataSubjectService {
  async exportData(userId, currentPassword) {
    const user = await requireRecentPassword(userId, currentPassword);
    const [orders, events, consents] = await Promise.all([
      Order.find({ user_id: user._id }).lean(),
      UserEvent.find({ user_id: user._id }).lean(),
      UserConsent.find({ subject_id: String(user._id) }).lean(),
    ]);
    const orderIds = orders.map((order) => order._id);
    const items = orderIds.length ? await OrderItem.find({ order_id: { $in: orderIds } }).lean() : [];
    await logRequest(user._id, "EXPORT", { status: "completed", processed_at: new Date(), result: "JSON export generated" });
    const account = user.toObject();
    delete account.passWord;
    return { exported_at: new Date().toISOString(), account, orders, order_items: items, tracking_events: events, consents };
  }

  async restrict(userId, currentPassword, type, reason) {
    const user = await requireRecentPassword(userId, currentPassword);
    user.processing_restricted_at = new Date();
    user.consent_status = "denied";
    await user.save();
    await UserConsent.findOneAndUpdate(
      { subject_id: String(user._id) },
      { $set: { subject_id: String(user._id), subject_type: "user", consent_status: "denied", consent_choice: "WITHDRAWN", "categories.analytics": false, "categories.personalization": false, "categories.marketing": false } },
      { upsert: true },
    );
    return logRequest(user._id, type, { status: "completed", processed_at: new Date(), reason: reason || null, result: "Non-essential processing disabled" });
  }

  async erase(userId, currentPassword, reason) {
    const user = await requireRecentPassword(userId, currentPassword);
    const now = new Date();
    // Financial/order records are retained but personal account and delivery fields are anonymized.
    await Order.updateMany({ user_id: user._id }, {
      $set: {
        "shipping_address.full_name": "[ĐÃ ẨN DANH]",
        "shipping_address.phone": "000000000",
        "shipping_address.city": "[ĐÃ ẨN DANH]",
        "shipping_address.district": "[ĐÃ ẨN DANH]",
        "shipping_address.ward": "[ĐÃ ẨN DANH]",
        "shipping_address.address_detail": "[ĐÃ ẨN DANH]",
        personal_data_anonymized_at: now,
      },
    });
    await UserEvent.deleteMany({ user_id: user._id });
    await UserConsent.deleteMany({ subject_id: String(user._id) });
    user.fullName = "[ĐÃ ẨN DANH]";
    user.email = undefined;
    user.phone = undefined;
    user.birthday = undefined;
    user.sex = undefined;
    user.avatar_url = undefined;
    user.addresses = [];
    user.legal_consents = undefined;
    user.processing_restricted_at = now;
    user.personal_data_anonymized_at = now;
    user.status = "deleted";
    user.passWord = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    await user.save();
    await logRequest(user._id, "ERASURE", { status: "completed", processed_at: now, reason: reason || null, result: "Account anonymized; financial order record retained" });
    const { default: authService } = await import("../auth/auth.service.js");
    await authService.signOutAll(user._id);
  }

  async listRequests(userId) {
    return DataSubjectRequest.find({ user_id: userId }).sort({ requested_at: -1 }).lean();
  }
}

export default new DataSubjectService();
