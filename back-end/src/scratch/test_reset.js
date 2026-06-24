import mongoose from "mongoose";
import dotenv from "dotenv";
import authService from "../modules/auth/auth.service.js";
import authRepository from "../modules/auth/auth.repository.js";

dotenv.config();

const run = async () => {
  try {
    const connectionString = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB!");

    const email = "khongcotien.2023@gmail.com";
    const otp = "999999";

    // 1. Create a dummy OTP
    await authRepository.deleteOtpsByEmail(email);
    await authRepository.createOtp({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    console.log("Dummy OTP created!");

    // 2. Call resetPassword
    console.log("Calling resetPassword...");
    await authService.resetPassword(email, otp, "NewPassword@123");
    console.log("resetPassword succeeded!");

    await mongoose.disconnect();
  } catch (err) {
    console.error("Test failed with error:", err);
    await mongoose.disconnect();
  }
};

run();
