import { Carousel, Dropdown } from "antd";
import { useState } from "react";
import StarRating from "../../components/Star";

const ProductInfo = () => {
  const [quantity, setQuantity] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [stock, setStock] = useState(0);
  const data = {
    _id: "1",
    name: "Đồng hồ nam cao cấp",
    displayProduct: [
      "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
    ],
    category_id: "65f1a1b2c3d4e5f678901236",
    slug: "dong-ho-nam-cao-cap",
    description: "Đồng hồ sang trọng",
    old_price: 2500000,
    new_price: 1800000,
    sold: 120,
    rating: 4.5,
    is_active: true,
  };
  const productVariants = [
    {
      product_id: "1",
      color: "Đen",
      size: "M",
      stock: 50,
      image_url:
        "https://file3.qdnd.vn/data/images/0/2023/05/03/vuhuyen/khanhphan.jpg?dpi=150&quality=100&w=870",
    },
    {
      product_id: "1",
      color: "Trắng",
      size: "L",
      stock: 30,
      image_url:
        "https://file3.qdnd.vn/data/images/0/2024/03/06/upload_2322/_dsc9841.jpg?dpi=150&quality=100&w=870",
    },
    {
      product_id: "2",
      color: "Xanh",
      size: "S",
      stock: 20,
      image_url:
        "https://media-cdn-v2.laodong.vn/storage/newsportal/2023/3/11/1156607/318076980_2013923305.jpg",
    },
    {
      product_id: "2",
      color: "Đỏ",
      size: "M",
      stock: 15,
      image_url: "https://luxuo.vn/wp-content/uploads/2021/06/IMG_8837.jpg",
    },
    {
      product_id: "3",
      color: "Đen",
      size: "XL",
      stock: 40,
      image_url:
        "https://media-cdn-v2.laodong.vn/storage/newsportal/2024/8/22/1383302/Canhdep_Vietnam-1.jpg",
    },
    {
      product_id: "3",
      color: "Xám",
      size: "L",
      stock: 25,
      image_url:
        "https://dulichviet.com.vn/images/bandidau/danh-sach-nhung-buc-anh-viet-nam-lot-top-anh-dep-the-gioi.jpg",
    },
    {
      product_id: "4",
      color: "Trắng",
      size: "S",
      stock: 10,
      image_url:
        "https://media-cdn-v2.laodong.vn/storage/newsportal/2023/8/26/1233821/Nhieu-LIKE---Mong-Ng.jpg",
    },
    {
      product_id: "4",
      color: "Xanh",
      size: "M",
      stock: 35,
      image_url:
        "https://noithatbinhminh.com.vn/wp-content/uploads/2022/08/anh-dep-44.jpg.webp",
    },
    {
      product_id: "5",
      color: "Đỏ",
      size: "L",
      stock: 45,
      image_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvAeAL_doBuim9d57QJPSqqTHqr6FDOoscQ&s",
    },
    {
      product_id: "5",
      color: "Đen",
      size: "XL",
      stock: 60,
      image_url:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkdWA_dzMoFmwsSCDDQDg5m-bGvkUxLEex0g&s",
    },
  ];
  //Lọc các ảnh của sản phẩm hiện tại
  const images = [
    ...data.displayProduct,
    ...productVariants.flatMap((v) => v.image_url),
  ];
  // Tính phần trăm giảm giá
  const discount = Math.round(
    ((data.old_price - data.new_price) / data.old_price) * 100,
  );
  // console.log(discount);

  //Lấy mẫu sản phẩm
  const variant = [...new Set(productVariants.map((v) => v.color))];
  // console.log("Variant:", variant);
  //Lấy ảnh theo màu
  const imagesByColor = variant.reduce((acc, color) => {
    const found = productVariants.find((v) => v.color === color);
    if (found) {
      acc[color] = found.image_url;
    }
    return acc;
  }, {});
  console.log("Images by color:", imagesByColor);
  //Lấy size theo màu
  const sizesBySelectedColor = productVariants.reduce((acc, v) => {
    if (v.color === selectedColor) {
      if (!acc[v.color]) {
        acc[v.color] = [];
      }
      if (!acc[v.color].includes(v.size)) {
        acc[v.color].push(v.size);
      }
    }
    return acc;
  }, {});

  //Lấy stock theo màu và size
  const stockByColorAndSize = productVariants.reduce((acc, v) => {
    if (v.color === selectedColor && v.size === selectedSize) {
      acc = v.stock;
    }
    return acc;
  }, 0);
  const selectedVariant = productVariants.find(v => v.color === selectedColor && v.size === selectedSize) || null;
  console.log("Color:", selectedColor);
  console.log("Sizes by color:", sizesBySelectedColor);
  console.log("Selected size:", selectedSize);
  console.log("Stock by color and size:", stockByColorAndSize);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-9 h-full mx-5 my-5">
      {/* Image */}
      <div>
        <Carousel arrows infinite={true}>
          {images.map((img, index) => (
            <div key={index} className="w-full aspect-square">
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </Carousel>
      </div>
      {/* Info */}
      <div className="relative h-full flex flex-col justify-center">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-gray-600">{data.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <StarRating rating={data.rating} />
          <span>Đá bán: {data.sold}</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-lg text-red-500 font-bold">
            {data.new_price.toLocaleString("vi-VN")}đ
          </span>
          <span className="text-gray-500 line-through">
            {data.old_price.toLocaleString("vi-VN")}đ
          </span>
          <span className="bg-red-500 text-white text-sm font-bold px-2 py-1">
            -{discount}%
          </span>
        </div>
        <div className="mt-4">
          <span >Phân loại:</span>
          <span>
            {Object.keys(imagesByColor).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`flex-wrap px-1 py-1 mx-2 border rounded 
                    ${selectedColor === color ? "border-red-500" : "border-gray-300"}`}
              >
                <span>{color}</span>
                <span>
                  <img
                    src={imagesByColor[color]}
                    alt={color}
                    className="w-6 h-6 object-cover rounded-full ml-2"
                  />
                </span>
              </button>
            ))}
          </span>
        </div>
        <div className="flex justify-start items-center gap-4 mt-2">
          <p>Size:</p>
          <Dropdown
            menu={{
              items: sizesBySelectedColor[selectedColor]?.map((size) => ({
                key: size,
                label: size,
              })),
            onClick: ({ key }) => setSelectedSize(key)
            }}
            placement="topLeft"
            disabled={!selectedColor}
            className={`${
              selectedColor
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <button className="border rounded-full px-2">{(selectedSize && selectedVariant) ?  selectedSize : "Chọn size ^"}</button>
          </Dropdown>
          {!selectedColor && (
            <p className="text-red-500 mt-2">Vui lòng chọn màu trước</p>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <p>Số lượng: </p>
          <div>
            <button
              className="px-3 border"
              onClick={() => setQuantity(Math.max(0, quantity - 1))}
            >
              -
            </button>
            <span className="px-4">{quantity}</span>
            <button
              className="px-3 border"
              onClick={() => setQuantity(Math.min(stockByColorAndSize, quantity + 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
