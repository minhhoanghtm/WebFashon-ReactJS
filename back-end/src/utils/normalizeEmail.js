export const normalizeEmail = (email = "") =>
  email.toString().trim().toLowerCase().replace(/\s/g, "");