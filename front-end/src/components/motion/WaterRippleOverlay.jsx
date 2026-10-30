import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "@/hooks/usePrefersReducedMotion";

const MAX_RIPPLES = 22;
const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "[role='button']",
  "[contenteditable='true']",
  "[data-water-ripple-ignore]",
].join(",");

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * A decorative canvas layer that suggests water refraction without intercepting
 * pointer input. Ripples are emitted only over non-interactive page areas.
 */
const WaterRippleOverlay = () => {
  const canvasRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return undefined;

    let frameId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previousTime = performance.now();
    let lastRippleTime = 0;
    let lastPoint = null;
    const ripples = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // A cap keeps the full-screen canvas affordable on high-density displays.
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const isInteractiveTarget = (target) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const addRipple = (event) => {
      if (isInteractiveTarget(event.target)) {
        lastPoint = null;
        return;
      }

      const now = performance.now();
      const point = { x: event.clientX, y: event.clientY, time: now };
      const distance = lastPoint
        ? Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
        : Number.POSITIVE_INFINITY;

      // Sampling the trail avoids allocating one ripple for every mouse event.
      if (distance < 13 && now - lastRippleTime < 26) return;

      const elapsed = lastPoint ? Math.max(now - lastPoint.time, 1) : 16;
      const speed = lastPoint ? distance / elapsed : 0;
      const velocity = lastPoint
        ? {
            x: clamp((point.x - lastPoint.x) / elapsed, -1.6, 1.6),
            y: clamp((point.y - lastPoint.y) / elapsed, -1.6, 1.6),
          }
        : { x: 0, y: 0 };

      ripples.push({
        x: point.x,
        y: point.y,
        vx: velocity.x,
        vy: velocity.y,
        age: 0,
        life: 680 + Math.min(speed * 110, 230),
        strength: 0.36 + Math.min(speed * 0.34, 0.3),
      });
      if (ripples.length > MAX_RIPPLES) ripples.shift();

      lastPoint = point;
      lastRippleTime = now;
      scheduleFrame();
    };

    const clearTrail = () => {
      lastPoint = null;
    };

    const scheduleFrame = () => {
      if (frameId === null && ripples.length > 0 && !document.hidden) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const drawRipple = (ripple) => {
      const progress = ripple.age / ripple.life;
      const fade = Math.pow(1 - progress, 1.8) * ripple.strength;
      const drift = progress * 15;
      const x = ripple.x + ripple.vx * drift;
      const y = ripple.y + ripple.vy * drift;
      const radius = 9 + progress * 112;
      const stretch = 1 + Math.min(Math.hypot(ripple.vx, ripple.vy) * 0.16, 0.22);

      context.save();
      context.translate(x, y);
      context.rotate(Math.atan2(ripple.vy, ripple.vx || 0.001));
      context.scale(stretch, 1 / Math.sqrt(stretch));

      // A low-alpha soft bloom sells the subtle refractive distortion.
      const bloom = context.createRadialGradient(0, 0, radius * 0.18, 0, 0, radius * 1.35);
      bloom.addColorStop(0, `rgba(238, 255, 250, ${fade * 0.14})`);
      bloom.addColorStop(0.52, `rgba(176, 225, 214, ${fade * 0.05})`);
      bloom.addColorStop(1, "rgba(176, 225, 214, 0)");
      context.fillStyle = bloom;
      context.beginPath();
      context.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
      context.fill();

      context.lineWidth = 1 + (1 - progress) * 0.7;
      context.strokeStyle = `rgba(232, 255, 248, ${fade * 0.46})`;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.stroke();

      context.lineWidth = 0.7;
      context.strokeStyle = `rgba(22, 101, 84, ${fade * 0.2})`;
      context.beginPath();
      context.arc(0, 0, Math.max(3, radius - 8), 0, Math.PI * 2);
      context.stroke();
      context.restore();
    };

    const animate = (now) => {
      frameId = null;
      const delta = Math.min(now - previousTime, 34);
      previousTime = now;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "soft-light";

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        ripple.age += delta;
        if (ripple.age >= ripple.life) {
          ripples.splice(index, 1);
          continue;
        }
        drawRipple(ripple);
      }

      context.globalCompositeOperation = "source-over";
      // Stop the render loop as soon as the last ripple dissipates. The next
      // pointer movement starts it again, eliminating idle GPU wake-ups.
      scheduleFrame();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      } else if (!document.hidden) {
        previousTime = performance.now();
        scheduleFrame();
      }
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", addRipple, { passive: true });
    window.addEventListener("pointerleave", clearTrail, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", addRipple);
      window.removeEventListener("pointerleave", clearTrail);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-screen w-screen"
    />
  );
};

export default WaterRippleOverlay;
