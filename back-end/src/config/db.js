import mongoose from "mongoose";
import dotenv from "dotenv";
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTIONSTRING);
        console.log("Kết nối thành công");
        
    } catch (error) {
        console.error("Lỗi khi kết nối dữ liệu");
        process.exit(1); //thoát khi có lỗi
    }
}