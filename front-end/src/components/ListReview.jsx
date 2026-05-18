import { FaStar } from "react-icons/fa";

const ListReview = ({
  author,
  avatar,
  rating,
  content = {},
  onPreview,
}) => {
  const images = content.images || [];
  const videos = content.videos || [];

  return (
    <div className="border-b py-4 px-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-end gap-2">
        <img
          src={avatar}
          alt={author}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="font-semibold">{author}</div>
      </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={
                i < rating ? "text-yellow-500" : "text-gray-300"
              }
            />
          ))}
        </div>
      </div>

      {/* text */}
      {content.text && (
        <div className="mt-2 text-gray-600">{content.text}</div>
      )}

      {/* thumbnails */}
      {(images.length > 0 || videos.length > 0) && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {images.map((url, imageIndex) => (
            <div
              key={`image-${imageIndex}`}
              className="cursor-pointer"
              onClick={() => {
                onPreview(images, imageIndex);
              }}
            >
              <img
                src={url}
                alt={`review-image-${imageIndex}`}
                className="w-20 h-20 object-cover rounded"
              />
            </div>
          ))}
          {videos.map((url, videoIndex) => (
            <video
              key={`video-${videoIndex}`}
              src={url}
              className="w-20 h-20 object-cover rounded"
              controls
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListReview;