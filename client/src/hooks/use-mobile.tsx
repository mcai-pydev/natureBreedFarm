import { useEffect, useState } from 'react';

// Mobile detection hooks and utilities

/**
 * Hook for backward compatibility with existing codebase
 */
export function useIsMobile() {
  return useMobile();
}

/**
 * Hook to detect if the current device is a mobile device based on user agent
 */
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Common mobile user agent patterns
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      // Check if navigator is available (client-side)
      if (typeof navigator !== 'undefined') {
        setIsMobile(mobileRegex.test(navigator.userAgent));
      }
    };
    
    checkIfMobile();
  }, []);

  return isMobile;
}

/**
 * Hook to check if the screen is of mobile size based on width
 * @param breakpoint The pixel width that defines a mobile screen. Default: 768px
 */
export function useMobileScreen(breakpoint: number = 768) {
  const [isMobileSize, setIsMobileSize] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSize = () => {
      setIsMobileSize(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkSize();
    
    // Check on resize
    window.addEventListener('resize', checkSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkSize);
  }, [breakpoint]);

  return isMobileSize;
}

/**
 * Hook that combines device detection and screen size for comprehensive mobile check
 * @param breakpoint The pixel width that defines a mobile screen. Default: 768px
 */
export function useMobile(breakpoint: number = 768) {
  const isMobileDevice = useMobileDetect();
  const isMobileSize = useMobileScreen(breakpoint);
  
  // Consider it mobile if either the device is mobile or the screen size is mobile
  return isMobileDevice || isMobileSize;
}

/**
 * Utility to detect touch support in the browser
 */
export function hasTouchSupport(): boolean {
  return (
    typeof window !== 'undefined' && 
    ('ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      // @ts-ignore
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0))
  );
}