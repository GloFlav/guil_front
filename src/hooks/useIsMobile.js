import { useState, useEffect } from "react";

// Key for localStorage
const MOBILE_DEVICE_STORAGE_KEY = 'isMobileDevice';

// Enhanced mobile detection hook with more aggressive detection and persistence
export const useIsMobile = () => {
  // Initialize state from localStorage or default to false
  const [isMobile, setIsMobile] = useState(() => {
    try {
      const storedValue = localStorage.getItem(MOBILE_DEVICE_STORAGE_KEY);
      return storedValue ? JSON.parse(storedValue) : false;
    } catch (error) {
      return false;
    }
  });

  useEffect(() => {
    const checkIsMobile = () => {
      // Check user agent - primary detection method
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
      const isUserAgentMobile = mobileRegex.test(userAgent);
      
      // Check screen width with different breakpoints
      const screenWidth = window.innerWidth;
      const isScreenMobile = screenWidth <= 768;
      const isTabletPortrait = screenWidth <= 1024 && window.innerHeight > screenWidth;
      
      // Check touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check device pixel ratio (high DPI mobile devices)
      const isHighDPI = window.devicePixelRatio > 1.5;
      
      // Check orientation API
      const isPortraitOrientation = window.screen?.orientation?.type?.includes('portrait') || 
                                   window.innerHeight > window.innerWidth;
      
      // Enhanced detection logic - prioritize user agent and combine multiple factors
      const isMobileDevice = isUserAgentMobile || 
                            (isScreenMobile && isTouchDevice) ||
                            (isTabletPortrait && isTouchDevice) ||
                            (isScreenMobile && isHighDPI && isPortraitOrientation);
      
      // Update state and localStorage only if the value has changed
      setIsMobile(prevIsMobile => {
        if (prevIsMobile !== isMobileDevice) {
          try {
            localStorage.setItem(MOBILE_DEVICE_STORAGE_KEY, JSON.stringify(isMobileDevice));
          } catch (error) {
            }
          return isMobileDevice;
        }
        return prevIsMobile;
      });
    };

    // Initial check
    checkIsMobile();

    // ✅ OPTIMISATION: Debounce du resize pour éviter trop d'appels
    let resizeTimer;
    const handleResize = () => {
      // Annuler le timer précédent
      clearTimeout(resizeTimer);
      // Attendre 150ms avant de vérifier (debounce)
      resizeTimer = setTimeout(checkIsMobile, 150);
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(checkIsMobile, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      clearTimeout(resizeTimer); // ✅ Nettoyer le timer
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return isMobile;
};

