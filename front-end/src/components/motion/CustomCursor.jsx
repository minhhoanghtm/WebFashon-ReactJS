import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "motion/react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

export const CustomCursor = () => {
  const prefersReduced = usePrefersReducedMotion();
  const [cursorState, setCursorState] = useState({
    type: "default", // default | drag | view | interact | hidden
    label: "",
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const cursorStateRef = useRef(cursorState);
  const visibleRef = useRef(isVisible);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for fluid trailing
  const springX = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.5 });
  const springY = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.5 });

  useEffect(() => {
    // Only enable custom cursor on devices with fine pointer (mouse/trackpad)
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsPointerDevice(mediaQuery.matches);

    const handleMediaChange = (e) => setIsPointerDevice(e.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setIsVisible(true);
      }

      // Check current hover target for custom cursor triggers
      const target = e.target.closest("[data-cursor]");
      if (target) {
        const cursorType = target.getAttribute("data-cursor");
        const cursorLabel = target.getAttribute("data-cursor-label") || cursorType.toUpperCase();
        if (cursorStateRef.current.type !== cursorType || cursorStateRef.current.label !== cursorLabel) {
          const nextState = { type: cursorType, label: cursorLabel };
          cursorStateRef.current = nextState;
          setCursorState(nextState);
        }
      } else {
        // If over input, textarea, native select, or headings, hide custom cursor to keep precision and prevent text overlap
        const isExcluded = e.target.closest(
          "input, textarea, select, [contenteditable='true'], h1, h2, h3, h4, h5, h6, [data-cursor='hidden']"
        );
        if (isExcluded) {
          if (cursorStateRef.current.type !== "hidden") {
            const nextState = { type: "hidden", label: "" };
            cursorStateRef.current = nextState;
            setCursorState(nextState);
          }
        } else {
          if (cursorStateRef.current.type !== "default") {
            const nextState = { type: "default", label: "" };
            cursorStateRef.current = nextState;
            setCursorState(nextState);
          }
        }
      }
    };

    const handleMouseLeave = () => {
      visibleRef.current = false;
      setIsVisible(false);
    };
    const handleMouseEnter = () => {
      visibleRef.current = true;
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY]);

  if (prefersReduced || !isPointerDevice || !isVisible || cursorState.type === "hidden") {
    return null;
  }

  const isCapsule = cursorState.type === "drag" || cursorState.type === "view" || cursorState.type === "interact";

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-9999 will-change-transform"
      style={{
        x: springX,
        y: springY,
      }}
    >
      {isCapsule ? (
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 350 }}
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5DD20] px-4 py-2 font-display text-[10px] font-black tracking-widest text-[#05251C] shadow-[0_8px_30px_rgba(245,221,32,0.45)] uppercase border border-[#05251C]/10"
        >
          {cursorState.label || cursorState.type.toUpperCase()}
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="relative -translate-x-1/2 -translate-y-1/2"
        >
          {/* Subtle outer breathing ring */}
          <div className="h-7 w-7 rounded-full border border-[#05251C]/30 transition-transform duration-200" />
          {/* Central crisp focus dot */}
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#05251C]" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default CustomCursor;
