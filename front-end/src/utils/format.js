export const formatDate = (value) => {
  return new Date(value).toLocaleDateString("vi-VN");
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export const formatDateToInput = (dateStr) => {
  if (!dateStr) return "";

  const date = new Date(dateStr);

  if (isNaN(date)) return ""; 

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};