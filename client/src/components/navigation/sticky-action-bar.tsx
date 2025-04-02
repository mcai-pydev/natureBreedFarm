import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/responsive-context';

interface StickyActionBarProps {
  children: ReactNode;
  className?: string;
  position?: 'bottom' | 'top';
  alwaysShow?: boolean;
  showOnDesktop?: boolean;
  showBorder?: boolean;
  showShadow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  zIndex?: number;
  transparent?: boolean;
  fullWidth?: boolean;
  safeArea?: boolean;
}

export function StickyActionBar({
  children,
  className,
  position = 'bottom',
  alwaysShow = false,
  showOnDesktop = false,
  showBorder = true,
  showShadow = true,
  padding = 'md',
  zIndex = 40,
  transparent = false,
  fullWidth = true,
  safeArea = true
}: StickyActionBarProps) {
  const { isMobile } = useResponsive();
  
  // Only show on mobile unless specified
  if (!isMobile && !showOnDesktop && !alwaysShow) {
    return null;
  }
  
  // Maps for style variations
  const paddingMap = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const positionClasses = {
    top: 'top-0 border-b',
    bottom: 'bottom-0 border-t'
  };
  
  return (
    <div 
      className={cn(
        "fixed left-0 right-0",
        "flex items-center",
        "transition-all duration-200 ease-in-out",
        position === 'bottom' && safeArea && "pb-safe",
        position === 'top' && safeArea && "pt-safe",
        positionClasses[position],
        paddingMap[padding],
        showBorder && "border-border",
        showShadow && position === 'bottom' ? "shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" : 
                       position === 'top' ? "shadow-[0_2px_10px_rgba(0,0,0,0.1)]" : "",
        !transparent && "bg-background",
        !fullWidth && "flex justify-center",
        className
      )}
      style={{ zIndex }}
    >
      <div className={cn(
        fullWidth ? "w-full" : "max-w-screen-lg w-full mx-auto"
      )}>
        {children}
      </div>
    </div>
  );
}

interface ActionBarButtonsContainerProps {
  children: ReactNode;
  className?: string;
  spaced?: boolean;
  centered?: boolean;
  reversed?: boolean;
}

export function ActionBarButtonsContainer({
  children,
  className,
  spaced = false,
  centered = false,
  reversed = false
}: ActionBarButtonsContainerProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 w-full",
      spaced && "justify-between",
      centered && "justify-center",
      reversed && "flex-row-reverse",
      !spaced && !centered && !reversed && "justify-end",
      className
    )}>
      {children}
    </div>
  );
}