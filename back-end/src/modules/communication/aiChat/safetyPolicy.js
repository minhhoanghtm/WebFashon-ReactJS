export const getAiSafetyResponse = (content = "") => {
  const normalized = String(content).toLowerCase();
  if (/(hack|tấn công|xâm nhập|đánh cắp|lừa đảo).*(ngân hàng|bank|tài khoản)|(?:ngân hàng|bank|tài khoản).*(hack|tấn công|xâm nhập)/i.test(normalized)) {
    return "Mình không thể hỗ trợ xâm nhập, đánh cắp tài khoản hoặc hành vi trái pháp luật. Nếu cần hỗ trợ mua sắm thời trang hoặc dịch vụ của cửa hàng, mình sẵn sàng giúp bạn.";
  }
  if (/(iphone|điện thoại|laptop|máy tính|tai nghe)/i.test(normalized)) {
    return "404Studio chỉ hỗ trợ sản phẩm thời trang và dịch vụ của cửa hàng. Hiện mình không có thông tin về mặt hàng này; bạn muốn xem quần áo, phụ kiện hoặc chính sách mua hàng không ạ?";
  }
  return null;
};
