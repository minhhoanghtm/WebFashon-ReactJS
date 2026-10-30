/**
 * FASHION MOTION UNIVERSE — Motion Tokens & Physics
 * Designed for luxury editorial tempo, tactile responsiveness, and fluid continuity.
 */

export const motionEase = {
  // Editorial luxury ease: slow start, rapid acceleration, very gentle landing
  cinematic: [0.22, 1, 0.36, 1],
  editorialReveal: [0.19, 1, 0.22, 1],
  fabricFlow: [0.25, 0.46, 0.45, 0.94],
  gentle: [0.25, 0.1, 0.25, 1],
  expressive: [0.16, 1, 0.3, 1],
  outCubic: [0.33, 1, 0.68, 1],
  inOutCubic: [0.65, 0, 0.35, 1],

  // Tactile Springs
  springMagnetic: { type: "spring", damping: 16, stiffness: 220, mass: 0.6 },
  springTactile: { type: "spring", damping: 22, stiffness: 260 },
  springSoft: { type: "spring", damping: 28, stiffness: 180, mass: 0.8 },
  springBouncy: { type: "spring", damping: 14, stiffness: 280, mass: 0.5 },
};

export const motionDuration = {
  instant: 0.12,
  micro: 0.15,
  hover: 0.22,
  fast: 0.26,
  base: 0.38,
  medium: 0.58,
  slow: 0.75,
  cinematic: 0.85,
  curtain: 0.95,
  ambient: 12.0,
  pageExit: 0.2,
  pageEnter: 0.32,
};

export const motionTokens = {
  ease: motionEase,
  duration: motionDuration,
};

// Reusable Framer Motion / Motion variants
export const sectionVariants = {
  "fade-up": {
    hidden: { opacity: 0, y: 36 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: motionDuration.medium,
        ease: motionEase.cinematic,
      },
    },
    exit: {
      opacity: 0.88,
      y: -24,
      transition: {
        duration: motionDuration.fast,
        ease: motionEase.gentle,
      },
    },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: motionDuration.medium,
        ease: motionEase.cinematic,
      },
    },
    exit: {
      opacity: 0.88,
      x: -16,
      transition: {
        duration: motionDuration.fast,
        ease: motionEase.gentle,
      },
    },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 36 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: motionDuration.medium,
        ease: motionEase.cinematic,
      },
    },
    exit: {
      opacity: 0.88,
      x: 16,
      transition: {
        duration: motionDuration.fast,
        ease: motionEase.gentle,
      },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: motionDuration.medium,
        ease: motionEase.cinematic,
      },
    },
    exit: {
      opacity: 0.88,
      scale: 0.98,
      transition: {
        duration: motionDuration.fast,
        ease: motionEase.gentle,
      },
    },
  },
  editorial: {
    hidden: { opacity: 0, y: 44, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: motionDuration.slow,
        ease: motionEase.editorialReveal,
      },
    },
    exit: {
      opacity: 0.85,
      y: -28,
      filter: "blur(2px)",
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

// Stagger container and item variants
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerDelay || 0.07,
      delayChildren: custom.delayChildren || 0.05,
    },
  }),
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.base,
      ease: motionEase.cinematic,
    },
  },
};

// Page transition variants - Fashion Frame Wipe
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 14,
    scale: 0.995,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: motionDuration.pageEnter,
      ease: motionEase.cinematic,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.992,
    transition: {
      duration: motionDuration.pageExit,
      ease: motionEase.inOutCubic,
    },
  },
};

// Fallback for prefers-reduced-motion
export const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};
