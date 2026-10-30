import React from "react";
import { motion } from "motion/react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;
const curtainEase = [0.76, 0, 0.24, 1];
const curtainDuration = 0.82;
const leftCurtainVariants = {
  closed: { x: "0%", transition: { duration: 0.65, ease: curtainEase } },
  open: { x: "-100%", transition: { duration: curtainDuration, ease: curtainEase } },
};
const rightCurtainVariants = {
  closed: { x: "0%", transition: { duration: 0.65, ease: curtainEase } },
  open: { x: "100%", transition: { duration: curtainDuration, ease: curtainEase } },
};

/**
 * Route-level split curtain. AnimatePresence in MainLayout runs in `wait`
 * mode, so the outgoing page closes both panels before the next route opens
 * them from the centre. This prevents white flashes between pages.
 */
export const PageTransition = ({ children, className = "", type = "default" }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <div className={`w-full flex-1 flex flex-col ${className}`}>{children}</div>;
  }

  return (
    <MotionDiv
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      // Keep the previous route mounted until both closing panels meet.
      exit={{ opacity: 0, transition: { duration: 0.01, delay: curtainDuration } }}
      className={`relative w-full flex-1 flex flex-col ${className}`}
      data-page-transition={type}
    >
      <div
        aria-hidden="true"
        // Decorative only: the overlay must never intercept navigation or UI
        // actions, including when a Motion completion callback is delayed.
        className="pointer-events-none fixed inset-0 z-100 flex overflow-hidden"
      >
        <MotionDiv
          variants={leftCurtainVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="h-full w-1/2 shrink-0 bg-[#05251C] will-change-transform"
        />
        <MotionDiv
          variants={rightCurtainVariants}
          initial="closed"
          animate="open"
          exit="closed"
          className="h-full w-1/2 shrink-0 bg-[#05251C] will-change-transform"
        />
      </div>

      <MotionDiv
        initial={{ opacity: 0.01, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4, transition: { duration: 0.12, delay: curtainDuration * 0.78 } }}
        transition={{ duration: 0.28, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex-1 flex flex-col"
      >
        {children}
      </MotionDiv>
    </MotionDiv>
  );
};

export default PageTransition;
