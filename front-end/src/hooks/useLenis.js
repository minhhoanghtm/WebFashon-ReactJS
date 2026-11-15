import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Global helper to scroll smoothly using Lenis if active, falling back to native scroll.
 */
export const scrollToLenis = (target, options = {}) => {
  if (typeof window === "undefined") return;
  const lenis = window.__lenis;
  let el = null;
  if (typeof target === "string") {
    el = document.querySelector(target);
  } else if (target && target.nodeType) {
    el = target;
  } else if (target && target.current) {
    el = target.current;
  }

  if (lenis && el) {
    lenis.scrollTo(el, {
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      ...options,
    });
  } else if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (typeof target === "number" && lenis) {
    lenis.scrollTo(target, options);
  }
};

export const useLenis = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined") {
      return undefined;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    // Soft snap mechanism (Desktop mouse/pointer fine only, debounced on scroll stop)
    let snapTimeout = null;
    let isSnapping = false;

    const handleScroll = (e) => {
      ScrollTrigger.update();

      // Only evaluate soft snap on desktop with fine pointer
      if (!window.matchMedia("(pointer: fine)").matches) return;
      if (isSnapping) return;

      if (snapTimeout) clearTimeout(snapTimeout);

      // When scroll velocity slows down (< 0.08)
      if (Math.abs(e.velocity) < 0.08) {
        snapTimeout = setTimeout(() => {
          if (Math.abs(lenis.velocity) > 0.05) return;

          const sections = document.querySelectorAll("[data-scroll-section]");
          const vh = window.innerHeight;
          const threshold = vh * 0.18; // within 18% of section edge

          for (const sec of sections) {
            const rect = sec.getBoundingClientRect();
            // If section top is near the top of the viewport (within 18% vh, but not already at 0)
            if (Math.abs(rect.top) > 8 && Math.abs(rect.top) < threshold) {
              isSnapping = true;
              lenis.scrollTo(sec, {
                duration: 0.7,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                onComplete: () => {
                  isSnapping = false;
                },
              });
              break;
            }
          }
        }, 160);
      }
    };

    // User input immediately interrupts any active snap
    const cancelSnap = () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      isSnapping = false;
    };

    window.addEventListener("wheel", cancelSnap, { passive: true });
    window.addEventListener("touchstart", cancelSnap, { passive: true });
    window.addEventListener("keydown", cancelSnap, { passive: true });

    lenis.on("scroll", handleScroll);

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Initial scroll reset & refresh
    lenis.scrollTo(0, { immediate: true });
    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (snapTimeout) clearTimeout(snapTimeout);
      window.removeEventListener("wheel", cancelSnap);
      window.removeEventListener("touchstart", cancelSnap);
      window.removeEventListener("keydown", cancelSnap);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      if (window.__lenis === lenis) {
        window.__lenis = null;
      }
      ScrollTrigger.refresh();
    };
  }, [prefersReducedMotion]);

  return lenisRef;
};

export default useLenis;
