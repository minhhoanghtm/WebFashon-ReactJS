import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = (req, res, next) => {
    try {
        //Lấy token từ header
        const authHeader = req.headers["authorization"];
        console.log("authHeader:", authHeader);
        const token = authHeader && authHeader.split(" ")[1]; //có 2 phần và lấy phần sau
        if (!token) {
            return res.status(401).json({
                message: "Không tìm thấy access token"
            });
        }
        //Xác nhận token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodeUser) => {
            if (err) {
                console.error(err);
                return res.status(403).json({
                    message: "Access token hết hạn hoặc không đúng!"
                });
            }
            //Tìm user
            const user = await User.findById(decodeUser.userId).select('-hashedPass');
            console.log("decodeUser:", decodeUser);
            console.log("userId:", decodeUser.userId);

            if (!user) {
                return res.status(404).json({
                    message: "Người dùng không tồn tại!"
                });
            }
            //Trả user về trong req
            req.user = decodeUser;
            next();
        })

    } catch (error) {
        console.error("Lỗi khi xác minh JWWT trong authMiddleWare", error);
        return res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}

export const adminOnly = async (req, res, next) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Không tìm thấy access token hợp lệ"
            });
        }

        const user = await User.findById(userId).select("role");

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại!"
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền truy cập"
            });
        }

        next();
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền admin", error);
        return res.status(500).json({
            message: "Lỗi hệ thống"
        });
    }
}