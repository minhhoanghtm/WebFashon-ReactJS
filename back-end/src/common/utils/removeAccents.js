import removeAccents from "remove-accents";

export const toNoAccent = (text = "") => {
  return removeAccents(text).toLowerCase().trim();
};
