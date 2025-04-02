import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/responsive-context';

export interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  mobileColumns?: 1 | 2 | 3 | 4;
  tabletColumns?: 1 | 2 | 3 | 4 | 6;
  desktopColumns?: 1 | 2 | 3 | 4 | 6 | 12;
  autoFit?: boolean;
  minWidth?: string;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rowGap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  columnGap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function useResponsiveGrid() {
  const { isMobile, isTablet } = useResponsive();
  
  const ResponsiveGrid = ({
    children,
    className,
    mobileColumns = 1,
    tabletColumns = 2,
    desktopColumns = 3,
    autoFit = false,
    minWidth = '220px',
    gap = 'md',
    rowGap,
    columnGap
  }: ResponsiveGridProps) => {
    // Determine the number of columns based on the screen size
    const columns = isMobile
      ? mobileColumns
      : isTablet
      ? tabletColumns
      : desktopColumns;
    
    // Maps for gap variations
    const gapMap = {
      none: '',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    };
    
    const rowGapMap = {
      none: '',
      sm: 'row-gap-2',
      md: 'row-gap-4',
      lg: 'row-gap-6',
      xl: 'row-gap-8'
    };
    
    const columnGapMap = {
      none: '',
      sm: 'column-gap-2',
      md: 'column-gap-4',
      lg: 'column-gap-6',
      xl: 'column-gap-8'
    };
    
    if (autoFit) {
      // Use CSS Grid with auto-fit for more flexible grid
      return (
        <div
          className={cn(
            "grid",
            gapMap[gap],
            rowGap && rowGapMap[rowGap],
            columnGap && columnGapMap[columnGap],
            className
          )}
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
          }}
        >
          {children}
        </div>
      );
    }
    
    // Fixed number of columns based on screen size
    return (
      <div
        className={cn(
          "grid",
          gapMap[gap],
          rowGap && rowGapMap[rowGap],
          columnGap && columnGapMap[columnGap],
          className
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
        }}
      >
        {children}
      </div>
    );
  };
  
  return ResponsiveGrid;
}