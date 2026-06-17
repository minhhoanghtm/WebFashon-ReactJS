import express from "express";
import { adminOnly } from "../../middlewares/auth.middleware.js";
import { createMessage, getMessages } from "./message.controller.js";

const markAdmin = (req, _res, next) => {
  req.isAdmin = true;
  next();
};

const router = express.Router();

router.get("/conversation/:conversationId", getMessages);
router.post("/", createMessage);
router.get("/admin/conversation/:conversationId", adminOnly, markAdmin, getMessages);
router.post("/admin", adminOnly, markAdmin, createMessage);

export default router;
