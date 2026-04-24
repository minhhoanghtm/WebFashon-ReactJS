import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from "dotenv";
import Sessions from '../models/Sessions.js';
import { generateOTP } from '../utils/generateOTP.js';
import { sendOTP } from '../utils/sendMail.js';
dotenv.config();
const ACCESS_TOKEN_TTL = '30m'; //thường là dưới 15 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
// console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);

let otpStore = {}; // Lưu trữ OTP tạm thời

//đăng ký
export const signUp = async (req, res) => {
    try {
        const {passWord, lastName, firstName, email} = req.body;
        if(!passWord || !lastName || !firstName || !email) {
            return res.status(400).json({message: "Không thể thiếu passWord, lastName, firstName, email!"});
        }

        //Kiểm tra email đã tồn tại?
        const emailExists = await User.findOne({email});
        if(emailExists) {
            return res.status(409).json({message: "Email đã tồn tại!"});
        }

        //Mã hóa passWord
        const hashedPass = await bcrypt.hash(passWord, 10); //trộn 2^10 lần
        //Tạo user mới
        const newUser = await User.create({
            passWord: hashedPass, 
            fullName: `${lastName} ${firstName}`, 
            email,
            phone: null
        });
        //return
        return res.status(201).json({message: "Đăng ký thành công!", user: {id: newUser._id, email: newUser.email, fullName: newUser.fullName}});
    } catch (error) {
        console.error("Lỗi khi gọi signup", error);
        // Handle E11000 duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({message: `${field} đã được sử dụng!`});
        }
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

//đăng nhập
export const signIn = async (req, res) => {
    try {
        //Lấy input 
        const { email, passWord } = req.body;
        if(!email || !passWord) {
            return res.status(400).json({message: "Thiếu email hoặc password"});
        }
        //Lấy hashedPass trong DB so sánh với pass input
        const user = await User.findOne({email});
        if(!user) {
            return res.status(401).json({message: "Email hoặc password không đúng"});

        }
        //Kiểm tra password
        const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
        if(!passWordCorrect) {
            return res.status(401).json({message: "Email hoặc password không đúng"});
        }
        //Nếu khớp, tạo accessToken với JWT
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        //Tạo Refresh token
        const refreshToken = crypto.randomBytes(60).toString('hex');
        //Tạo Session mới để lưu refresh vào Token
        await Sessions.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        })
        //Trả về refresh
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, //Cookie không thể truy cập bằng JS
            secure: true, //Cookie chỉ gửi qua HTTPS
            sameSite: "none", //BE, FE deloy riêng
            maxAge: REFRESH_TOKEN_TTL
        })
        //Trả về access
        return res.status(200).json({
            message: `User ${user.fullName} đã login!`,
            accessToken: accessToken
        });
    } catch (error) {
        console.error("Lỗi khi gọi signIn", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

//đăng xuất, refresh token sẽ bị xóa khỏi Session, cookie cũng bị xóa, access token sẽ hết hạn sau 30 phút nên không cần xóa
export const signOut = async (req, res) => {
    try {
        //Lất refresh từ cookie
        const token = req.cookies?.refreshToken;

        if(token) {
            //Xóa refresh trong Session
            await Sessions.deleteOne({ refreshToken: token }); //hủy phiên đăng nhập
            //Xóa cookie
            res.clearCookie("refreshToken");
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi khi gọi signout", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

//Gửi OTP để xác thực email
export const sendOTPController = async (req, res) => {
    try {
        const { email } = req.body;
        if(!email) {
            return res.status(400).json({message: "Vui lòng cung cấp địa chỉ email"});
        }
        //tao otp
        const otp = generateOTP();
        //luu otp vào bộ nhớ tạm thời với thời gian hết hạn 5 phút
        otpStore[email] = {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000, //5 phút
        }
        //gui otp qua mail
        const sendMail = await sendOTP(email, otp);
        return res.status(200).json({message: "Mã OTP đã được gửi đến email của bạn"});
    } catch (error) {
        console.error("Lỗi khi gọi sendOTP", error);
        return res.status(500).json({message: "Lỗi hệ thống khi gửi OTP"});
    }
}

//Xác thực OTP
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if(!email || !otp) {
            return res.status(400).json({message: "Vui lòng cung cấp email và mã OTP"});
        }
        const data = otpStore[email]; //lấy otp từ bộ nhớ tạm thời
        if(!data) {
            return res.status(400).json({message: "Không tìm thấy mã OTP cho email này"});
        }
        if(Date.now() > data.expiresAt) {
            delete otpStore[email]; //xóa otp đã hết hạn
            return res.status(400).json({message: "Mã OTP đã hết hạn"});
        }
        if(data.otp !== otp.toString()) {
            return res.status(400).json({message: "Mã OTP không đúng"});
        }
        //Xóa otp sau khi xác thực thành công
        delete otpStore[email];
        return res.status(200).json({message: "Xác thực OTP thành công"});

    } catch (error) {
        console.error("Lỗi khi gọi verifyOTP", error);
        return res.status(500).json({message: "Lỗi hệ thống khi xác thực OTP"});
    }
}

//reset mat khau sau khi xac thuc otp thanh cong
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    //kiem tra email va otp co duoc cung cap khong
    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp email, mã OTP và mật khẩu mới" });
    }
    //kiem tra otp co hop le khong
    const data = otpStore[email];
    if (!data) {
      return res.status(400).json({ message: "Không tìm thấy mã OTP cho email này" });
    }
    if (Date.now() > data.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "Mã OTP đã hết hạn" });
    }
    if (data.otp !== otp.toString()) {
      return res.status(400).json({ message: "Mã OTP không đúng" });
    }
    //tim nguoi dung theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
    }
    //cap nhat mat khau moi
    const hashedPass = await bcrypt.hash(newPassword, 10);
    user.passWord = hashedPass;
    await user.save();
    //xoa otp da su dung
    delete otpStore[email];
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi resetPassword:", error);
    res.status(500).json({ message: error.message });
  }
}
