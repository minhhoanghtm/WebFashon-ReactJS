import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionEase } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * CursorEditorialLabel
 * A localized floating editorial pill that gracefully trails the pointer
 * only when hovering over an interactive fashion story / lookbook frame.
 * Does not replace the system cursor globally, preserving full usability.
 */
export const CursorEditorialLabel = ({
  children,
  label = "VIEW THE LOOK",
  className = "",
  ...props
}) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReduced || !containerRef.current) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    if (window.matchMedia("(hover: hover)").matches) {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (prefersReduced) {
    return (
      <div className={`relative ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
      {...props}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: mousePos.x - 50,
              y: mousePos.y - 18,
            }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={motionEase.springSoft}
            className="pointer-events-none absolute top-0 left-0 z-30 px-3.5 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md text-white text-[10px] font-bold tracking-[0.2em] uppercase border border-white/20 shadow-xl flex items-center justify-center whitespace-nowrap"
          >
            {label}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CursorEditorialLabel;

