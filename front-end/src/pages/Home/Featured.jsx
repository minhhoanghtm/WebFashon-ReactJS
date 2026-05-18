import { Link } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import { useEffect, useState } from "react";
import { getAllProductService } from "@/services/product.service";
const Featured = ({ products, selectedCategory, title = "Sản phẩm nổi bật" }) => {
  // console.log("Featured products:", products);
  // const [data, setData] = useState([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await getAllProductService();
  //       // console.log("API RESPONSE:", response);
  //       setData(response.data || []); // Đảm bảo rằng response.data tồn tại và là một mảng
  //     } catch (error) {
  //       console.error("Lỗi khi fetching sản phẩm:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []);

  // if (loading) {
  //   return <p>Đang tải sản phẩm...</p>;
  // }
  // if (!loading && products.length === 0) {
  //   return <p>Không có sản phẩm nào</p>;
  // }

  const filteredProducts = products.filter((product) => {
    // Lọc sản phẩm theo category nếu selectedCategory không null
    if (selectedCategory) {
      return product.category_id === selectedCategory._id;
    }
    return true; // Nếu không có category nào được chọn, hiển thị tất cả sản phẩm
  });
  return (
    <div className="my-4 mx-5">
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden">
        {filteredProducts?.map((product) => (
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
