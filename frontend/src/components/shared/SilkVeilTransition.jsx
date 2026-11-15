import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Taste-Skill SilkVeilTransition
 * Provides subtle couture progress hairline and page-editorial-reveal animation
 * on route changes without blocking navigation or causing layout shifts.
 */
export function SilkVeilTransition({ children }) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Clean scroll restoration
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 460);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      {isNavigating && (
        <div
          data-testid="silk-progress-line"
          className="fixed top-0 left-0 right-0 h-[2px] bg-[#e65100] z-[9999] animate-silk-progress pointer-events-none"
          aria-hidden="true"
        />
      )}
      <div
        key={location.pathname}
        className="page-editorial-reveal flex-1 w-full flex flex-col min-w-0"
      >
        {children}
      </div>
    </>
  );
}

export default SilkVeilTransition;
