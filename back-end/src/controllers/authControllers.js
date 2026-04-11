import User from '../models/User.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from "dotenv";
import Sessions from '../models/Sessions.js';
dotenv.config();
const ACCESS_TOKEN_TTL = '30m'; //thường là dưới 15 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
export const signUp = async (req, res) => {
    try {
        const {userName, passWord, lastName, firstName} = req.body;
        if(!userName || !passWord || !lastName || !firstName) {
            return res.status(400).json({message: "Không thể thiếu userName, pasWord, lastName, firstName!"});
        }

        //Kiểm tra user đã tồn tại?
        const duplicate = await User.findOne({userName});
        if(duplicate) {
            return res.status(409).json({message: "UserName đã tồn tại!"});
        }
        //Mã hóa passWord
        const hashedPass = await bcrypt.hash(passWord, 10); //trộn 2^10 lần
        //Tạo user mới
        await User.create({
            userName, passWord: hashedPass, fullName: `${firstName} ${lastName}`
        });
        //return
        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi khi gọi signup", error);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
}

export const signIn = async (req, res) => {
    try {
        //Lấy input 
        const { userName, passWord } = req.body;
        if(!userName || !passWord) {
            return res.status(400).json({message: "Thiếu username hoặc password"});
        }
        //Lấy hashedPass trong DB so sánh với pass input
        const user = await User.findOne({userName});
        if(!user) {
            return res.status(401).json({message: "Username hoặc password không đúng"});

        }
        //Kiểm tra password
        const passWordCorrect = await bcrypt.compare(passWord, user.passWord);
        if(!passWordCorrect) {
            return res.status(401).json({message: "Username hoặc password không đúng"});
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