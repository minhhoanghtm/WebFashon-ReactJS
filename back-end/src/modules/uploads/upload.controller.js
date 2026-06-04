import uploadService from "./upload.service.js";

export const uploadSingleImage = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file was uploaded.",
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
