import userRepository from "./user.repository.js";
import { AppError } from "../../common/exceptions/AppError.js";
import { normalizeEmail } from "../../common/utils/normalizeEmail.js";
import bcrypt from "bcrypt";

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

class UserService {
  async getMe(userId) {
    const user = await userRepository.findByIdWithoutPassword(userId);
    if (!user) {
      throw new AppError("Người dùng không tồn tại", 404);
    }
    return user;
  }

  async getAllUsers() {
    return await userRepository.findAllWithoutPassword();
  }

  async createUser(userData) {
    const {
      email,
      passWord,
      fullName,
      sex,
      birthday,
      role,
      avatar_url,
      addresses,
    } = userData;

    if (!email || !passWord || !fullName) {
      throw new AppError("Thiếu thông tin bắt buộc", 400);
    }

    const normalizedEmail = normalizeEmail(email);
    const exists = await userRepository.findByEmail(normalizedEmail);
    if (exists) {
      throw new AppError("Email đã tồn tại", 409);
    }

    const hashedPass = await bcrypt.hash(passWord, 10);
    const createdUser = await userRepository.create({
      email: normalizedEmail,
      passWord: hashedPass,
      fullName,
      sex,
      birthday,
      role: role || "user",
      avatar_url,
      addresses: normalizeAddresses(addresses),
    });

    return await userRepository.findByIdWithoutPassword(createdUser._id);
  }

  async updateUser(id, updateData) {
    const {
      email,
      passWord,
      fullName,
      sex,
      birthday,
      role,
      avatar_url,
      status,
      addresses,
    } = updateData;

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("Không tìm thấy tài khoản", 404);
    }

    if (user.role === "user") {
      // For standard customers, only allow locking/unlocking (updating status)
      if (status !== undefined) {
        user.status = status;
      } else {
        throw new AppError("Không được phép chỉnh sửa thông tin khách hàng", 403);
      }
    } else {
      // For administrators, allow normal updates
      if (status !== undefined) {
        user.status = status;
      }
      if (email) {
        const normalizedEmail = normalizeEmail(email);
        const emailExists = await userRepository.findByEmail(normalizedEmail);
        if (emailExists && emailExists._id.toString() !== id) {
          throw new AppError("Email đã tồn tại", 409);
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
    }

    await user.save();
    return await userRepository.findByIdWithoutPassword(id);
  }

  async deleteUser(id) {
    const currentUser = await userRepository.findById(id);
    if (!currentUser) {
      throw new AppError("Không tìm thấy tài khoản", 404);
    }

    if (currentUser.role === "user") {
      throw new AppError("Không được phép xóa tài khoản khách hàng", 403);
    }

    const deletedUser = await userRepository.findByIdAndDelete(id);
    const deletedObj = deletedUser.toObject();
    delete deletedObj.passWord;
    return deletedObj;
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    // Use our model method comparePassword
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không đúng", 400);
    }

    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async updateProfile(userId, profileData) {
    const {
      fullName,
      email,
      birthday,
      sex,
      avatar_url,
      address,
      addresses,
    } = profileData;

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("Người dùng không tồn tại", 404);
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.birthday = birthday || user.birthday;
    user.sex = sex || user.sex;
    user.avatar_url = avatar_url || user.avatar_url;

    if (address || addresses) {
      const incoming = addresses
        ? Array.isArray(addresses)
          ? addresses
          : [addresses]
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
    return await userRepository.findByIdWithoutPassword(userId);
  }
}

export default new UserService();
