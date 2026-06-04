import express from "express";
import { processPayment, handleCallback } from "./payment.controller.js";
import { protectedRoute } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/charge", protectedRoute, processPayment);
router.get("/callback", handleCallback);

export default router;
