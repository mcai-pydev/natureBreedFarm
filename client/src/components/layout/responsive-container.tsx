import React, { ReactNode } from 'react';
import { useResponsive } from '@/contexts/responsive-context';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  mobileClassName?: string; 
  tabletClassName?: string;
  desktopClassName?: string;
  className?: string;
  fullHeight?: boolean;
  fullWidth?: boolean;
  centered?: boolean;
  mobileStack?: boolean; // Whether to stack children on mobile (adds flex-col on mobile)
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const gapSizeMap = {
  none: '',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const paddingSizeMap = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export function ResponsiveContainer({
  children,
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
  className = '',
  fullHeight = false,
  fullWidth = false,
  centered = false,
  mobileStack = false,
  gap = 'none',
  padding = 'none',
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Determine which class to apply based on viewport
  let responsiveClass = '';
  if (isMobile) {
    responsiveClass = mobileClassName;
  } else if (isTablet) {
    responsiveClass = tabletClassName;
  } else {
    responsiveClass = desktopClassName;
  }
  
  return (
    <div
      className={cn(
        // Base classes
        className,
        responsiveClass,
        
        // Layout utilities
        fullHeight && 'h-full',
        fullWidth && 'w-full',
        centered && 'flex items-center justify-center',
        
        // Gap
        gapSizeMap[gap],
        
        // Padding
        paddingSizeMap[padding],
        
        // Mobile stacking
        mobileStack && isMobile ? 'flex flex-col' : ''
      )}
    >
      {children}
    </div>
  );
}

// Grid container with responsive columns
interface ResponsiveGridProps {
  children: ReactNode;
  mobileColumns?: 1 | 2 | 3 | 4;
  tabletColumns?: 1 | 2 | 3 | 4 | 6;
  desktopColumns?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  itemClassName?: string;
}

export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  className = '',
  itemClassName = '',
}: ResponsiveGridProps) {
  const mobileGridClass = `grid-cols-${mobileColumns}`;
  const tabletGridClass = `md:grid-cols-${tabletColumns}`;
  const desktopGridClass = `lg:grid-cols-${desktopColumns}`;
  
  return (
    <div
      className={cn(
        'grid',
        mobileGridClass,
        tabletGridClass,
        desktopGridClass,
        gapSizeMap[gap],
        className
      )}
    >
      {React.Children.map(children, (child) => (
        <div className={itemClassName}>{child}</div>
      ))}
    </div>
  );
}

// Two column layout that can switch to stacked on mobile
interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string; // e.g., 'w-1/3', 'w-1/2'
  rightWidth?: string;
  reverseOnMobile?: boolean;
  stackOnMobile?: boolean;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export function TwoColumnLayout({
  left,
  right,
  leftWidth = 'w-1/2',
  rightWidth = 'w-1/2',
  reverseOnMobile = false,
  stackOnMobile = true,
  gap = 'md',
  className = '',
  leftClassName = '',
  rightClassName = '',
}: TwoColumnLayoutProps) {
  const { isMobile } = useResponsive();
  
  const flexDirection = isMobile && stackOnMobile
    ? reverseOnMobile
      ? 'flex-col-reverse'
      : 'flex-col'
    : 'flex-row';
  
  const leftColumnWidth = isMobile && stackOnMobile ? 'w-full' : leftWidth;
  const rightColumnWidth = isMobile && stackOnMobile ? 'w-full' : rightWidth;
  
  return (
    <div className={cn('flex', flexDirection, gapSizeMap[gap], className)}>
      <div className={cn(leftColumnWidth, leftClassName)}>
        {left}
      </div>
      <div className={cn(rightColumnWidth, rightClassName)}>
        {right}
      </div>
    </div>
  );
}