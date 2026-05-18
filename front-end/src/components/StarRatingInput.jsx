import { FaStar, FaRegStar } from "react-icons/fa";
import { useState } from "react";

const StarRatingInput = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1 text-2xl cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hover || value) >= star;

        return (
          <span
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition hover:scale-110"
          >
            {active ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-300" />
            )}
          </span>
        );
      })}
    </div>
  );
};

export default StarRatingInput;