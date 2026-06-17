import { useState } from "react";
import { ImageOff } from "lucide-react";
import brownBagImage from "../Home/assets/product-brown-bag.jpg";
import linenShirtImage from "../Home/assets/product-linen-shirt.jpg";
import navyBlazerImage from "../Home/assets/product-navy-blazer.jpg";
import whiteSneakersImage from "../Home/assets/product-white-sneakers.jpg";

const fallbackImages = [
  linenShirtImage,
  navyBlazerImage,
  whiteSneakersImage,
  brownBagImage,
];

const ProductGallery = ({ images, productName }) => {
  const galleryImages = Array.isArray(images) && images.length ? images : fallbackImages;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImages[0];
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery__main">
        {galleryImages[activeIndex] ? (
          <img
            src={galleryImages[activeIndex]}
            alt={productName}
            onError={handleImageError}
          />
        ) : (
          <div className="product-gallery__placeholder">
            <ImageOff size={34} aria-hidden="true" />
            <span>Đang cập nhật hình ảnh</span>
          </div>
        )}
      </div>

      {galleryImages.length > 1 && (
        <div className="product-gallery__thumbs">
          {galleryImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <img
                src={image}
                alt={`${productName} ${index + 1}`}
                onError={handleImageError}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
