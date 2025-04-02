import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useWindowSize } from '@/hooks/use-window-size';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  windowWidth: number;
  windowHeight: number;
}

const defaultContext: ResponsiveContextType = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLargeDesktop: false,
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
  windowHeight: typeof window !== 'undefined' ? window.innerHeight : 800
};

export const ResponsiveContext = createContext<ResponsiveContextType>(defaultContext);

interface ResponsiveProviderProps {
  children: ReactNode;
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
}

export function ResponsiveProvider({
  children,
  mobileBreakpoint = 640,
  tabletBreakpoint = 768,
  desktopBreakpoint = 1024,
}: ResponsiveProviderProps) {
  // Get window size for non-mobile devices
  const { width, height } = useWindowSize();
  
  // Check if device is mobile
  const detectedIsMobile = useIsMobile();
  
  // Calculated responsive states
  const [responsive, setResponsive] = useState<ResponsiveContextType>({
    ...defaultContext,
    windowWidth: width,
    windowHeight: height
  });
  
  // Update responsive context when window size changes
  useEffect(() => {
    const isMobile = detectedIsMobile || width <= mobileBreakpoint;
    const isTablet = !isMobile && width <= tabletBreakpoint;
    const isDesktop = !isMobile && !isTablet && width <= desktopBreakpoint;
    const isLargeDesktop = !isMobile && !isTablet && !isDesktop;
    
    setResponsive({
      isMobile,
      isTablet,
      isDesktop,
      isLargeDesktop,
      windowWidth: width,
      windowHeight: height
    });
  }, [width, height, detectedIsMobile, mobileBreakpoint, tabletBreakpoint, desktopBreakpoint]);
  
  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
}

// Custom hook to use the responsive context
export function useResponsive() {
  const context = useContext(ResponsiveContext);
  
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  
  return context;
}