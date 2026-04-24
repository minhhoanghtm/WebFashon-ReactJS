import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // userName: {
  //   type: String,
  //   required: true,
  //   trim: true,
  // },
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