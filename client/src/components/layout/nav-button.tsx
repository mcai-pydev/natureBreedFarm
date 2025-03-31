import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";

interface NavButtonProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  isMobile?: boolean;
  showTooltip?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  exact?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "link";
  onClick?: () => void;
  className?: string;
}

export function NavButton({
  href,
  label,
  icon,
  isMobile = false,
  showTooltip = false,
  tooltipSide = "right",
  exact = false,
  disabled = false,
  variant = "ghost",
  onClick,
  className,
}: NavButtonProps) {
  const [location] = useLocation();
  
  // Check if the current route matches this nav item
  const isActive = exact 
    ? location === href
    : href !== "/" 
      ? location.startsWith(href) 
      : location === "/";
  
  const buttonContent = (
    <Link
      href={disabled ? "#" : href}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        onClick?.();
      }}
      className={cn(
        buttonVariants({ variant }),
        "justify-start",
        isActive && "bg-muted font-medium text-primary",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {icon && <span className={cn("mr-2", isMobile && "mr-0")}>{icon}</span>}
      {(!isMobile || !icon) && <span>{label}</span>}
    </Link>
  );
  
  if (showTooltip && isMobile && icon) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return buttonContent;
}

interface NavGroupProps {
  label: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function NavGroup({
  label,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
}: NavGroupProps) {
  // If we wanted to make the group collapsible, we could use 
  // the Collapsible component from shadcn/ui here
  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-xs font-medium text-muted-foreground px-4 py-2">
        {label}
      </h3>
      {children}
    </div>
  );
}

interface NavDividerProps {
  className?: string;
}

export function NavDivider({ className }: NavDividerProps) {
  return <div className={cn("h-px bg-border my-2", className)} />;
}

interface BreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="mx-1 text-muted-foreground">/</span>}
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}