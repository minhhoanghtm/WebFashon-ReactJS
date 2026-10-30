import React from "react";
import { motion } from "motion/react";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "../../config/motionTokens";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";

const MotionDiv = motion.div;

export const StaggerContainer = ({
  children,
  className = "",
  staggerDelay = 0.07,
  delayChildren = 0.05,
  once = true,
  amount = 0.1,
  ...props
}) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <MotionDiv
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={staggerContainerVariants}
      custom={{ staggerDelay, delayChildren }}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export const StaggerItem = ({
  children,
  className = "",
  variants = staggerItemVariants,
  ...props
}) => {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <MotionDiv
      className={className}
      variants={variants}
      {...props}
    >
      {children}
    </MotionDiv>
  );
};

export default StaggerContainer;
