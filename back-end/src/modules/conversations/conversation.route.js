import express from "express";
import { adminOnly } from "../../middlewares/auth.middleware.js";
import {
  closeConversation,
  createConversation,
  getAdminConversations,
  getConversationDetail,
  getMyConversations,
  updateConversation,
} from "./conversation.controller.js";

const markAdmin = (req, _res, next) => {
  req.isAdmin = true;
  next();
};

const router = express.Router();

router.get("/admin", adminOnly, markAdmin, getAdminConversations);
router.get("/", getMyConversations);
router.post("/", createConversation);
router.get("/:id", getConversationDetail);
router.patch("/:id", updateConversation);
router.patch("/:id/close", closeConversation);
router.get("/admin/:id", adminOnly, markAdmin, getConversationDetail);
router.patch("/admin/:id", adminOnly, markAdmin, updateConversation);
router.patch("/admin/:id/close", adminOnly, markAdmin, closeConversation);

export default router;
