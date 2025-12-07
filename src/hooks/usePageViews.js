// src/hooks/usePageViews.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/ga";

export default function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    // envoie le page_view quand la route change
    trackPageView({ path: location.pathname, location: window.location.href });
  }, [location]);
}
