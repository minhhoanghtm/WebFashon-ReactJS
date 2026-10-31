import React, { useState } from "react";
import StarRatingInput from "@/components/StarRatingInput";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { createReviewService } from "@/services/review.service";
import { uploadImageService } from "@/services/upload.service";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ArrowLeft, X, ImagePlus, Video } from "lucide-react";
import { toast } from "react-toastify";
import { formatCurrency } from "@/utils/format";

const Review = () => {
  useDocumentTitle("Đánh giá sản phẩm");

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const productId = searchParams.get("product_id");
  const stateItem = location.state?.item;

  const [item] = useState(stateItem || null);
  const [imgFailed, setImgFailed] = useState(false);
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
      setError("Tải ảnh lên thất bại.");
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
      setError("Tải video lên thất bại.");
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
      setError("Vui lòng chọn số sao đánh giá.");
      return;
    }

    if (!comment.trim()) {
      setError("Vui lòng nhập nội dung nhận xét.");
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
          images,
          videos,
        },
      };

      const res = await createReviewService(reviewData);
      if (res?.success) {
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

  const itemImg = item?.variant?.image_url || item?.product_image || "";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 min-h-[44px] text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Quay lại đơn hàng
        </button>

        <header className="mb-8">
          <span className="atelier-eyebrow block mb-2">Phản hồi khách hàng</span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Đánh giá sản phẩm
          </h1>
        </header>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 border border-[var(--color-danger)] text-[var(--color-danger)] bg-[var(--color-surface)] text-xs font-medium"
            >
              {error}
            </div>
          )}
        </div>

        {/* Sản phẩm */}
        {item ? (
          <div className="border border-[var(--color-border)] p-6 mb-8 bg-[var(--color-surface)]">
            <div className="flex items-start gap-5">
              <div className="w-20 h-24 border border-[var(--color-border)] bg-[var(--color-bg)] shrink-0 overflow-hidden flex items-center justify-center">
                {itemImg && !imgFailed ? (
                  <img
                    src={itemImg}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <span className="font-display text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                    WF
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-semibold mb-1">
                  {item.product_name}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">
                  Số lượng: {item.quantity}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  <span className="mr-4">
                    Màu: {item.variant?.color || "Tiêu chuẩn"}
                  </span>
                  <span>Size: {item.variant?.size || "Tiêu chuẩn"}</span>
                </p>
                <p className="text-sm font-mono font-semibold mt-2">
                  {formatCurrency(item.price || 0)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[var(--color-border)] p-6 mb-8 bg-[var(--color-surface)] text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Không có thông tin sản phẩm. Vui lòng quay lại danh sách đơn hàng.
            </p>
          </div>
        )}

        {/* Form Đánh giá */}
        {(item || productId) && (
          <form
            onSubmit={handleSubmitReview}
            className="border border-[var(--color-border)] p-6 sm:p-8 bg-[var(--color-surface)] space-y-6"
          >
            <div>
              <h3 className="text-xs uppercase tracking-[0.14em] font-semibold mb-4">
                Mức độ hài lòng của bạn
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Chọn mức sao:
                </span>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-xs uppercase tracking-[0.14em] font-semibold mb-2"
              >
                Nhận xét chi tiết
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm thực tế của bạn về phom dáng, chất liệu và độ hoàn thiện..."
                className="w-full p-3.5 text-sm border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)]"
                rows={5}
              />
            </div>

            {/* Upload hình ảnh */}
            <div>
              <span className="block text-xs uppercase tracking-[0.14em] font-semibold mb-2">
                Hình ảnh thực tế (Tối đa 5)
              </span>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="file"
                  id="review-image-input"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading || images.length >= 5}
                  className="hidden"
                />
                <label
                  htmlFor="review-image-input"
                  className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                    isUploading || images.length >= 5
                      ? "border-[var(--color-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                      : "border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] cursor-pointer"
                  }`}
                >
                  <ImagePlus className="w-4 h-4" aria-hidden="true" />
                  <span>{isUploading ? "Đang tải lên..." : "Thêm hình ảnh"}</span>
                </label>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">
                  {images.length}/5
                </span>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative border border-[var(--color-border)] aspect-square overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Ảnh đánh giá ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label={`Xóa ảnh ${i + 1}`}
                        className="absolute top-1 right-1 min-w-[32px] min-h-[32px] bg-black/80 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload video */}
            <div>
              <span className="block text-xs uppercase tracking-[0.14em] font-semibold mb-2">
                Video ngắn (Tối đa 2)
              </span>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="file"
                  id="review-video-input"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={isUploading || videos.length >= 2}
                  className="hidden"
                />
                <label
                  htmlFor="review-video-input"
                  className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                    isUploading || videos.length >= 2
                      ? "border-[var(--color-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                      : "border-[var(--color-text)] text-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] cursor-pointer"
                  }`}
                >
                  <Video className="w-4 h-4" aria-hidden="true" />
                  <span>{isUploading ? "Đang tải lên..." : "Thêm video"}</span>
                </label>
                <span className="text-xs font-mono text-[var(--color-text-muted)]">
                  {videos.length}/2
                </span>
              </div>
              {videos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {videos.map((vid, i) => (
                    <div
                      key={i}
                      className="relative border border-[var(--color-border)] h-28 overflow-hidden bg-black"
                    >
                      <video
                        src={vid}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        aria-label={`Xóa video ${i + 1}`}
                        className="absolute top-1 right-1 min-w-[32px] min-h-[32px] bg-black/80 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="min-h-[48px] px-6 py-3 border border-[var(--color-border)] text-xs uppercase tracking-[0.16em] font-medium hover:border-[var(--color-text)] transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] px-8 py-3 bg-[var(--color-text)] text-[var(--color-bg)] text-xs uppercase tracking-[0.16em] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Review;
