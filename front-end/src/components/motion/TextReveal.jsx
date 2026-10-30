import React from "react";
import { motion } from "motion/react";
import { motionEase, motionDuration } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionSpan = motion.span;

/**
 * TextReveal
 * Fashion Editorial Typography Reveal
 * Masks and reveals text smoothly upwards.
 */
export const TextReveal = ({
  children,
  className = "",
  delay = 0,
  duration = motionDuration.medium,
  once = true,
}) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-block overflow-hidden align-top ${className}`}>
      <MotionSpan
        className="inline-block"
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once, amount: 0.5 }}
        transition={{
          duration,
          ease: motionEase.cinematic,
          delay,
        }}
      >
        {children}
      </MotionSpan>
    </span>
  );
};

export default TextReveal;
