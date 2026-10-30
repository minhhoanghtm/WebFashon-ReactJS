import { useState, useEffect, useRef } from "react";

/**
 * useScrollDirection
 * Tracks scroll direction ('down' | 'up' | null) with hysteresis to prevent flickering.
 * Also tracks scroll offset and whether page is scrolled past a threshold.
 */
export const useScrollDirection = ({ threshold = 10, initialDirection = null } = {}) => {
  const [scrollDirection, setScrollDirection] = useState(initialDirection);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.scrollY > 20;
  });
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollYRef.current;

      const nextIsScrolled = currentScrollY > 20;
      setIsScrolled((previous) => (previous === nextIsScrolled ? previous : nextIsScrolled));

      // Only toggle direction when movement exceeds hysteresis threshold
      if (Math.abs(diff) >= threshold) {
        const newDirection = diff > 0 ? "down" : "up";
        setScrollDirection((previous) => (previous === newDirection ? previous : newDirection));
        lastScrollYRef.current = currentScrollY > 0 ? currentScrollY : 0;
      }

      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        frameRef.current = window.requestAnimationFrame(updateScrollDirection);
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [threshold]);

  return { scrollDirection, isScrolled };
};

export default useScrollDirection;
