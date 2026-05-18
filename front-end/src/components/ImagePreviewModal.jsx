import { Modal } from "antd";
import { useEffect, useState } from "react";

const ImagePreviewModal = ({ images = [], open, startIndex = 0, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const safeImages = images || [];

  useEffect(() => {
  if (open) {
    setCurrent(startIndex);
  }
}, [open, startIndex, images]);

  // next / prev
  const next = () => {
  setCurrent((prev) => {
    const safe = safeImages.length;
    return safe ? (prev + 1) % safe : 0;
  });
};

const prev = () => {
  setCurrent((prev) => {
    const safe = safeImages.length;
    return safe ? (prev - 1 + safe) % safe : 0;
  });
};

  //keyboard control
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, safeImages, next, prev, onClose]);

  // click phân vùng trái / phải
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 2) prev();
    else next();
  };

  return (
    <Modal
  open={open}
  footer={null}
  onCancel={onClose}
  centered
  width="100%"
  styles={{
    body: { padding: 0, background: "#000" },
    content: { background: "#000" },
  }}
>
      <div
        className="flex items-center justify-center h-[90vh] cursor-pointer select-none"
        onClick={handleClick}
      >
        <img
          src={safeImages[current] || ""}
          alt="preview"
          className="max-h-[90vh] max-w-full object-contain"
        />
      </div>

      {/* index nhỏ góc dưới */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {current + 1} / {safeImages.length}
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
