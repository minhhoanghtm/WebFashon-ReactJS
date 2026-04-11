import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    trim: true,
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
  address: [{
    fullName: String,
    phone: String,
    city: String,
    district: String,
    detail: String
  }],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  avatar_url: {
    type: String,
  },
}, {
  timestamps: true, //createedAd vaf updatedAt
}, );

const User = mongoose.model("User", userSchema);

export default User;