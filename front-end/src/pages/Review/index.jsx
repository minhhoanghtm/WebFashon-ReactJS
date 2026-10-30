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
    <div className="min-h-screen bg-[#F7F7F7] text-[#05251C] py-12 px-4 sm:px-6 select-none">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#05251C] hover:opacity-75 cursor-pointer"
        >
          ← Quay lại đơn hàng
        </button>

        <h1 className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-[#05251C] mb-8 leading-[0.95]">
          ĐÁNH GIÁ THIẾT KẾ.
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Sản phẩm */}
        {item ? (
          <div className="border border-[#05251C]/10 rounded-3xl p-6 mb-8 bg-white shadow-xs">
            <div className="flex items-start gap-6">
              <img 
                src={item.variant?.image_url || item.product_image || "https://via.placeholder.com/100"} 
                alt={item.product_name} 
                className="w-24 h-24 object-cover rounded-2xl border border-[#05251C]/10"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold font-display text-[#05251C] mb-1">{item.product_name}</h3>
                <p className="text-xs text-[#6B716E] mb-2">
                  <span className="mr-4">Số lượng: {item.quantity}</span>
                </p>
                <p className="text-xs text-[#6B716E]">
                  <span className="mr-4">Màu: {item.variant?.color || "Tiêu chuẩn"}</span>
                  <span>Size: {item.variant?.size || "Tiêu chuẩn"}</span>
                </p>
                <p className="text-base font-extrabold text-[#05251C] mt-2 tabular-nums">
                  {item.price?.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[#05251C]/10 rounded-3xl p-6 mb-8 bg-white text-center">
            <p className="text-xs text-[#6B716E]">Không có thông tin sản phẩm. Vui lòng quay lại danh sách đơn hàng.</p>
          </div>
        )}

        {/* Form Đánh giá */}
        {item && (
          <form onSubmit={handleSubmitReview} className="border border-[#05251C]/10 rounded-3xl p-6 sm:p-8 bg-white shadow-xs">
            {/* Đánh giá */}
            <div className="mb-6">
              <h3 className="text-lg font-bold font-display text-[#05251C] uppercase mb-4">Mức độ hài lòng của bạn</h3>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-[#6B716E] uppercase tracking-wider">Đánh giá sao:</span>
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

          <div className="flex gap-4 pt-4 border-t border-[#05251C]/10">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-[#05251C]/20 rounded-full text-xs font-bold uppercase tracking-wider text-[#05251C] hover:bg-neutral-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#05251C] hover:bg-[#F5DD20] hover:text-[#05251C] text-white font-display font-bold text-xs uppercase tracking-wider rounded-full transition shadow-md disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi đánh giá Atelier"}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};

export default Review;
