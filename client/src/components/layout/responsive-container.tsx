import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/responsive-context';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  centerContent?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

type GapSize = 'none' | 'sm' | 'md' | 'lg';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: GapSize;
  rowGap?: GapSize;
  columnGap?: GapSize;
}

const gapSizeMap = {
  none: '',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6'
};

const rowGapSizeMap = {
  none: '',
  sm: 'row-gap-2',
  md: 'row-gap-4',
  lg: 'row-gap-6'
};

const columnGapSizeMap = {
  none: '',
  sm: 'column-gap-2',
  md: 'column-gap-4',
  lg: 'column-gap-6'
};

const paddingSizeMap = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6'
};

export function ResponsiveContainer({
  children,
  className,
  fullWidth = false,
  centerContent = false,
  padding = 'md'
}: ResponsiveContainerProps) {
  const containerClasses = cn(
    'mx-auto',
    !fullWidth && 'max-w-7xl',
    paddingSizeMap[padding],
    centerContent && 'flex items-center justify-center',
    className
  );

  return <div className={containerClasses}>{children}</div>;
}

export function ResponsiveGrid({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  rowGap,
  columnGap
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const columns = isMobile 
    ? mobileColumns 
    : isTablet 
      ? tabletColumns 
      : desktopColumns;
  
  const gridClasses = cn(
    'grid',
    `grid-cols-${columns}`,
    gap !== 'none' && gapSizeMap[gap],
    rowGap && rowGapSizeMap[rowGap],
    columnGap && columnGapSizeMap[columnGap],
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  direction?: 'row' | 'column';
  reverse?: boolean;
  wrap?: boolean;
  gap?: GapSize;
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  className,
  direction = 'column',
  reverse = false,
  wrap = false,
  gap = 'md',
  alignItems = 'start',
  justifyContent = 'start'
}: ResponsiveStackProps) {
  const { isMobile } = useResponsive();
  
  // If mobile, default to column layout for better mobile experience
  const mobileDirection = isMobile ? 'column' : direction;
  
  const flexDirection = `flex-${mobileDirection}${reverse ? '-reverse' : ''}`;
  
  const stackClasses = cn(
    'flex',
    flexDirection,
    wrap && 'flex-wrap',
    gap !== 'none' && gapSizeMap[gap],
    `items-${alignItems}`,
    `justify-${justifyContent}`,
    className
  );

  return <div className={stackClasses}>{children}</div>;
}