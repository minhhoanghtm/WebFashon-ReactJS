import { useRef } from "react";

const useCartAnimation = () => {
  const cartRef = useRef(null);

  const flyToCart = (source, onComplete) => {
    const cart = cartRef.current;
    if (!cart || !source) return;

    const isElement = source instanceof HTMLElement;
    const imgRect = isElement
      ? source.getBoundingClientRect()
      : source.sourceRect || cart.getBoundingClientRect();
    const clone = isElement ? source.cloneNode(true) : document.createElement("img");

    if (!isElement) {
      clone.src = source.src || "";
      clone.alt = "";
    }

    const cartRect = cart.getBoundingClientRect();

    Object.assign(clone.style, {
      position: "fixed",
      left: imgRect.left + "px",
      top: imgRect.top + "px",
      width: imgRect.width + "px",
      height: imgRect.height + "px",
      zIndex: 9999,
      borderRadius: "8px",
      transition: "all 0.85s cubic-bezier(0.25, 0.8, 0.25, 1)",
      pointerEvents: "none",
      objectFit: "cover",
    });

    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      Object.assign(clone.style, {
        left: cartRect.left + "px",
        top: cartRect.top + "px",
        width: "24px",
        height: "24px",
        opacity: 0.4,
        transform: "scale(0.3)",
      });
    });

    setTimeout(() => {
      clone.remove();

      // ✔ hiệu ứng rung + bounce nhẹ
      cart.classList.add("shake");
      setTimeout(() => cart.classList.remove("shake"), 400);

      onComplete?.();
    }, 850);
  };

  return { cartRef, flyToCart };
};

export default useCartAnimation;