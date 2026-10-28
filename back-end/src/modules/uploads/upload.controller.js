import uploadService from "./upload.service.js";

export const uploadSingleImage = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy file ảnh để tải lên.",
      });
    }

    const fileUrl = uploadService.getFileUrl(req, req.file.filename);
    return res.json({
      success: true,
      url: fileUrl,
    });
  } catch (error) {
    next(error);
  }
};
