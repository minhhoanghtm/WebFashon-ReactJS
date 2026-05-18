import ImagePreviewModal from "@/components/ImagePreviewModal";
import ListReview from "@/components/ListReview";
import StarRating from "@/components/Star";
import { Star } from "lucide-react";
import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

const reviews = [
  {
    _id: "661f1a2b3c4d5e6f7a8b9c01",
    product_id: "661f1a2b3c4d5e6f7a8b9c01",
    user_id: "661f1a2b3c4d5e6f7a8b9d01",
    rating: 5,
    content: {
      text: "Sản phẩm rất tốt, đóng gói cẩn thận, giao nhanh!",
      images: [
        "https://th.bing.com/th/id/R.66077522e722242423e14cae3cf541e5?rik=LHv1OG7HDPuU6Q&pid=ImgRaw&r=0",
        "https://cellphones.com.vn/sforum/wp-content/uploads/2024/01/anh-meme-5.jpg",
      ],
      videos: [],
    },
    likes_count: 3,
  },
  {
    _id: "661f1a2b3c4d5e6f7a8b9c02",
    product_id: "661f1a2b3c4d5e6f7a8b9c01",
    user_id: "661f1a2b3c4d5e6f7a8b9d02",
    rating: 4,
    content: {
      text: "Chất lượng ổn, sẽ ủng hộ lần sau.",
      images: [],
      videos: [],
    },
    likes_count: 1,
  },
  {
    _id: "661f1a2b3c4d5e6f7a8b9c03",
    product_id: "661f1a2b3c4d5e6f7a8b9c02",
    user_id: "661f1a2b3c4d5e6f7a8b9d03",
    rating: 3,
    content: {
      text: "Tạm ổn, nhưng giao hơi chậm.",
      images: [
        "https://anhnail.com/wp-content/uploads/2024/11/anhr-cute-300x269.jpg",
      ],
      videos: ["https://youtu.be/BIkjNo6W5mw"],
    },
    likes_count: 0,
  },
  {
    _id: "661f1a2b3c4d5e6f7a8b9c04",
    product_id: "661f1a2b3c4d5e6f7a8b9c03",
    user_id: "661f1a2b3c4d5e6f7a8b9d04",
    rating: 5,
    content: {
      text: "Rất đáng tiền! Có quay video review luôn 😄",
      images: [],
      videos: ["https://youtu.be/BIkjNo6W5mw"],
    },
    likes_count: 5,
  },
  {
    _id: "661f1a2b3c4d5e6f7a8b9c05",
    product_id: "661f1a2b3c4d5e6f7a8b9c04",
    user_id: "661f1a2b3c4d5e6f7a8b9d05",
    rating: 2,
    content: {
      text: "Không giống mô tả lắm, hơi thất vọng.",
      images: [],
      videos: [],
    },
    likes_count: 0,
  },
];
const ratingFiler = [
  { label: "Tất cả", value: 0 },
  { label: "5 sao", value: 5 },
  { label: "4 sao", value: 4 },
  { label: "3 sao", value: 3 },
  { label: "2 sao", value: 2 },
  { label: "1 sao", value: 1 },
];
const ProductReview = ({ reviews }) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [startIndex, setStartIndex] = useState(0);

  const handlePreview = (imgs, i) => {
    const safeImages = Array.isArray(imgs)
      ? imgs
          .map((img) => (typeof img === "string" ? img : img?.url))
          .filter(Boolean)
      : [];

    setImages(safeImages);
    setStartIndex(typeof i === "number" ? i : 0);
    setOpen(true);
  };
  //Tính trung bình đánh giá
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length ||
    0;
  //Giơi han số đánh giá hiển thị ban đầu
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  //Loc tin nhan rating cao nhat
  const sortedReviews = [...displayedReviews].sort(
    (a, b) => b.rating - a.rating,
  );
  //Loc tin nhan theo rating
  const filteredByRating =
    selectedRating === 0
      ? sortedReviews
      : sortedReviews.filter((review) => review.rating === selectedRating);
  return (
    <div className="min-w-full border rounded-lg shadow-sm">
      {/* Title  */}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Đánh giá sản phẩm</h2>
          <button
            className="text-sm text-blue-500 hover:underline"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Ẩn bớt" : "Xem tất cả"}
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center text-xl font-bold gap-1">
          <span className="text-yellow-600">{averageRating.toFixed(1)}</span>
          <FaStar className="text-yellow-500" />
          <span className="font-normal text-base text-gray-600">
            ({reviews.length} đánh giá)
          </span>
        </div>
        {/* Filer rating */}
        <div className="flex flex-wrap gap-2 mt-2">
          {ratingFiler.map((filter) => (
            <button
              key={filter.value}
              className={`px-3 py-1 text-sm border rounded-full hover:bg-blue-100 ${
                selectedRating === filter.value ? "bg-blue-500 text-white" : ""
              }`}
              onClick={() => setSelectedRating(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      {/* Review  */}
      <div className="">
        {filteredByRating.length === 0 ? (
          <p className="text-center">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          filteredByRating.map((review) => {
            return (
              <ListReview
                key={review._id}
                author={review.user_id.fullName || "Người dùng ẩn danh"}
                avatar={
                  review.user_id.avatar ||
                  "https://cdn.sforum.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg"
                }
                rating={review.rating}
                content={review.content}
                likes_count={review.likes_count}
                onPreview={handlePreview}
              />
            );
          })
        )}
      </div>
      <ImagePreviewModal
  open={open}
  images={images}
  startIndex={startIndex}
  onClose={() => setOpen(false)}
/>
    </div>
  );
};

export default ProductReview;
