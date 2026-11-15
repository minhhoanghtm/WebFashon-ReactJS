import React, { useEffect, useState, useCallback } from "react";
import { scrollToLenis } from "@/hooks/useLenis";

export const HomeDotNavigation = ({ sections = [] }) => {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || "");
  const [hoveredSectionId, setHoveredSectionId] = useState(null);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrollToLenis(el, { duration: 1.1 });
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: 0,
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Keyboard navigation (PageUp / PageDown / ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const currentIndex = sections.findIndex((s) => s.id === activeSectionId);
      if (currentIndex === -1) return;

      if (e.key === "PageDown" || (e.key === "ArrowDown" && e.altKey)) {
        if (currentIndex < sections.length - 1) {
          e.preventDefault();
          scrollToSection(sections[currentIndex + 1].id);
        }
      } else if (e.key === "PageUp" || (e.key === "ArrowUp" && e.altKey)) {
        if (currentIndex > 0) {
          e.preventDefault();
          scrollToSection(sections[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSectionId, sections, scrollToSection]);

  if (!sections || sections.length === 0) return null;

  return (
    <nav
      data-testid="home-dot-navigation"
      aria-label="Thanh chỉ mục trang chủ"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3.5 select-none"
    >
      {sections.map((sec) => {
        const isActive = activeSectionId === sec.id;
        const isHovered = hoveredSectionId === sec.id;

        return (
          <div
            key={sec.id}
            className="relative flex items-center justify-end group"
            onMouseEnter={() => setHoveredSectionId(sec.id)}
            onMouseLeave={() => setHoveredSectionId(null)}
          >
            {/* Tooltip Label */}
            <div
              className={`absolute right-7 pointer-events-none px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase rounded shadow-lg transition-all duration-200 border ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2"
              } bg-zinc-900/90 text-zinc-100 border-zinc-700 backdrop-blur-xs`}
            >
              {sec.label}
            </div>

            {/* Dot Button (min touch target >= 44x44px for accessibility) */}
            <button
              type="button"
              onClick={() => scrollToSection(sec.id)}
              aria-label={`Chuyển đến ${sec.label}`}
              aria-current={isActive ? "true" : undefined}
              className="touch-target flex items-center justify-center w-11 h-11 p-2 cursor-pointer transition-transform hover:scale-110"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-2.5 h-6 bg-foreground shadow-sm"
                    : "w-2 h-2 bg-foreground/35 hover:bg-foreground/75"
                }`}
              />
            </button>
          </div>
        );
      })}
    </nav>
  );
};

export default HomeDotNavigation;
