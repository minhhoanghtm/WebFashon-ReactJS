import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { motionEase } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * MagneticCTA
 * Tactile spring responsiveness: pulls slightly towards the cursor when hovered.
 * Automatically disabled on touch screens and when prefers-reduced-motion is active.
 */
export const MagneticCTA = ({
  children,
  className = "",
  strength = 0.28, // Max offset multiplier
  radius = 120, // Interaction radius in pixels
  ...props
}) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const prefersReduced = usePrefersReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReduced || !ref.current) return;
    // Don't apply on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance < radius) {
      setPosition({
        x: distanceX * strength,
        y: distanceY * strength,
      });
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (prefersReduced) {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <MotionDiv
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={motionEase.springMagnetic}
      className={`inline-block will-change-transform ${className}`}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export default MagneticCTA;
