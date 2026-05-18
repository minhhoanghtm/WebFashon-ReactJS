import { Carousel, Dropdown, Modal } from "antd";
import { useState } from "react";
import StarRating from "../../components/Star";
import ImagePreviewModal from "@/components/ImagePreviewModal";

// const data = {
//   _id: "1",
//   name: "Đồng hồ nam cao cấp",
//   displayProduct: [
//     "https://cdn.kkfashion.vn/24416-large_default/dam-chu-a-lien-than-cong-so-co-tron-kk161-04.jpg",
//   ],
//   category_id: "65f1a1b2c3d4e5f678901236",
//   slug: "dong-ho-nam-cao-cap",
//   description: "Đồng hồ sang trọng",
//   old_price: 2500000,
//   new_price: 1800000,
//   sold: 120,
//   rating: 4.5,
//   is_active: true,
// };
// const productVariants = [
//   {
//     product_id: "1",
//     color: "Đen",
//     size: "M",
//     stock: 50,
//     image_url:
//       "https://file3.qdnd.vn/data/images/0/2023/05/03/vuhuyen/khanhphan.jpg?dpi=150&quality=100&w=870",
//   },
//   {
//     product_id: "1",
//     color: "Trắng",
//     size: "L",
//     stock: 30,
//     image_url:
//       "https://file3.qdnd.vn/data/images/0/2024/03/06/upload_2322/_dsc9841.jpg?dpi=150&quality=100&w=870",
//   },
//   {
//     product_id: "2",
//     color: "Xanh",
//     size: "S",
//     stock: 20,
//     image_url:
//       "https://media-cdn-v2.laodong.vn/storage/newsportal/2023/3/11/1156607/318076980_2013923305.jpg",
//   },
//   {
//     product_id: "2",
//     color: "Đỏ",
//     size: "M",
//     stock: 15,
//     image_url: "https://luxuo.vn/wp-content/uploads/2021/06/IMG_8837.jpg",
//   },
//   {
//     product_id: "3",
//     color: "Đen",
//     size: "XL",
//     stock: 40,
//     image_url:
//       "https://media-cdn-v2.laodong.vn/storage/newsportal/2024/8/22/1383302/Canhdep_Vietnam-1.jpg",
//   },
//   {
//     product_id: "3",
//     color: "Xám",
//     size: "L",
//     stock: 25,
//     image_url:
//       "https://dulichviet.com.vn/images/bandidau/danh-sach-nhung-buc-anh-viet-nam-lot-top-anh-dep-the-gioi.jpg",
//   },
//   {
//     product_id: "4",
//     color: "Trắng",
//     size: "S",
//     stock: 10,
//     image_url:
//       "https://media-cdn-v2.laodong.vn/storage/newsportal/2023/8/26/1233821/Nhieu-LIKE---Mong-Ng.jpg",
//   },
//   {
//     product_id: "4",
//     color: "Xanh",
//     size: "M",
//     stock: 35,
//     image_url:
//       "https://noithatbinhminh.com.vn/wp-content/uploads/2022/08/anh-dep-44.jpg.webp",
//   },
//   {
//     product_id: "5",
//     color: "Đỏ",
//     size: "L",
//     stock: 45,
//     image_url:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAvAeAL_doBuim9d57QJPSqqTHqr6FDOoscQ&s",
//   },
//   {
//     product_id: "5",
//     color: "Đen",
//     size: "XL",
//     stock: 60,
//     image_url:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkdWA_dzMoFmwsSCDDQDg5m-bGvkUxLEex0g&s",
//   },
// ];
const ProductInfo = ({ product, variants, selected, updateSelected }) => {
  if (!product) return <p>Không tìm thấy sản phẩm</p>;
  // console.log("Product in ProductInfo:", product);
  // console.log("Variants in ProductInfo:", variants);

  const [openImage, setOpenImage] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  // Kết hợp ảnh từ displayProduct và productVariants
  const images = [
    ...(product?.displayProduct || []),
    ...variants.map((v) => v.image_url).filter(Boolean),
  ];

  // Tính phần trăm giảm giá
  const discount =
    product.old_price > 0
      ? Math.round(
          ((product.old_price - product.new_price) / product.old_price) * 100,
        )
      : 0;
  // console.log(discount);

  // Kiểm tra nếu có phân loại sản phẩm
  const hasVariants = (variants?.length ?? 0) > 0;
  
  const simpleStock = Number(product?.stock ?? 0);

const variantStock =
  hasVariants && selected.color && selected.size
    ? (variants.find(
        (v) =>
          v.color === selected.color &&
          v.size === selected.size
      )?.stock ?? 0)
    : 0;

const currentStock = hasVariants ? variantStock : simpleStock;
  //Lấy mẫu sản phẩm
  const variant = hasVariants
  ? [...new Set(variants.map((v) => v.color))]
  : [];
  //Lấy ảnh theo màu
  const imagesByColor = variant.reduce((acc, color) => {
    const found = variants.find((v) => v.color === color);
    if (found) {
      acc[color] = found.image_url;
    }
    return acc;
  }, {});
  // console.log("Images by color:", imagesByColor);

  //Lấy size theo màu
  const sizesBySelectedColor = variants.reduce((acc, v) => {
    if (v.color === selected.color) {
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
  const stockByColorAndSize = hasVariants
  ? selected.color && selected.size
    ? (variants.find(
        (v) => v.color === selected.color && v.size === selected.size,
      )?.stock ?? 0)
    : 0
  : product.stock ?? 0;

  const selectedVariant =
    variants.find(
      (v) => v.color === selected.color && v.size === selected.size,
    ) || null;

    //kiểm tra size có tồn tại khi đã chọn màu
  const sizeItems = selected.color
    ? (sizesBySelectedColor[selected.color] || []).map((size) => ({
        key: size,
        label: size,
      }))
    : [];
const finalSizeItems =
  sizeItems.length > 0
    ? sizeItems
    : [{ key: "free", label: "Free size" }];
    
  //không tăng khi chọn size và color
  const canChangeQuantity =
  hasVariants
    ? selected.color && selected.size && currentStock > 0
    : product?.stock === undefined || simpleStock > 0; 

  //báo lỗi khi chọn số lượng lớn hơn stock
  const warning = (() => {
  if (hasVariants) {
    if (!selected.color) return "Vui lòng chọn màu";
    if (!selected.size) return "Vui lòng chọn size";
    if (currentStock <= 0) return "Sản phẩm hết hàng";
    return "";
  }

  // ✅ Chỉ báo hết hàng nếu stock được cung cấp VÀ thực sự = 0
  if (product?.stock !== undefined && simpleStock <= 0) return "Sản phẩm hết hàng";

  return "";
})();
console.log("product.stock:", product?.stock, "simpleStock:", simpleStock);
  // console.log("Color:", selected.color);
  // console.log("Sizes by color:", sizesBySelectedColor);
  // console.log("Selected size:", selected.size);
  console.log("Stock by color and size:", stockByColorAndSize);
  // if (loading) return <p>Loading...</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-9 h-full mx-5 my-5">
      {/* Image */}
      <div className="rounded-xl overflow-hidden shadow-md">
        <Carousel arrows autoplay autoplaySpeed={3000} effect="scrollx">
          {images.map((img, index) => (
            <div key={index} className="aspect-square bg-white">
              <img
                src={img}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => {
                  setStartIndex(index);
                  setOpenImage(true);
                }}
              />
            </div>
          ))}
        </Carousel>
      </div>
      {/* Info */}
      <div className="relative h-full flex flex-col justify-center">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-gray-600">{product.description}</p>
        <div className="flex items-center gap-4 mt-2">
          <StarRating rating={product.rating} />
          <span>Đá bán: {product.sold}</span>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-2xl text-red-500 font-bold">
            {(product?.new_price || 0).toLocaleString("vi-VN")}đ
          </span>

          <span className="text-gray-400 line-through text-sm">
            {(product?.old_price || 0).toLocaleString("vi-VN")}đ
          </span>

          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        </div>
        <div className="mt-5">
          <p className="font-medium mb-2">Phân loại</p>

          <div className="flex flex-wrap gap-3">
            {Object.keys(imagesByColor).map((color) => (
              <button
                key={color}
                onClick={() => updateSelected("color", color)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-full transition-all duration-200
          ${
            selected.color === color
              ? "border-red-500 bg-red-50 scale-105"
              : "border-gray-300 hover:border-gray-500"
          }`}
              >
                <span className="text-sm">{color}</span>
                <img
                  src={imagesByColor[color]}
                  alt={color}
                  className="w-5 h-5 rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <p className="font-medium">Size:</p>

          <Dropdown
            menu={{
              items: sizeItems,
              onClick: ({ key }) => updateSelected("size", key),
            }}
            placement="bottomLeft"
            disabled={!selected.color}
          >
            <button
              className={`px-4 py-1 border rounded-full transition
        ${
          selected.color
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
            >
              {selected.size || "Chọn size"}
            </button>
          </Dropdown>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <p className="font-medium">Số lượng:</p>

          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              className="px-3 py-1 hover:bg-gray-100"
              disabled={!!warning}
              onClick={() =>
                updateSelected("quantity", Math.max(1, selected.quantity - 1))
              }
            >
              -
            </button>

            <span className="px-4">{selected.quantity}</span>

            <button
              className="px-3 py-1 hover:bg-gray-100"
              disabled={!canChangeQuantity}
              onClick={() =>
                updateSelected(
                  "quantity",
                  Math.min(currentStock, selected.quantity + 1),
                )
              }
            >
              +
            </button>
          </div>
          {warning && <p className="text-red-500 text-sm">{warning}</p>}
        </div>
      </div>
      <ImagePreviewModal
        images={images}
        open={openImage}
        startIndex={startIndex}
        onClose={() => setOpenImage(false)}
      />
    </div>
  );
};
export default ProductInfo;
