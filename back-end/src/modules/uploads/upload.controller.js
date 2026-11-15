import uploadService from "./upload.service.js";

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy file ảnh để tải lên.",
      });
    }

    const filename = await uploadService.processImage(req.file.buffer);
    const fileUrl = uploadService.getFileUrl(req, filename);
    return res.json({
      success: true,
      url: fileUrl,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Không thể xử lý ảnh tải lên.",
    });
  }
};
