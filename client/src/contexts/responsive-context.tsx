import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ResponsiveContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

const defaultContext: ResponsiveContextType = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isLargeDesktop: false,
  orientation: 'landscape'
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
  desktopBreakpoint = 1024
}: ResponsiveProviderProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width, height } = dimensions;
  
  const isMobile = width < mobileBreakpoint;
  const isTablet = width >= mobileBreakpoint && width < tabletBreakpoint;
  const isDesktop = width >= tabletBreakpoint && width < desktopBreakpoint;
  const isLargeDesktop = width >= desktopBreakpoint;
  const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

  const value: ResponsiveContextType = {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    orientation,
  };

  return (
    <ResponsiveContext.Provider value={value}>
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