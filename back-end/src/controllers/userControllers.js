import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateOTP } from "../utils/generateOTP.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";

let otpStore = {}; // Lưu trữ OTP tạm thời 

const normalizeAddress = (address = {}) => ({
  fullName: address.fullName || "",
  phone: address.phone || "",
  provinceCode: address.provinceCode || address.city || "",
  districtCode: address.districtCode || address.district || "",
  wardCode: address.wardCode || address.ward || "",
  addressDetail: address.addressDetail || address.detail || "",
  isDefault: address.isDefault || false,
});

const normalizeAddresses = (addresses) => {
  if (!addresses) {
    return [];
  }

  const addressList = Array.isArray(addresses) ? addresses : [addresses];
  return addressList.filter(Boolean).slice(0, 1).map(normalizeAddress);
};

//Xác thực người dùng hiện tại
export const authMe = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select("-passWord");
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Lỗi khi gọi authMe:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//Lấy tất cả người dùng (dành cho admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passWord");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Lỗi khi gọi getAllUsers:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      email,
      passWord,
      fullName,
      sex,
      birthday,
      role,
      avatar_url,
      addresses,
    } = req.body;

    if (!email || !passWord || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    const hashedPass = await bcrypt.hash(passWord, 10);
    const createdUser = await User.create({
      email: normalizedEmail,
      passWord: hashedPass,
      fullName,
      sex,
      birthday,
      role: role || "user",
      avatar_url,
      addresses: normalizeAddresses(addresses),
    });

    const savedUser = await User.findById(createdUser._id).select("-passWord");

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      data: savedUser,
    });
  } catch (error) {
    console.error("Lỗi khi gọi createUser:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      passWord,
      fullName,
      sex,
      birthday,
      role,
      avatar_url,
      addresses,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    if (user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Không được phép chỉnh sửa thông tin khách hàng",
      });
    }

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      const emailExists = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email đã tồn tại",
        });
      }

      user.email = normalizedEmail;
    }

    if (passWord) {
      user.passWord = await bcrypt.hash(passWord, 10);
    }

    user.fullName = fullName || user.fullName;
    user.sex = sex || user.sex;
    user.birthday = birthday || user.birthday;
    user.role = role || user.role;
    user.avatar_url = avatar_url || user.avatar_url;

    if (addresses) {
      user.addresses = normalizeAddresses(addresses);
    }

    await user.save();

    const updatedUser = await User.findById(id).select("-passWord");

    return res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi gọi updateUser:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = await User.findById(id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản",
      });
    }

    if (currentUser.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Không được phép xóa tài khoản khách hàng",
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa tài khoản thành công",
      data: {
        ...deletedUser.toObject(),
        passWord: undefined,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi deleteUser:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Đổi mật khẩu
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId); // Tìm người dùng theo ID
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
    }
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: "Cập nhật mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi updatePassword:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//cap nhat thong tin nguoi dung
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      fullName,
      email,
      birthday,
      sex,
      avatar_url,
      address,
    } = req.body;
    const user = await User.findById(userId); // Tìm người dùng theo ID
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }
    // Cập nhật thông tin mới
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.birthday = birthday || user.birthday;
    user.sex = sex || user.sex;
    user.avatar_url = avatar_url || user.avatar_url;
    if (address || req.body.addresses) {
      // support either `address` (single object) or `addresses` (array)
      const incoming = req.body.addresses
        ? Array.isArray(req.body.addresses)
          ? req.body.addresses
          : [req.body.addresses]
        : [address];

      const first = incoming[0] || {};
      user.addresses = [
        {
          fullName: first.fullName || "",
          phone: first.phone || "",
          provinceCode: first.provinceCode || first.city || "",
          districtCode: first.districtCode || first.district || "",
          wardCode: first.wardCode || first.ward || "",
          addressDetail: first.addressDetail || first.detail || "",
          isDefault: first.isDefault || false,
        },
      ];
    }
    await user.save();
    const updatedUser = await User.findById(userId).select("-passWord");
    res.status(200).json({ success: true, message: "Cập nhật thông tin thành công", data: updatedUser });
  } catch (error) {
    console.error("Lỗi khi gọi updateProfile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
