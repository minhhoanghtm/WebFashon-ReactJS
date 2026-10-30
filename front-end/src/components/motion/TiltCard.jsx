import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * TiltCard
 * Controlled 3D Perspective Tilt (2-3 degrees) for Lookbook and Editorial Cards.
 * Features smooth spring physics, subtle depth, and instant fallback for touch / reduced motion.
 */
export const TiltCard = ({
  children,
  className = "",
  maxTilt = 3.5, // Maximum degrees of rotation
  perspective = 1000,
  ...props
}) => {
  const cardRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  // Motion values for smooth 60fps spring rotation without React state re-renders
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(y, { damping: 25, stiffness: 220, mass: 0.6 });
  const rotateY = useSpring(x, { damping: 25, stiffness: 220, mass: 0.6 });

  const handleMouseMove = (e) => {
    if (prefersReduced || !cardRef.current) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize coordinates (-0.5 to +0.5)
    const normX = (mouseX / width) - 0.5;
    const normY = (mouseY / height) - 0.5;

    // Invert Y for standard natural 3D tilt
    x.set(normX * maxTilt * 2);
    y.set(-normY * maxTilt * 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (prefersReduced) {
    return (
      <div ref={cardRef} className={`relative ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: `${perspective}px` }}
      className={`relative will-change-transform ${className}`}
      {...props}
    >
      <MotionDiv
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </MotionDiv>
    </div>
  );
};

export default TiltCard;
