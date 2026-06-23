import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    const connectionString = process.env.MONGO_CONNECTIONSTRING || "mongodb://127.0.0.1:27017/webfashion_test";
  const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Kết nối MongoDB thành công");

    // Drop 'sessions' collection if it exists after migration to Redis
    try {
      const collections = await conn.connection.db.listCollections({ name: "sessions" }).toArray();
      if (collections.length > 0) {
        await conn.connection.db.dropCollection("sessions");
        console.log("🗑️ Đã xóa collection 'sessions' cũ trong MongoDB thành công");
      }
    } catch (dropErr) {
      console.warn("⚠️ Không thể xóa collection 'sessions' hoặc collection không tồn tại:", dropErr.message);
    }

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
