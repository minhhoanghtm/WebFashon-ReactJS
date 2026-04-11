import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1 text-yellow-500 
                text-sm sm:text-base md:text-lg lg:text-xl">
      {[...Array(5)].map((_, index) => {
        const starNumber = index + 1;

        if (rating >= starNumber) {
          // Sao đầy
          return <FaStar key={index} />;
        } else if (rating >= starNumber - 0.5) {
          // Nửa sao
          return <FaStarHalfAlt key={index} />;
        } else {
          // Sao rỗng
          return <FaRegStar key={index} />;
        }
      })}
    </div>
  );
};

export default StarRating;
