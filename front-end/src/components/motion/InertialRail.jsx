import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MagneticCTA from "./MagneticCTA";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

/**
 * InertialRail
 * Draggable inertial showcase with realistic momentum and smooth friction.
 * Supports mouse drag, mobile swipe, and tactile arrow controls.
 */
export const InertialRail = ({
  children,
  className = "",
  itemWidth = 280, // Approximate width of one child card
  gap = 20,
  ariaLabel = "Inertial Fashion Rail",
}) => {
  const containerRef = useRef(null);
  const railRef = useRef(null);
  const [constraints, setConstraints] = useState({ left: 0, right: 0 });
  const [maxScroll, setMaxScroll] = useState(0);
  const prefersReduced = usePrefersReducedMotion();

  const x = useMotionValue(0);
  const smoothX = useSpring(x, { damping: 30, stiffness: 200, mass: 0.8 });

  // Update drag constraints based on client container and content widths
  const updateConstraints = () => {
    if (!containerRef.current || !railRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const railWidth = railRef.current.scrollWidth;
    const maxLeft = Math.min(0, containerWidth - railWidth);
    setConstraints({ left: maxLeft, right: 0 });
    setMaxScroll(Math.abs(maxLeft));
  };

  useEffect(() => {
    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, [children]);

  // Handle arrow navigation
  const handleScroll = (direction) => {
    const shift = itemWidth + gap;
    const currentX = x.get();
    let targetX = direction === "left" ? currentX + shift : currentX - shift;
    targetX = Math.max(constraints.left, Math.min(0, targetX));
    x.set(targetX);
  };

  // Progress bar calculation (0 to 100%)
  const progress = useTransform(smoothX, [0, constraints.left || -1], [0, 100]);

  if (prefersReduced) {
    return (
      <div className={`overflow-x-auto pb-4 scrollbar-none flex gap-5 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full group/rail select-none">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          Kéo hoặc vuốt để xem bộ sưu tập
        </div>
        <div className="flex items-center gap-2">
          <MagneticCTA strength={0.25} radius={60}>
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-900 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Xem sản phẩm trước"
            >
              <ChevronLeft size={18} />
            </button>
          </MagneticCTA>
          <MagneticCTA strength={0.25} radius={60}>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:bg-neutral-900 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Xem sản phẩm kế tiếp"
            >
              <ChevronRight size={18} />
            </button>
          </MagneticCTA>
        </div>
      </div>

      {/* Rail Container */}
      <div ref={containerRef} className="overflow-hidden cursor-grab active:cursor-grabbing pb-2">
        <MotionDiv
          ref={railRef}
          drag="x"
          dragConstraints={constraints}
          dragElastic={0.08}
          dragTransition={{
            bounceStiffness: 350,
            bounceDamping: 25,
            power: 0.18,
            timeConstant: 240,
          }}
          style={{ x }}
          className={`flex gap-5 will-change-transform ${className}`}
          role="region"
          aria-label={ariaLabel}
        >
          {children}
        </MotionDiv>
      </div>

      {/* Editorial Progress Bar */}
      {maxScroll > 0 && (
        <div className="mt-4 w-full h-[2px] bg-neutral-100 rounded-full overflow-hidden">
          <MotionDiv
            style={{ width: `${progress}%` }}
            className="h-full bg-amber-700/80 rounded-full"
          />
        </div>
      )}
    </div>
  );
};

export default InertialRail;
