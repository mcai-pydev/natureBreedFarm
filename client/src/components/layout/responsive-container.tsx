import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/responsive-context';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  as?: React.ElementType;
  withPadding?: boolean;
  withVerticalPadding?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  none: ''
};

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'lg',
  as: Component = 'div',
  withPadding = true,
  withVerticalPadding = false,
  centered = true,
  fullHeight = false,
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();
  
  return (
    <Component 
      className={cn(
        maxWidthClasses[maxWidth],
        withPadding && (isMobile ? 'px-4' : 'px-6'),
        withVerticalPadding && (isMobile ? 'py-4' : 'py-6'),
        centered && 'mx-auto',
        fullHeight && 'h-full',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  itemClassName?: string;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  itemClassName,
}: ResponsiveGridProps) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };
  
  // Process columns configuration
  let colClasses = '';
  
  if (typeof cols === 'number') {
    colClasses = `grid-cols-1 sm:grid-cols-${Math.min(cols, 1)} md:grid-cols-${Math.min(cols, 2)} lg:grid-cols-${Math.min(cols, 3)} xl:grid-cols-${Math.min(cols, 4)}`;
  } else {
    colClasses = 'grid-cols-1';
    if (cols.sm) colClasses += ` sm:grid-cols-${cols.sm}`;
    if (cols.md) colClasses += ` md:grid-cols-${cols.md}`;
    if (cols.lg) colClasses += ` lg:grid-cols-${cols.lg}`;
    if (cols.xl) colClasses += ` xl:grid-cols-${cols.xl}`;
  }
  
  return (
    <div className={cn('grid', colClasses, gapClasses[gap], className)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        
        return React.cloneElement(child as React.ReactElement, {
          className: cn(itemClassName, (child as React.ReactElement).props.className),
        });
      })}
    </div>
  );
}