import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const connectionString =
      process.env.LOCAL_DEV_MONGO_URI ||
      process.env.MONGO_CONNECTIONSTRING ||
      "mongodb://127.0.0.1:27017/webfashion_test";
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Kết nối MongoDB thành công");

    return conn;
  } catch (error) {
    console.error("❌ Lỗi khi kết nối MongoDB:", error.message);
    console.error(
      "Connection String:",
      process.env.MONGO_CONNECTIONSTRING?.substring(0, 50) + "..."
    );
    process.exit(1);
  }
};
