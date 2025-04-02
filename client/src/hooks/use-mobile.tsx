import { useEffect, useState } from 'react';

/**
 * Breakpoints for responsive design
 * These match Tailwind CSS's default breakpoints
 */
export const breakpoints = {
  xs: 0,    // extra small screens
  sm: 640,  // small screens
  md: 768,  // medium screens
  lg: 1024, // large screens
  xl: 1280, // extra large screens
  '2xl': 1536 // 2x large screens
};

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint - The max width in pixels to consider as "mobile" (default: 768px)
 * @returns boolean indicating if viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);
  
  return isMobile;
}

/**
 * Hook to detect orientation
 * @returns 'portrait' or 'landscape'
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' 
      ? window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      : 'landscape'
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return orientation;
}

/**
 * Hook to detect touch-capable devices
 * @returns boolean indicating if the device has touch capabilities
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check for touch capability
    const hasTouch = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;
    
    setIsTouch(hasTouch);
  }, []);
  
  return isTouch;
}

/**
 * Hook to get current breakpoint key
 * @returns The current breakpoint key ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('xs');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.sm) {
        setBreakpoint('xs');
      } else if (width < breakpoints.md) {
        setBreakpoint('sm');
      } else if (width < breakpoints.lg) {
        setBreakpoint('md');
      } else if (width < breakpoints.xl) {
        setBreakpoint('lg');
      } else if (width < breakpoints['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return breakpoint;
}