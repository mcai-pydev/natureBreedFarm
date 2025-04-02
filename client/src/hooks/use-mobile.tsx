import { useEffect, useState, createContext, useContext, ReactNode } from "react";

// Define constants for breakpoints
const MOBILE_BREAKPOINT = 640; // matches sm in Tailwind
const TABLET_BREAKPOINT = 768; // matches md in Tailwind

type DeviceType = "mobile" | "tablet" | "desktop";

interface MobileContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  const handleResize = () => {
    const width = window.innerWidth;
    const newIsMobile = width < MOBILE_BREAKPOINT;
    const newIsTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    
    setIsMobile(newIsMobile);
    setIsTablet(newIsTablet);
    
    if (newIsMobile) {
      setDeviceType("mobile");
    } else if (newIsTablet) {
      setDeviceType("tablet");
    } else {
      setDeviceType("desktop");
    }
  };

  useEffect(() => {
    // Set initial device type
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <MobileContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        deviceType
      }}
    >
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  
  if (context === undefined) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  
  return context;
}

// For backwards compatibility
export const useIsMobile = () => {
  const { isMobile } = useMobile();
  return isMobile;
};