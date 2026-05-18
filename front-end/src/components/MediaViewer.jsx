import { useEffect, useState } from "react";

const MediaViewer = ({
  media = [],
  open = false,
  initialIndex = 0,
  onClose,
}) => {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrent(initialIndex);
  }, [open, initialIndex]);

  const prev = () =>
    setCurrent((i) => (i === 0 ? media.length - 1 : i - 1));

  const next = () =>
    setCurrent((i) => (i === media.length - 1 ? 0 : i + 1));

  // ⌨️ keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, media.length]);

  if (!open || !media.length) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={(e) => {
        const x = e.clientX;
        const w = window.innerWidth;
        if (x < w * 0.3) prev();
        else if (x > w * 0.7) next();
      }}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {media[current].type === "image" ? (
          <img
            src={media[current].url}
            className="max-w-[85vw] max-h-[85vh]"
          />
        ) : (
          <video
            src={media[current].url}
            controls
            autoPlay
            className="max-w-[85vw] max-h-[85vh]"
          />
        )}

        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default MediaViewer;