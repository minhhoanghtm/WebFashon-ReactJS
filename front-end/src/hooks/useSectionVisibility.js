import { useState, useEffect, useRef } from "react";

/**
 * useSectionVisibility
 * Uses IntersectionObserver to track entering, active, and exiting states of sections.
 * Clean cleanup guaranteed.
 */
export const useSectionVisibility = ({
  threshold = 0.15,
  rootMargin = "-40px 0px -40px 0px",
  once = false,
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(() => {
    return typeof IntersectionObserver === "undefined";
  });
  const [hasEntered, setHasEntered] = useState(() => {
    return typeof IntersectionObserver === "undefined";
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasEntered(true);
          if (once) {
            observer.unobserve(element);
          }
        } else {
          if (!once) {
            setIsVisible(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible, hasEntered };
};

export default useSectionVisibility;
