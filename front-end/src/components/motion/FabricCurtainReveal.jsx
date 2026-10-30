import React, { useRef } from "react";
import { motion, useInView } from "motion/react";
import { motionEase, motionDuration } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * FabricCurtainReveal
 * Inspired by luxury curtains parting open to reveal a campaign stage.
 * Uses dual-panel mask transform with smooth fabric ease.
 */
export const FabricCurtainReveal = ({
  children,
  className = "",
  curtainColor = "bg-[#18181B]",
  once = true,
  ...props
}) => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.25, once });
  const prefersReduced = usePrefersReducedMotion();

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
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Underlying Content */}
      <MotionDiv
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 1.05, opacity: 0.8 }}
        transition={{
          duration: motionDuration.curtain,
          ease: motionEase.editorialReveal,
        }}
        className="w-full h-full"
      >
        {children}
      </MotionDiv>

      {/* Left Fabric Curtain Panel */}
      <MotionDiv
        initial={{ x: "0%" }}
        animate={isInView ? { x: "-100%" } : { x: "0%" }}
        transition={{
          duration: motionDuration.curtain,
          ease: motionEase.fabricFlow,
        }}
        className={`absolute inset-y-0 left-0 w-1/2 z-20 pointer-events-none ${curtainColor} shadow-2xl`}
      />

      {/* Right Fabric Curtain Panel */}
      <MotionDiv
        initial={{ x: "0%" }}
        animate={isInView ? { x: "100%" } : { x: "0%" }}
        transition={{
          duration: motionDuration.curtain,
          ease: motionEase.fabricFlow,
        }}
        className={`absolute inset-y-0 right-0 w-1/2 z-20 pointer-events-none ${curtainColor} shadow-2xl`}
      />
    </div>
  );
};

export default FabricCurtainReveal;

