import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../modules/orders/order.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    const userId = "69ede21b17c7504af8b0adf1";
    
    // Count orders grouped by status
    const stats = await Order.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    console.log("Order stats for user:", stats);

    // Get a few orders
    const recentOrders = await Order.find({ user_id: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(5);
    console.log("Recent orders:", recentOrders);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    await mongoose.disconnect();
  }
};

run();
