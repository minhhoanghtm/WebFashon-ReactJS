import express from "express";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import { uploadSingleImage } from "./upload.controller.js";
import uploadService from "./upload.service.js";
import { protectedRoute } from "../../middlewares/auth.middleware.js";

const router = express.Router();
const uploadDir = uploadService.ensureUploadDirExists();

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${crypto.randomUUID()}${ext}`;
    cb(null, randomName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = ALLOWED_MIME_TYPES.has(file.mimetype);
  const isExtValid = ALLOWED_EXTENSIONS.has(ext);

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }
  return cb(new Error("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Dung lượng file vượt quá giới hạn tối đa 5MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Lỗi tải file: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File không hợp lệ",
      });
    }
    next();
  });
};

router.post("/", protectedRoute, handleUpload, uploadSingleImage);

export default router;
