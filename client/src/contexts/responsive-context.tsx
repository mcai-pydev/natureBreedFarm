import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { breakpoints } from '@/hooks/use-mobile';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type Breakpoints = Record<BreakpointKey, number>;

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpointKey: BreakpointKey | null;
  windowWidth: number;
  windowHeight: number;
  orientation: 'portrait' | 'landscape';
}

const defaultContext: ResponsiveContextType = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpointKey: null,
  windowWidth: 0,
  windowHeight: 0,
  orientation: 'landscape',
};

const ResponsiveContext = createContext<ResponsiveContextType>(defaultContext);

export function useResponsive() {
  return useContext(ResponsiveContext);
}

interface ResponsiveProviderProps {
  children: ReactNode;
  customBreakpoints?: Breakpoints;
}

export function ResponsiveProvider({ 
  children,
  customBreakpoints
}: ResponsiveProviderProps) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  
  const [contextValue, setContextValue] = useState<ResponsiveContextType>({
    ...defaultContext,
  });

  // Use custom or default breakpoints
  const activeBreakpoints: Breakpoints = customBreakpoints || breakpoints as Breakpoints;

  useEffect(() => {
    // Handle server-side rendering
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowDimensions({ width, height });
      
      // Determine current breakpoint
      let currentBreakpoint: BreakpointKey | null = null;
      
      if (width < activeBreakpoints.sm) {
        currentBreakpoint = 'xs';
      } else if (width < activeBreakpoints.md) {
        currentBreakpoint = 'sm';
      } else if (width < activeBreakpoints.lg) {
        currentBreakpoint = 'md';
      } else if (width < activeBreakpoints.xl) {
        currentBreakpoint = 'lg';
      } else if (width < activeBreakpoints['2xl']) {
        currentBreakpoint = 'xl';
      } else {
        currentBreakpoint = '2xl';
      }
      
      // Update context value
      setContextValue({
        isMobile: width < activeBreakpoints.md,
        isTablet: width >= activeBreakpoints.md && width < activeBreakpoints.lg,
        isDesktop: width >= activeBreakpoints.lg,
        breakpointKey: currentBreakpoint,
        windowWidth: width,
        windowHeight: height,
        orientation: height > width ? 'portrait' : 'landscape',
      });
    };
    
    // Initial call
    updateDimensions();
    
    // Add event listener
    window.addEventListener('resize', updateDimensions);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [activeBreakpoints]);

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
}