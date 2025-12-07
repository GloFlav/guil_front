// src/components/ui/BackToTopButton.jsx
import React, { useEffect, useState } from "react";

/**
 * BackToTopButton
 * Props:
 *  - threshold: nombre de pixels avant d'afficher le bouton (default 250)
 *  - bottom, right: position CSS (chaîne ex: '2.5rem' ou '20px')
 *  - className: classes supplémentaires
 */
export default function BackToTopButton({
  threshold = 250,
  bottom = "4rem",
  right = "1.5rem",
  className = "",
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };

    // run once to set initial visibility (utile si on arrive déjà bas)
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Remonter en haut"
      onClick={scrollToTop}
      className={`fixed z-50 flex items-center justify-center p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-helloSoin bg-helloSoin text-white ${className}`}
      style={{ right, bottom }}
    >
      {/* SVG flèche vers le haut (simple et accessible) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12 19V6" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
