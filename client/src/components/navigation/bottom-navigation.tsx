import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BottomNavItemProps {
  label: string;
  href: string;
  icon: ReactNode;
  isActive?: boolean;
  badge?: number | string;
  onClick?: () => void;
}

export function BottomNavItem({
  label,
  href,
  icon,
  isActive,
  badge,
  onClick
}: BottomNavItemProps) {
  const { t } = useTranslation();
  
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex flex-col items-center justify-center px-2 py-1",
          "transition-colors duration-200 h-full",
          isActive 
            ? "text-primary" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={onClick}
      >
        <div className="relative">
          {icon}
          {badge != null && Number(badge) > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        <span className="text-xs mt-1">{t(label)}</span>
      </a>
    </Link>
  );
}

export interface BottomNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number | string;
  onClick?: () => void;
}

interface BottomNavigationProps {
  items: BottomNavItem[];
  className?: string;
  showLabels?: boolean;
}

export function BottomNavigation({
  items,
  className,
  showLabels = true
}: BottomNavigationProps) {
  const [location] = useLocation();

  // Determine if a nav item is active
  const isActive = (href: string) => {
    return location === href || location.startsWith(`${href}/`);
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex md:hidden z-40",
      className
    )}>
      {items.map((item, index) => (
        <div key={index} className="flex-1">
          <BottomNavItem
            label={item.label}
            href={item.href}
            icon={item.icon}
            isActive={isActive(item.href)}
            badge={item.badge}
            onClick={item.onClick}
          />
        </div>
      ))}
    </div>
  );
}

interface MobilePageContainerProps {
  children: ReactNode;
  className?: string;
  hasBottomNav?: boolean;
  bottomOffset?: string;
}

export function MobilePageContainer({
  children,
  className,
  hasBottomNav = true,
  bottomOffset = 'pb-16'
}: MobilePageContainerProps) {
  return (
    <div className={cn(
      "w-full h-full",
      hasBottomNav && bottomOffset,
      className
    )}>
      {children}
    </div>
  );
}