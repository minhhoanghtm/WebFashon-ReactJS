import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionImg = motion.img;

/**
 * ParallaxImage
 * Subtle scroll-linked parallax for images and cards.
 * Maintains overflow clipping and zero jitter.
 */
export const ParallaxImage = ({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  speed = 0.15, // Multiplier for parallax strength
  children,
  ...props
}) => {
  const containerRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Calculate subtle shift based on speed
  const range = 40 * speed;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  if (prefersReduced) {
    return (
      <div ref={containerRef} className={`relative overflow-hidden ${containerClassName}`}>
        <img src={src} alt={alt} className={`w-full h-full object-cover ${className}`} {...props} />
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${containerClassName}`}>
      <MotionImg
        src={src}
        alt={alt}
        className={`w-full h-full object-cover scale-110 will-change-transform ${className}`}
        style={{ y }}
        {...props}
      />
      {children}
    </div>
  );
};

export default ParallaxImage;
