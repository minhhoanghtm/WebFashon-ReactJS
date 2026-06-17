import { AppError } from "../../common/exceptions/AppError.js";

const validTypes = ["about", "policy", "faq", "guide", "lookbook", "landing", "blog"];
const validStatuses = ["draft", "published", "archived"];

const SectionValidator = {
  hero: (data, errors) => {
    if (data.title && typeof data.title !== "string") errors.push("Hero title phải là chuỗi");
    if (data.subtitle && typeof data.subtitle !== "string") errors.push("Hero subtitle phải là chuỗi");
    if (data.description && typeof data.description !== "string") errors.push("Hero description phải là chuỗi");
    if (data.coverImage && typeof data.coverImage !== "string") errors.push("Hero coverImage phải là chuỗi");
    if (data.buttonText && typeof data.buttonText !== "string") errors.push("Hero buttonText phải là chuỗi");
    if (data.buttonLink && typeof data.buttonLink !== "string") errors.push("Hero buttonLink phải là chuỗi");
  },
  story: (data, errors) => {
    if (data.heading && typeof data.heading !== "string") errors.push("Story heading phải là chuỗi");
    if (data.content && typeof data.content !== "string") errors.push("Story content phải là chuỗi");
  },
  gallery: (data, errors) => {
    if (data.images && !Array.isArray(data.images)) {
      errors.push("Gallery images phải là một mảng");
    } else if (data.images) {
      data.images.forEach((img, idx) => {
        if (!img.imageUrl || typeof img.imageUrl !== "string") {
          errors.push(`Gallery image tại vị trí ${idx} yêu cầu imageUrl là chuỗi`);
        }
        if (img.caption && typeof img.caption !== "string") {
          errors.push(`Gallery caption tại vị trí ${idx} phải là chuỗi`);
        }
      });
    }
  },
  quote: (data, errors) => {
    if (!data.quote || typeof data.quote !== "string") errors.push("Quote text là bắt buộc và phải là chuỗi");
    if (data.author && typeof data.author !== "string") errors.push("Quote author phải là chuỗi");
  },
  image_text: (data, errors) => {
    if (data.image && typeof data.image !== "string") errors.push("Image + Text image phải là chuỗi");
    if (data.title && typeof data.title !== "string") errors.push("Image + Text title phải là chuỗi");
    if (data.content && typeof data.content !== "string") errors.push("Image + Text content phải là chuỗi");
    if (data.imagePosition && !["left", "right"].includes(data.imagePosition)) {
      errors.push("Image + Text imagePosition phải là 'left' hoặc 'right'");
    }
  },
  products: (data, errors) => {
    if (!data.productIds || !Array.isArray(data.productIds)) {
      errors.push("Products spotlight productIds phải là một mảng");
    }
  },
  banner: (data, errors) => {
    if (data.image && typeof data.image !== "string") errors.push("Banner image phải là chuỗi");
    if (data.title && typeof data.title !== "string") errors.push("Banner title phải là chuỗi");
    if (data.subtitle && typeof data.subtitle !== "string") errors.push("Banner subtitle phải là chuỗi");
    if (data.buttonText && typeof data.buttonText !== "string") errors.push("Banner buttonText phải là chuỗi");
    if (data.buttonLink && typeof data.buttonLink !== "string") errors.push("Banner buttonLink phải là chuỗi");
  },
  cta: (data, errors) => {
    if (data.title && typeof data.title !== "string") errors.push("CTA title phải là chuỗi");
    if (data.description && typeof data.description !== "string") errors.push("CTA description phải là chuỗi");
    if (data.buttonText && typeof data.buttonText !== "string") errors.push("CTA buttonText phải là chuỗi");
    if (data.buttonLink && typeof data.buttonLink !== "string") errors.push("CTA buttonLink phải là chuỗi");
  }
};

export const validatePage = (req, res, next) => {
  if (req.body && req.body.page) {
    req.body = {
      ...req.body.page,
      sections: req.body.sections || req.body.page.sections || []
    };
  }
  const data = req.body;
  const errors = [];

  if (!data.title || String(data.title).trim() === "") {
    errors.push("Tiêu đề (title) không được để trống");
  }

  if (!data.slug || String(data.slug).trim() === "") {
    errors.push("Slug không được để trống");
  }

  if (!data.type) {
    errors.push("Loại trang (type) không được để trống");
  } else if (!validTypes.includes(data.type)) {
    errors.push(`Loại trang (type) phải thuộc một trong các giá trị: ${validTypes.join(", ")}`);
  }

  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Trạng thái (status) phải thuộc một trong các giá trị: ${validStatuses.join(", ")}`);
  }

  if (data.relatedProducts && !Array.isArray(data.relatedProducts)) {
    errors.push("Sản phẩm liên kết (relatedProducts) phải là một mảng");
  }

  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach((sec, index) => {
      if (!sec.type) {
        errors.push(`Khối nội dung thứ ${index} thiếu loại (type)`);
      } else if (!SectionValidator[sec.type]) {
        errors.push(`Khối nội dung thứ ${index} chứa loại (type) không hợp lệ: ${sec.type}`);
      } else {
        SectionValidator[sec.type](sec.data || {}, errors);
      }
    });
  } else if (data.sections) {
    errors.push("Bố cục các khối (sections) phải là một mảng");
  }

  if (errors.length > 0) {
    return next(new AppError(`Dữ liệu không hợp lệ: ${errors.join(". ")}`, 400));
  }

  next();
};
