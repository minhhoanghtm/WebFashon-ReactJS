import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { motionEase } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * SoftImageFollow
 * Shifts image content subtly within a clipped frame based on pointer position.
 * Keeps grid perfectly intact (internal translation only).
 */
export const SoftImageFollow = ({
  children,
  className = "",
  maxOffset = 6, // Max pixel displacement
  scaleOnHover = 1.04,
  ...props
}) => {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReduced || !containerRef.current) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;

    setOffset({
      x: xRatio * maxOffset * 2,
      y: yRatio * maxOffset * 2,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  if (prefersReduced) {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${className}`} {...props}>
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
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <MotionDiv
        animate={{
          x: offset.x,
          y: offset.y,
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={motionEase.springSoft}
        className="w-full h-full will-change-transform"
      >
        {children}
      </MotionDiv>
    </div>
  );
};

export default SoftImageFollow;

