import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useLocation, Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '@/contexts/responsive-context';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
  badgeCount?: number;
  exact?: boolean;
  onClick?: () => void;
}

interface BottomNavigationProps {
  items: NavItem[];
  className?: string;
  showLabels?: boolean;
  showActive?: boolean;
  variant?: 'default' | 'elevated' | 'filled';
}

export function BottomNavigation({
  items,
  className,
  showLabels = true,
  showActive = true,
  variant = 'default'
}: BottomNavigationProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isMobile } = useResponsive();
  
  // Don't render on non-mobile devices
  if (!isMobile) {
    return null;
  }
  
  // Style maps for different variants
  const variantStyles = {
    default: "bg-background border-t border-border",
    elevated: "bg-background shadow-[0_-4px_10px_rgba(0,0,0,0.1)]",
    filled: "bg-primary text-primary-foreground"
  };
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 pb-safe",
      "flex items-center justify-around",
      "h-14 z-50",
      variantStyles[variant],
      className
    )}>
      {items.map((item, index) => {
        const isActive = item.exact 
          ? location === item.path
          : location.startsWith(item.path);
        
        // Determine icon to show based on active state
        const iconToShow = isActive && item.activeIcon 
          ? item.activeIcon 
          : item.icon;
        
        return (
          <Link 
            key={index}
            href={item.path}
            onClick={item.onClick}
          >
            <a 
              className={cn(
                "relative flex flex-col items-center justify-center",
                "w-full h-full",
                "text-xs font-medium",
                isActive && showActive 
                  ? variant === 'filled' 
                    ? "text-primary-foreground"
                    : "text-primary" 
                  : variant === 'filled'
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={cn(
                "flex items-center justify-center",
                "h-6 w-6",
                "mb-0.5",
                isActive && showActive && variant !== 'filled' && "text-primary"
              )}>
                {iconToShow}
              </span>
              
              {showLabels && (
                <span className={cn(
                  "text-xs font-medium leading-none",
                  isActive && showActive && variant !== 'filled' && "text-primary"
                )}>
                  {t(item.label)}
                </span>
              )}
              
              {item.badgeCount && item.badgeCount > 0 && (
                <span className={cn(
                  "absolute -top-0.5 right-[30%]",
                  "flex items-center justify-center",
                  "min-w-[16px] h-4",
                  "text-[10px] font-medium",
                  "rounded-full px-1",
                  "bg-destructive text-destructive-foreground"
                )}>
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </span>
              )}
            </a>
          </Link>
        );
      })}
    </div>
  );
}

interface BottomTabLayoutProps {
  children: ReactNode;
  navigation: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function BottomTabLayout({
  children,
  navigation,
  className,
  contentClassName
}: BottomTabLayoutProps) {
  return (
    <div className={cn("flex flex-col min-h-screen", className)}>
      <main className={cn(
        "flex-1 pb-16", // Add bottom padding for navigation
        contentClassName
      )}>
        {children}
      </main>
      {navigation}
    </div>
  );
}