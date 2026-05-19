import { useState } from "react";
import { Card } from "antd";
import Star from "./Star";
import MediaViewer from "./MediaViewer";

const ProductCard = ({ product }) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (!product) return null;

  const media = [
    ...(product.displayProduct || []).map((url) => ({
      type: "image",
      url,
    })),
    ...(product.videos || []).map((url) => ({
      type: "video",
      url,
    })),
  ];

  const discountPercentage = product.old_price
    ? Math.round(
        ((product.old_price - product.new_price) / product.old_price) * 100,
      )
    : 0;

  return (
    <div className="relative">
      <Card
        hoverable
        cover={
          <div className="w-full h-60 overflow-hidden rounded-lg">
            <img
              src={product.displayProduct?.[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center cursor-pointer"
              onClick={() => {
                setIndex(0);
                setOpen(true);
              }}
            />
          </div>
        }
      >
        {discountPercentage > 0 && (
          <span className="sale-badge absolute top-2 right-2 text-white text-xs font-bold px-3 py-1 rounded-full">
            -{discountPercentage}%
          </span>
        )}
        {/* Name  */}
        <p className="text-sm md:text-base font-semibold line-clamp-2">
          {product.name}
        </p>
        {/* Price  */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-red-500 font-bold text-sm md:text-base">
            {product.new_price?.toLocaleString()}đ
          </span>
          <span className="line-through text-gray-400 text-sm md:text-base">
            {product.old_price?.toLocaleString()}đ
          </span>
        </div>
        <Star rating={product.rating || 0} />
      </Card>
      {/* 
      <MediaViewer
        media={media}
        open={open}
        initialIndex={index}
        onClose={() => setOpen(false)}
      /> */}
    </div>
  );
};

export default ProductCard;
