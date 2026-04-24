import express from "express";
import { resetPassword, sendOTPController, signIn, signOut, signUp, verifyOTP } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/signUp", signUp);
router.post("/signIn", signIn);
router.post("/signOut", signOut);
router.post("/sendOTP", sendOTPController);
router.post("/verify-otp", verifyOTP);
router.post("/resetPassword", resetPassword);

export default router;