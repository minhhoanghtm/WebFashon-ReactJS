import React from "react";
import { motion } from "motion/react";
import { motionEase } from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionSpan = motion.span;
const MotionH2 = motion.h2;
const MotionP = motion.p;

const SectionHeader = ({ id, eyebrow, title, subtitle }) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return (
      <div className="home-section-header" data-cursor="hidden">
        {eyebrow && <span>{eyebrow}</span>}
        <h2 id={id}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="home-section-header" data-cursor="hidden">
      {eyebrow && (
        <MotionSpan
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: motionEase.cinematic }}
        >
          {eyebrow}
        </MotionSpan>
      )}
      <MotionH2
        id={id}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.55, delay: 0.08, ease: motionEase.cinematic }}
      >
        {title}
      </MotionH2>
      {subtitle && (
        <MotionP
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.16, ease: motionEase.cinematic }}
        >
          {subtitle}
        </MotionP>
      )}
    </div>
  );
};

export default SectionHeader;
