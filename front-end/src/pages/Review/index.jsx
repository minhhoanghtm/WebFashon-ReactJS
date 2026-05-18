import React, { useState } from "react";
import StarRatingInput from "@/components/StarRatingInput";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { createReviewService } from "@/services/review.service";
import { uploadImageService } from "@/services/upload.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";

const Review = () => {
  useDocumentTitle("Đánh giá sản phẩm");
  
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const productId = searchParams.get("product_id");
  const orderId = searchParams.get("order_id");
  
  // Lấy item từ state được truyền từ Order page
  const stateItem = location.state?.item;
  const stateOrder = location.state?.order;

  const [item] = useState(stateItem || null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      setError("Tối đa 5 hình ảnh. Bạn đã có " + images.length);
      return;
    }

    setIsUploading(true);
    try {
      const newImages = await Promise.all(
        files.map((file) => uploadImageService(file))
      );
      setImages((prev) => [...prev, ...newImages]);
    } catch {
      setError("Upload ảnh thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (videos.length + files.length > 2) {
      setError("Tối đa 2 video. Bạn đã có " + videos.length);
      return;
    }

    setIsUploading(true);
    try {
      const newVideos = await Promise.all(
        files.map((file) => uploadImageService(file))
      );
      setVideos((prev) => [...prev, ...newVideos]);
    } catch {
      setError("Upload video thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      setError("Vui lòng chọn số sao");
      return;
    }
    
    if (!comment.trim()) {
      setError("Vui lòng nhập đánh giá");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const reviewData = {
        product_id: item?.product_id || productId,
        rating,
        content: {
          text: comment.trim(),
          images: images,
          videos: videos,
        }
      };
      
      const res = await createReviewService(reviewData);
      if (res?.success) {
        // alert("Đánh giá của bạn đã được gửi thành công!");
        toast.success("Đánh giá của bạn đã được gửi thành công!");
        navigate("/orders");
      } else {
        setError("Gửi đánh giá thất bại. Vui lòng thử lại.");
        toast.error("Gửi đánh giá thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Lỗi khi gửi đánh giá");
      toast.error("Lỗi khi gửi đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-5 py-10">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 text-blue-500 hover:underline text-sm"
      >
        ← Quay lại
      </button>

      <h1 className="text-3xl font-bold mb-8">Đánh giá sản phẩm</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Sản phẩm */}
      {item ? (
        <div className="border rounded-lg p-6 mb-8 bg-gray-50">
          <div className="flex items-start gap-6">
            <img 
              src={item.variant?.image_url || item.product_image || "https://via.placeholder.com/100"} 
              alt={item.product_name} 
              className="w-24 h-24 object-cover rounded border"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{item.product_name}</h3>
              <p className="text-gray-600 mb-3">
                <span className="mr-4">Số lượng: {item.quantity}</span>
              </p>
              <p className="text-sm text-gray-500">
                <span className="mr-4">Màu: {item.variant?.color || "Không có"}</span>
                <span>Size: {item.variant?.size || "Không có"}</span>
              </p>
              <p className="text-lg font-semibold text-red-500 mt-3">
                {item.price?.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6 mb-8 bg-yellow-50">
          <p className="text-yellow-700">Không có thông tin sản phẩm. Vui lòng quay lại và thử lại.</p>
        </div>
      )}

      {/* Form Đánh giá */}
      {item && (
        <form onSubmit={handleSubmitReview} className="border rounded-lg p-6 bg-white">
          {/* Đánh giá */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Đánh giá của bạn</h3>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium">Số sao:</span>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Nhận xét của bạn</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
              />
            </div>

            {/* Upload hình ảnh */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Hình ảnh (Tối đa 5)</label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="file"
                  id="image-input"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading || images.length >= 5}
                  className="hidden"
                />
                <label
                  htmlFor="image-input"
                  className={`px-4 py-2 rounded-lg cursor-pointer border ${
                    isUploading || images.length >= 5
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  {isUploading ? "Đang upload..." : "Chọn hình ảnh"}
                </label>
                <span className="text-sm text-gray-500">{images.length}/5</span>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        alt={`Review ${i}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload video */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Video (Tối đa 2)</label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="file"
                  id="video-input"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploading || videos.length >= 2}
                  className="hidden"
                />
                <label
                  htmlFor="video-input"
                  className={`px-4 py-2 rounded-lg cursor-pointer border ${
                    isUploading || videos.length >= 2
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {isUploading ? "Đang upload..." : "Chọn video"}
                </label>
                <span className="text-sm text-gray-500">{videos.length}/2</span>
              </div>
              {videos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((vid, i) => (
                    <div key={i} className="relative group">
                      <video
                        src={vid}
                        className="w-full h-24 object-cover rounded border bg-black"
                      />
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Review;
