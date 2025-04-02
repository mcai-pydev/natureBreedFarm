import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Screen breakpoints (matches Tailwind's defaults)
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

type BreakpointKey = keyof typeof BREAKPOINTS;

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  breakpoint: BreakpointKey;
  width: number;
  height: number;
}

const ResponsiveContext = createContext<ResponsiveContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isLargeDesktop: false,
  breakpoint: 'lg',
  width: 0,
  height: 0,
});

interface ResponsiveProviderProps {
  children: ReactNode;
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  useEffect(() => {
    // Skip if window is not available (e.g., during SSR)
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Set dimensions on mount
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get current breakpoint based on width
  const getCurrentBreakpoint = (): BreakpointKey => {
    if (dimensions.width >= BREAKPOINTS['2xl']) return '2xl';
    if (dimensions.width >= BREAKPOINTS.xl) return 'xl';
    if (dimensions.width >= BREAKPOINTS.lg) return 'lg';
    if (dimensions.width >= BREAKPOINTS.md) return 'md';
    if (dimensions.width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  };
  
  const breakpoint = getCurrentBreakpoint();
  
  // Derived state
  const contextValue: ResponsiveContextType = {
    isMobile: dimensions.width < BREAKPOINTS.md,
    isTablet: dimensions.width >= BREAKPOINTS.md && dimensions.width < BREAKPOINTS.lg,
    isDesktop: dimensions.width >= BREAKPOINTS.lg && dimensions.width < BREAKPOINTS.xl,
    isLargeDesktop: dimensions.width >= BREAKPOINTS.xl,
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
  };
  
  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
}

export function useResponsive() {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
}