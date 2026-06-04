import slugify from "slugify";

export const createSlug = (str) => {
  const baseSlug = slugify(str, {
    replacement: "-",
    strict: true,
    lower: true,
    locale: "vi",
    trim: true,
  });
  return baseSlug + Date.now();
};
