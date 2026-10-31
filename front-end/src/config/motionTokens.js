/**
 * WEBFASHION MONOCHROME ATELIER — Motion Tokens & Physics
 * Strictly adheres to transform & opacity animations, GSAP ease standards,
 * and respects prefers-reduced-motion.
 */

export const motionEase = {
  // CSS / Motion cubic-bezier curves
  cinematic: [0.22, 1, 0.36, 1],
  editorialReveal: [0.19, 1, 0.22, 1],
  fabricFlow: [0.25, 0.46, 0.45, 0.94],
  gentle: [0.25, 0.1, 0.25, 1],
  expressive: [0.16, 1, 0.3, 1],
  outCubic: [0.33, 1, 0.68, 1],
  inOutCubic: [0.65, 0, 0.35, 1],

  // GSAP string eases
  gsapLuxury: "power3.out",
  gsapCinematic: "power4.inOut",
  gsapTactile: "expo.out",
  gsapLinear: "none",

  // Tactile Springs
  springMagnetic: { type: "spring", damping: 16, stiffness: 220, mass: 0.6 },
  springTactile: { type: "spring", damping: 22, stiffness: 260 },
  springSoft: { type: "spring", damping: 28, stiffness: 180, mass: 0.8 },
};

export const motionDuration = {
  instant: 0.12,
  micro: 0.16,
  hover: 0.22,
  fast: 0.28,
  base: 0.42,
  medium: 0.6,
  slow: 0.78,
  cinematic: 0.9,
  pageExit: 0.2,
  pageEnter: 0.35,
};

export const motionTokens = {
  ease: motionEase,
  duration: motionDuration,
  perspective: {
    card: "900px",
    hero: "1200px",
    maxTiltDeg: 6,
  },
};

export const sectionVariants = {
  "fade-up": {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionDuration.medium,
        ease: motionEase.cinematic,
      },
    },
    exit: {
      opacity: 0,
      y: -16,
      transition: {
        duration: motionDuration.fast,
        ease: motionEase.gentle,
      },
    },
  },
  none: {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 1, y: 0 },
  },
};

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.pageEnter,
      ease: motionEase.cinematic,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: motionDuration.pageExit,
      ease: motionEase.inOutCubic,
    },
  },
};

export const reducedMotionVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.01 } },
  exit: { opacity: 1, y: 0, transition: { duration: 0.01 } },
};

export default motionTokens;
