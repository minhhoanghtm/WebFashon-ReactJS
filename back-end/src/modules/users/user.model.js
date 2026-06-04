import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      match: [/^[0-9]{9,11}$/, "Số điện thoại không hợp lệ"],
    },
    provinceCode: String,
    districtCode: String,
    wardCode: String,
    addressDetail: String,
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passWord: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    birthday: Date,
    sex: {
      type: String,
      enum: ["male", "female"],
    },
    role: {
      type: String,
      enum: ["user", "staff", "admin"],
      default: "user",
    },
    avatar_url: {
      type: String,
      default:
        "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg",
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

// Compare password helper (if needed)
userSchema.methods.comparePassword = async function (enteredPassword) {
  // It was previously called as user.comparePassword(currentPassword) but wasn't implemented. We'll implement it here using bcrypt!
  // To avoid issues, let's use dynamic import of bcrypt inside method or keep it simple.
  // Actually, importing bcrypt directly:
  const bcrypt = await import("bcrypt");
  return await bcrypt.default.compare(enteredPassword, this.passWord);
};

const User = mongoose.model("User", userSchema);
export default User;
