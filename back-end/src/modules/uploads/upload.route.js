import express from "express";
import multer from "multer";
import { uploadSingleImage } from "./upload.controller.js";
import uploadService from "./upload.service.js";
import { protectedRoute, adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
const uploadDir = uploadService.ensureUploadDirExists();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", protectedRoute, adminOnly, upload.single("image"), uploadSingleImage);

export default router;
