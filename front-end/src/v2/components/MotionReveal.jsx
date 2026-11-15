import { useEffect, useRef } from "react";
import { gsap } from "gsap";
export default function MotionReveal({ children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => { const mm = gsap.matchMedia(); mm.add("(prefers-reduced-motion: no-preference)", () => gsap.fromTo(ref.current, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: "power3.out" })); return () => mm.revert(); }, []);
  return <div ref={ref} className={className}>{children}</div>;
}
