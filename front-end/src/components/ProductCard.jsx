import { Card } from "antd";
import Star from "./Star";
const ProductCard = ({ product }) => {
  if (!product) return null;
  return (
    <div>
      <Card
        hoverable
        style={{ width: '100%' }}
        cover={
          <img
            draggable={false}
            alt={product.name}
            src={product.displayProduct?.[0]}
            className="w-full h-full object-cover"
          />
        }
      >
        <div>
          <p className="text-lg font-bold">{product.name}</p>
          <div className="flex items-end gap-5 mb-1">
            <span className="text-sm font-bold text-red-500">{product.new_price?.toLocaleString()}đ</span>
            <span className="text-xs line-through text-gray-400">{product.old_price?.toLocaleString()}đ</span>
          </div>
          <Star rating={product.rating || 0} />
        </div>
      </Card>
    </div>
  );
};

export default ProductCard;
