import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { motionEase, motionDuration } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * DirectionalCard
 * Detects whether the cursor enters from top, bottom, left, or right,
 * and slides the overlay or accent in from that exact side.
 */
export const DirectionalCard = ({
  children,
  overlay,
  className = "",
  onClick,
  ...props
}) => {
  const cardRef = useRef(null);
  const [direction, setDirection] = useState("bottom");
  const [isHovered, setIsHovered] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  const getEntryDirection = (e) => {
    if (!cardRef.current) return "bottom";
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    // Calculate angle in degrees
    const angle = (Math.atan2(y, x) * (180 / Math.PI) + 180) % 360;

    // Map 360-degree space into 4 quadrants
    if (angle >= 45 && angle < 135) return "bottom";
    if (angle >= 135 && angle < 225) return "right";
    if (angle >= 225 && angle < 315) return "top";
    return "left";
  };

  const handleMouseEnter = (e) => {
    const entryDir = getEntryDirection(e);
    setDirection(entryDir);
    setIsHovered(true);
  };

  const handleMouseLeave = (e) => {
    const exitDir = getEntryDirection(e);
    setDirection(exitDir);
    setIsHovered(false);
  };

  const getInitialPosition = (dir) => {
    switch (dir) {
      case "top":
        return { y: "-100%", x: "0%" };
      case "bottom":
        return { y: "100%", x: "0%" };
      case "left":
        return { x: "-100%", y: "0%" };
      case "right":
        return { x: "100%", y: "0%" };
      default:
        return { y: "100%", x: "0%" };
    }
  };

  if (prefersReduced) {
    return (
      <div
        ref={cardRef}
        onClick={onClick}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        {children}
        {overlay && <div className="absolute inset-0 pointer-events-none">{overlay}</div>}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative overflow-hidden group cursor-pointer ${className}`}
      {...props}
    >
      {children}

      <AnimatePresence>
        {isHovered && overlay && (
          <MotionDiv
            initial={getInitialPosition(direction)}
            animate={{ x: "0%", y: "0%" }}
            exit={getInitialPosition(direction)}
            transition={{
              duration: motionDuration.base,
              ease: motionEase.cinematic,
            }}
            className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-end"
          >
            {overlay}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DirectionalCard;

