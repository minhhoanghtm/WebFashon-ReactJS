import brownBagImage from "../Home/assets/product-brown-bag.jpg";
import linenShirtImage from "../Home/assets/product-linen-shirt.jpg";
import navyBlazerImage from "../Home/assets/product-navy-blazer.jpg";
import whiteSneakersImage from "../Home/assets/product-white-sneakers.jpg";

export const fallbackImages = [
  linenShirtImage,
  navyBlazerImage,
  whiteSneakersImage,
  brownBagImage,
];

export const fallbackDescription =
  "Thông tin sản phẩm đang được cập nhật. Thiết kế được chọn lọc để phù hợp với phong cách hiện đại, dễ phối đồ và thoải mái khi sử dụng hằng ngày.";

export const fallbackPolicy =
  "Hỗ trợ đổi trả theo chính sách của cửa hàng. Sản phẩm cần còn nguyên tem mác, chưa qua sử dụng và được gửi yêu cầu trong thời gian quy định.";

export const fallbackRelatedProducts = [
  {
    id: "mock-ao-linen",
    slug: "mock-ao-linen",
    name: "Áo sơ mi linen thanh lịch",
    price: 689000,
    image: linenShirtImage,
    category: "Áo sơ mi",
    rating: 4.8,
    isMock: true,
  },
  {
    id: "mock-blazer-navy",
    slug: "mock-blazer-navy",
    name: "Áo blazer xanh navy",
    price: 1590000,
    image: navyBlazerImage,
    category: "Áo khoác",
    rating: 4.9,
    isMock: true,
  },
  {
    id: "mock-giay-trang",
    slug: "mock-giay-trang",
    name: "Giày thể thao trắng tối giản",
    price: 1290000,
    image: whiteSneakersImage,
    category: "Giày",
    rating: 4.7,
    isMock: true,
  },
  {
    id: "mock-tui-da",
    slug: "mock-tui-da",
    name: "Túi da nâu dáng cong",
    price: 890000,
    image: brownBagImage,
    category: "Phụ kiện",
    rating: 4.6,
    isMock: true,
  },
];

export const fallbackProductDetails = [
  {
    id: "mock-ao-linen",
    slug: "mock-ao-linen",
    name: "Áo sơ mi linen thanh lịch",
    price: 689000,
    oldPrice: 790000,
    images: [linenShirtImage, navyBlazerImage],
    image: linenShirtImage,
    category: "Áo sơ mi",
    description:
      "Áo sơ mi linen nhẹ, thoáng và dễ phối cùng quần âu hoặc denim. Thiết kế hướng đến cảm giác thoải mái nhưng vẫn giữ được nét chỉn chu cho phong cách hằng ngày.",
    rating: 4.8,
    reviewCount: 0,
    stock: 20,
    badge: "Bán chạy",
    isMock: true,
  },
  {
    id: "mock-giay-trang",
    slug: "mock-giay-trang",
    name: "Giày thể thao trắng tối giản",
    price: 1290000,
    images: [whiteSneakersImage],
    image: whiteSneakersImage,
    category: "Giày",
    description:
      "Giày thể thao trắng với phom dáng gọn gàng, phù hợp nhiều kiểu phối đồ từ năng động đến smart casual.",
    rating: 4.7,
    reviewCount: 0,
    stock: 18,
    badge: "Mới",
    isMock: true,
  },
  {
    id: "mock-blazer-navy",
    slug: "mock-blazer-navy",
    name: "Áo blazer xanh navy",
    price: 1590000,
    oldPrice: 1790000,
    images: [navyBlazerImage, linenShirtImage],
    image: navyBlazerImage,
    category: "Áo khoác",
    description:
      "Blazer xanh navy phom hiện đại, dễ tạo vẻ ngoài thanh lịch cho môi trường công sở hoặc những buổi gặp gỡ quan trọng.",
    rating: 4.9,
    reviewCount: 0,
    stock: 12,
    badge: "Nổi bật",
    isMock: true,
  },
  {
    id: "mock-tui-da",
    slug: "mock-tui-da",
    name: "Túi da nâu dáng cong",
    price: 890000,
    images: [brownBagImage],
    image: brownBagImage,
    category: "Phụ kiện",
    description:
      "Túi da nâu nhỏ gọn với đường nét mềm mại, tạo điểm nhấn tinh tế cho trang phục thường ngày.",
    rating: 4.6,
    reviewCount: 0,
    stock: 15,
    badge: "Yêu thích",
    isMock: true,
  },
];
