import React from "react";
import { Link } from "react-router-dom";

const Categories = () => {
  const data = [
    {
      _id: "1",
      name: "Áo thun",
      image:
        "https://theblues.com.vn/wp-content/uploads/2023/09/DSC07835-scaled-600x720.jpg",
      slug: "ao-thun",
      description: "Áo thun nam nữ chất lượng cao",
    },
    {
      _id: "2",
      name: "Quần jean",
      image: "https://cdn0199.cdn4s.com/media/qj181%20moi%20-%20copy.jpg",
      slug: "quan-jean",
      description: "Quần jean nam nữ thời trang",
    },
    {
      _id: "3",
      name: "Giày sneaker",
      image:
        "https://product.hstatic.net/1000402464/product/so25ss04p-cs__white___1__4e9cd76898fb4a929354d12cd906a853_master.jpg",
      slug: "giay-sneaker",
      description: "Giày sneaker nam nữ đa dạng mẫu mã",
    },
    {
      _id: "4",
      name: "Phụ kiện",
      image:
        "https://phuongnamvina.com/img_data/images/bi-quyet-kinh-doanh-phu-kien-thoi-trang-sieu-loi-nhuan.jpg",
      slug: "phu-kien",
      description: "Phụ kiện thời trang nam nữ",
    },
    {
      _id: "5",
      name: "Đầm váy",
      image:
        "https://bizweb.dktcdn.net/thumb/1024x1024/100/403/511/products/o1cn01bsedj01e8bnfyhym82206418.jpg",
      slug: "dam-vay",
      description: "Đầm váy nữ đẹp và sang trọng",
    },
  ];
  return (
    <div className="my-4 mx-5">
      <h1 className="text-xl font-bold mb-4">Danh mục</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
        {data.map((category) => (
          <Link to={`/categories/${category.slug}`} key={category._id} className="border rounded-lg p-2">
            <div className="relative h-20 overflow-hidden rounded-md">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/30"></div>

              {/* Tên */}
              <h2 className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold text-center px-2">
                {category.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
