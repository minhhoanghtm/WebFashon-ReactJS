import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
const Featured = () => {
  const data = [
    {
      name: "Áo thun nam basic",
      displayProduct: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS33eie07UkEmSC8De1q10EE28E4JHQy7rbmg&s"],
      category_id: "65f1a1b2c3d4e5f678901234",
      slug: "ao-thun-nam-basic",
      description: "Áo thun cotton thoáng mát",
      old_price: 200000,
      new_price: 150000,
      rating: 4.3,
      is_active: true,
    },
    {
      name: "Giày thể thao Nike",
      displayProduct: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQM-_OIe1DC3mIUQt7j98g3Nai3SUutmu7puA&s"],
      category_id: "65f1a1b2c3d4e5f678901234",
      slug: "giay-the-thao-nike",
      description: "Giày thể thao năng động",
      old_price: 1200000,
      new_price: 950000,
      rating: 4.8,
      is_active: true,
    },
    {
      name: "Túi xách nữ",
      displayProduct: ["https://cdn.kkfashion.vn/26797-home_default/dam-caro-chu-a-cong-so-phoi-dang-ten-kk164-35.jpg"],
      category_id: "65f1a1b2c3d4e5f678901235",
      slug: "tui-xach-nu",
      description: "Túi xách thời trang",
      old_price: 500000,
      new_price: 350000,
      rating: 4.5,
      is_active: true,
    },
    {
      name: "Đồng hồ nam",
      displayProduct: ["https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg"],
      category_id: "65f1a1b2c3d4e5f678901236",
      slug: "dong-ho-nam",
      description: "Đồng hồ sang trọng",
      old_price: 2000000,
      new_price: 1500000,
      rating: 4.2,
      is_active: true,
    },
  ];
  return (
    <div className="my-4 mx-5">
      <h1 className="text-xl font-bold mb-4">Sản phẩm nổi bật</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
        {data.map((product) => (
          <Link
            to={`/product/${product.slug}`}
            key={product._id}
            className="border rounded-lg p-2 "
          >
            <ProductCard product={product} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Featured;
