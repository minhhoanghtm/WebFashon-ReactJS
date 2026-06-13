import heroImage from "./assets/hero-atelier.jpg";
import lookbookEveningImage from "./assets/lookbook-evening.jpg";
import lookbookSummerImage from "./assets/lookbook-summer.jpg";
import brownBagImage from "./assets/product-brown-bag.jpg";
import linenShirtImage from "./assets/product-linen-shirt.jpg";
import navyBlazerImage from "./assets/product-navy-blazer.jpg";
import whiteSneakersImage from "./assets/product-white-sneakers.jpg";

export const fallbackProductImage = linenShirtImage;

export const heroContent = {
  eyebrow: "Thiết kế cho mùa mới",
  title: "Bộ sưu tập mùa hè",
  subtitle: "Khám phá phong cách hiện đại và thanh lịch",
  buttonLabel: "Mua ngay",
  image: heroImage,
};

export const mockProducts = [
  {
    id: "mock-linen-shirt",
    name: "Áo sơ mi linen thanh lịch",
    price: 689000,
    oldPrice: 790000,
    image: linenShirtImage,
    category: "Áo sơ mi",
    description: "Chất linen nhẹ, thoáng mát cho những ngày nắng.",
    rating: 4.8,
    badge: "Bán chạy",
  },
  {
    id: "mock-white-sneakers",
    name: "Giày thể thao trắng tối giản",
    price: 1290000,
    image: whiteSneakersImage,
    category: "Giày",
    description: "Phom dáng gọn gàng, dễ kết hợp với nhiều trang phục.",
    rating: 4.7,
    badge: "Mới",
  },
  {
    id: "mock-navy-blazer",
    name: "Áo blazer xanh navy",
    price: 1590000,
    oldPrice: 1790000,
    image: navyBlazerImage,
    category: "Áo khoác",
    description: "Thiết kế may đo hiện đại dành cho phong cách công sở.",
    rating: 4.9,
    badge: "Nổi bật",
  },
  {
    id: "mock-brown-bag",
    name: "Túi da nâu dáng cong",
    price: 890000,
    image: brownBagImage,
    category: "Phụ kiện",
    description: "Mẫu túi nhỏ gọn với chất liệu da mềm và đường nét tinh tế.",
    rating: 4.6,
    badge: "Yêu thích",
  },
];

export const lookbookItems = [
  {
    id: "lookbook-summer",
    label: "Thanh lịch mùa hè",
    title: "Sắc màu trung tính",
    subtitle: "Linen nhẹ nhàng cho những ngày thành phố đầy nắng.",
    image: lookbookSummerImage,
  },
  {
    id: "lookbook-evening",
    label: "Phong cách hiện đại",
    title: "Tối giản sau giờ làm",
    subtitle: "Phom dáng may đo tạo nên vẻ ngoài tự tin và tinh tế.",
    image: lookbookEveningImage,
  },
];
