import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/contexts/responsive-context";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const { isMobile } = useResponsive();
  const mobileCompact = isMobile && compact;
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center animate-in fade-in-50",
        mobileCompact ? "p-4" : "p-8",
        className
      )}
    >
      {icon && (
        <div className={cn(
          "flex items-center justify-center rounded-full bg-muted mb-4",
          mobileCompact ? "w-10 h-10 text-muted-foreground/60" : "w-16 h-16 text-muted-foreground"
        )}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: cn(
              mobileCompact ? "h-5 w-5" : "h-8 w-8"
            )
          })}
        </div>
      )}
      <h3 className={cn(
        "font-semibold tracking-tight",
        mobileCompact ? "text-base" : "text-xl"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          "mt-2 text-muted-foreground",
          mobileCompact ? "text-sm" : "text-base"
        )}>
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4"
          size={mobileCompact ? "sm" : "default"}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({
  title = "Loading...",
  description,
  className,
  compact = false,
}: Omit<EmptyStateProps, "icon" | "action"> & { title?: string }) {
  const { isMobile } = useResponsive();
  const mobileCompact = isMobile && compact;
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center animate-in fade-in-50",
        mobileCompact ? "p-4" : "p-8",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center mb-4",
        mobileCompact ? "h-8 w-8" : "h-12 w-12"
      )}>
        <div className="h-full w-full rounded-full border-t-2 border-primary animate-spin" />
      </div>
      <h3 className={cn(
        "font-semibold tracking-tight",
        mobileCompact ? "text-base" : "text-xl"
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn(
          "mt-2 text-muted-foreground",
          mobileCompact ? "text-sm" : "text-base"
        )}>
          {description}
        </p>
      )}
    </div>
  );
}