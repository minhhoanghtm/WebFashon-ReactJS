import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../modules/users/user.model.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      console.log("Found Admin:", {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status
      });
    } else {
      console.log("No admin user found.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    await mongoose.disconnect();
  }
};

run();
