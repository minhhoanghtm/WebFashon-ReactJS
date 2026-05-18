import React, { useEffect, useState } from "react";
import { GoMoveToTop } from "react-icons/go";

const BackToTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShow(true);
      } else {
        setShow(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  if(!show) return null;
  return (
    <div>
      <button
        className="fixed rounded-full px-2 py-2 bottom-6 right-6 bg-white shadow-lg hover:bg-black hover:text-white transition-opacity duration-300"
        onClick={scrollToTop}
      >
        <GoMoveToTop className="text-2xl" />
      </button>
    </div>
  );
};

export default BackToTopButton;
