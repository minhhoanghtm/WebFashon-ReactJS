import React from "react";
import { useWebsiteSettings } from "@/hooks/useWebsiteSettings";

export const CinematicWhiteTransition = ({ isVisible, logoText = "404 STUDIO" }) => {
  const { settings, loading } = useWebsiteSettings();
  const brandName =
    !loading && settings?.general?.siteName
      ? settings.general.siteName
      : logoText;

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white text-black transition-opacity duration-300 ease-out animate-in fade-in fill-mode-forwards"
      style={{ animationDuration: "350ms" }}
    >
      <div className="flex flex-col items-center space-y-2 animate-in zoom-in-95 duration-400">
        <span className="font-condensed text-4xl sm:text-6xl font-extrabold tracking-[0.2em] uppercase text-black">
          {brandName}
        </span>
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50">
          ATELIER EDITION
        </span>
      </div>
    </div>
  );
};

export default CinematicWhiteTransition;
