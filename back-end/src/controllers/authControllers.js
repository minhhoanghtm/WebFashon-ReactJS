import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import Sessions from "../models/Sessions.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendOTP } from "../utils/sendMail.js";
import Otp from "../models/Otp.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";
dotenv.config();
const ACCESS_TOKEN_TTL = "30m"; //thường là dưới 15 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
// console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);

//đăng ký
export const signUp = async (req, res) => {
  try {
    const { passWord, lastName, firstName, email } = req.body;

    if (!passWord || !lastName || !firstName || !email) {
      return res.status(400).json({
        success: false,
        message: "Không thể thiếu passWord, lastName, firstName, email!",
      });
    }

    //Normalize email
    const normalizedEmail = normalizeEmail(email);

    //Kiểm tra email đã tồn tại?
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      return res
        .status(409)
        .json({ success: false, message: "Email đã tồn tại!" });
    }

    //Mã hóa passWord
    const hashedPass = await bcrypt.hash(passWord, 10); //trộn 2^10 lần
    //Tạo user mới
    const newUser = await User.create({
      passWord: hashedPass,
      fullName: `${lastName} ${firstName}`,
      email: normalizedEmail,
      phone: null,
    });
    //return
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công!",
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi signup", error);
    // Handle E11000 duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(409)
        .json({ success: false, message: `${field} đã được sử dụng!` });
    }
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

//đăng nhập
export const signIn = async (req, res) => {
  try {
    //Lấy input
    const { email, passWord } = req.body;

    if (!email || !passWord) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu email hoặc password" });
    }
    //Normalize email
    const normalizedEmail = normalizeEmail(email);
    //Lấy hashedPass trong DB so sánh với pass input
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc password không đúng" });
    }
    //Kiểm tra password
    const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
    if (!passWordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Email hoặc password không đúng" });
    }
    //Nếu khớp, tạo accessToken với JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    //Tạo Refresh token
    const refreshToken = crypto.randomBytes(60).toString("hex");
    //Tạo Session mới để lưu refresh vào Token
    await Sessions.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    //Trả về refresh
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, //Cookie không thể truy cập bằng JS
      secure: true, //Cookie chỉ gửi qua HTTPS
      sameSite: "none", //BE, FE deloy riêng
      maxAge: REFRESH_TOKEN_TTL,
    });
    //Trả về access
    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} đã login!, UserId: ${user._id}`,
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

//đăng xuất, refresh token sẽ bị xóa khỏi Session, cookie cũng bị xóa, access token sẽ hết hạn sau 30 phút nên không cần xóa
export const signOut = async (req, res) => {
  try {
    //Lất refresh từ cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      //Xóa refresh trong Session
      await Sessions.deleteOne({ refreshToken: token }); //hủy phiên đăng nhập
      //Xóa cookie
      res.clearCookie("refreshToken");
    }
    return res
      .status(204)
      .json({ success: true, message: "Đăng xuất thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi signout", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

//Gửi OTP để xác thực email
export const sendOTPController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp địa chỉ email",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const otp = generateOTP();

    // xóa OTP cũ
    await Otp.deleteMany({ email: normalizedEmail });

    // lưu OTP mới
    await Otp.create({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // For local debugging, log OTP when not in production
    if (process.env.NODE_ENV !== "production") {
      console.log(`DEV OTP for ${normalizedEmail}: ${otp}`);
    }

    await sendOTP(normalizedEmail, otp);

    return res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi gửi OTP",
    });
  }
};

//Xác thực OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email hoặc OTP",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const data = await Otp.findOne({ email: normalizedEmail });

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "OTP không tồn tại",
      });
    }
    if (data.expiresAt < new Date()) {
      await Otp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({
        success: false,
        message: "OTP đã hết hạn",
      });
    }
    if (String(data.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP sai",
      });
    }

    // await Otp.deleteOne({ email: normalizedEmail });

    return res.status(200).json({
      success: true,
      message: "Xác thực OTP thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};

//reset mat khau sau khi xac thuc otp thanh cong
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const data = await Otp.findOne({ email: normalizedEmail });

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "OTP không tồn tại",
      });
    }


    if (data.expiresAt < new Date()) {
      await Otp.deleteOne({ email: normalizedEmail });
      console.error("resetPassword: OTP đã hết hạn");
      return res.status(400).json({
        success: false,
        message: "OTP đã hết hạn",
      });
    }

    if (String(data.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP sai",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }

    user.passWord = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteOne({ email: normalizedEmail });

    return res.status(200).json({
      success: true,
      message: "Reset mật khẩu thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
    });
  }
};
