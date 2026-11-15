import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const MAX_IMAGE_PIXELS = 20_000_000;
const MAX_IMAGE_DIMENSION = 2560;

class UploadService {
  ensureUploadDirExists() {
    const uploadDir = path.resolve("uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  getFileUrl(req, filename) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}/uploads/${filename}`;
  }

  async processImage(buffer) {
    const image = sharp(buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Không thể xác định kích thước ảnh");
    }
    if (metadata.width * metadata.height > MAX_IMAGE_PIXELS) {
      throw new Error("Ảnh vượt quá giới hạn 20 megapixel");
    }

    const filename = `${crypto.randomUUID()}.webp`;
    const destination = path.join(this.ensureUploadDirExists(), filename);
    await image
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(destination);

    return filename;
  }
}

export default new UploadService();
