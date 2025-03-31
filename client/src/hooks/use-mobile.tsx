import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check on mount
    setIsMobile(window.innerWidth < breakpoint);

    // Set up listener for window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}