import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/responsive-context';

export interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'screen';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  mobilePadding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  centerContent?: boolean;
  adaptivePadding?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  fullWidth = false,
  maxWidth = 'lg',
  padding = 'md',
  paddingX,
  paddingY,
  mobilePadding,
  centerContent = false,
  adaptivePadding = true
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();
  
  // Maps for styling variations
  const maxWidthMap = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
    screen: 'max-w-screen-xl'
  };
  
  const paddingMap = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  const paddingXMap = {
    none: '',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
    xl: 'px-8'
  };
  
  const paddingYMap = {
    none: '',
    sm: 'py-2',
    md: 'py-4',
    lg: 'py-6',
    xl: 'py-8'
  };
  
  // Get the correct padding based on screen size
  const effectivePadding = isMobile && mobilePadding && adaptivePadding 
    ? mobilePadding
    : padding;
  
  return (
    <div 
      className={cn(
        !fullWidth && !centerContent && "mx-auto",
        !fullWidth && maxWidthMap[maxWidth],
        (!paddingX && !paddingY) && paddingMap[effectivePadding],
        paddingX && paddingXMap[paddingX],
        paddingY && paddingYMap[paddingY],
        centerContent && "flex justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ResponsiveSectionProps extends ResponsiveContainerProps {
  id?: string;
  background?: 'default' | 'muted' | 'primary' | 'dark';
  fullHeight?: boolean;
}

export function ResponsiveSection({
  id,
  children,
  className,
  background = 'default',
  fullHeight = false,
  ...containerProps
}: ResponsiveSectionProps) {
  // Maps for background variations
  const backgroundMap = {
    default: 'bg-background',
    muted: 'bg-muted',
    primary: 'bg-primary text-primary-foreground',
    dark: 'bg-card-foreground text-card'
  };
  
  return (
    <section 
      id={id}
      className={cn(
        backgroundMap[background],
        fullHeight && "min-h-screen",
        className
      )}
    >
      <ResponsiveContainer {...containerProps}>
        {children}
      </ResponsiveContainer>
    </section>
  );
}