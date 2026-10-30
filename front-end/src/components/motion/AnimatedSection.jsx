import React from "react";

/**
 * AnimatedSection
 * Semantic section wrapper. Scroll motion is coordinated centrally by
 * ScrollSectionTransitions so neighbouring sections share one reversible GSAP
 * timeline rather than competing independent animations.
 */
export const AnimatedSection = ({
  children,
  className = "",
  variant = "fade-up",
  mode = "viewport", // "viewport" | "scroll" | "none"
  stack = false,
  pin = false,
  id,
  "aria-labelledby": ariaLabelledBy,
  style = {},
  ...props
}) => {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      data-scroll-transition={mode === "none" ? "none" : "true"}
      data-scroll-style={variant}
      data-scroll-stack={stack ? "true" : undefined}
      data-scroll-pin={pin ? "true" : undefined}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </section>
  );
};

export default AnimatedSection;
