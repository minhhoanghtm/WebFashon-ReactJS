import User from "../models/User.js";
import { generateOTP } from "../utils/generateOTP.js";

let otpStore = {}; // Lưu trữ OTP tạm thời 

//Xác thực người dùng hiện tại
export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi gọi authMe:", error);
    res.status(500).json({ message: error.message });
  }
};

//Lấy tất cả người dùng (dành cho admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi gọi getAllUsers:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//Đổi mật khẩu
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId); // Tìm người dùng theo ID
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi updatePassword:", error);
    res.status(500).json({ message: error.message });
  }
};

//cap nhat thong tin nguoi dung
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, email } = req.body;
    const user = await User.findById(userId); // Tìm người dùng theo ID
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    // Cập nhật thông tin mới
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    await user.save();
    res.status(200).json({ message: "Cập nhật thông tin thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi updateProfile:", error);
    res.status(500).json({ message: error.message });
  }
};
