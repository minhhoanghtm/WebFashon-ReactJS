import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

gsap.registerPlugin(ScrollTrigger);

const getMotion = (style, compact) => {
  const distance = compact ? 24 : 48;
  const initial = {
    autoAlpha: 0,
    y: distance,
    scale: compact ? 0.99 : 0.975,
    // Clip-path is costly to repaint on low-power/mobile GPUs. Mobile keeps
    // the same reveal hierarchy with transform + opacity only.
    clipPath: compact ? "inset(0%)" : "inset(8% 0% 8% 0% round 18px)",
  };

  if (style === "fade-left") initial.x = -distance;
  if (style === "fade-right") initial.x = distance;
  if (style === "scale") {
    initial.y = compact ? 12 : 24;
    initial.scale = compact ? 0.97 : 0.94;
  }
  if (style === "editorial") {
    initial.y = compact ? 32 : 68;
    initial.scale = compact ? 0.985 : 0.965;
    initial.clipPath = compact ? "inset(0%)" : "inset(12% 0% 12% 0% round 22px)";
  }

  return {
    initial,
    visible: { autoAlpha: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0% 0% 0% 0% round 0px)" },
    exit: { autoAlpha: 0.82, x: 0, y: compact ? -14 : -28, scale: compact ? 0.995 : 0.985 },
  };
};

/**
 * Adds a reversible, scroll-scrubbed timeline to every content section.
 * Sections can opt out with data-scroll-transition="none"; use
 * data-scroll-pin="true" or data-scroll-stack="true" only for purposeful
 * editorial compositions, never for normal document content.
 */
const ScrollSectionTransitions = ({ containerRef, routeKey }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return undefined;

    const compact = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    let refreshFrame;

    const context = gsap.context(() => {
      const sections = gsap.utils
        .toArray("section", container)
        .filter((section) => section.dataset.scrollTransition !== "none");

      sections.forEach((section, index) => {
        const style = section.dataset.scrollStyle || "fade-up";
        const motion = getMotion(style, compact);
        const stacked = section.dataset.scrollStack === "true" || style === "editorial";
        const pinned = section.dataset.scrollPin === "true" && !compact;

        gsap.set(section, {
          ...motion.initial,
          willChange: compact ? "transform, opacity" : "transform, opacity, clip-path",
          ...(stacked ? { position: "relative", zIndex: sections.length - index } : {}),
        });

        const timeline = gsap.timeline({
          defaults: { ease: "none", force3D: true },
          scrollTrigger: {
            trigger: section,
            start: "top 92%",
            end: "bottom 8%",
            scrub: compact ? 0.35 : 0.7,
            pin: pinned,
            pinSpacing: pinned,
            anticipatePin: pinned ? 1 : 0,
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        });

        // 0–28%: entrance, 28–72%: settled in view, 72–100%: exit.
        // With scrub, reverse scrolling retraces the same timeline naturally.
        timeline
          .to(section, motion.visible, 0.28)
          .to(section, motion.exit, 0.72);
      });
    }, container);

    const refresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    // Layout size changes matter to ScrollTrigger; arbitrary DOM mutations do
    // not. ResizeObserver prevents a refresh storm from product data, image
    // loading and live UI updates inside a section.
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    window.addEventListener("resize", refresh, { passive: true });
    ScrollTrigger.refresh();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      cancelAnimationFrame(refreshFrame);
      context.revert();
    };
  }, [containerRef, prefersReducedMotion, routeKey]);

  return null;
};

export default ScrollSectionTransitions;
