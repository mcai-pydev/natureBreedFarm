import React from 'react';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { ChevronLeft, X } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => void;
  to?: string;
  fallbackRoute?: string;
  showHomeIcon?: boolean;
  label?: string;
  iconVariant?: 'chevron' | 'x';
  onClose?: () => void;
}

export function BackButton({
  onClick,
  to,
  fallbackRoute = '/',
  showHomeIcon = false,
  label,
  iconVariant = 'chevron',
  onClose,
  className,
  variant = 'ghost',
  size = 'sm',
  ...props
}: BackButtonProps) {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  
  // Handle back navigation
  const handleBack = () => {
    if (onClick) {
      // Use custom handler if provided
      onClick();
    } else if (onClose) {
      // Use close handler if provided
      onClose();
    } else if (to) {
      // Navigate to specific route if provided
      navigate(to);
    } else if (window.history.length > 1) {
      // Go back in history if possible
      window.history.back();
    } else {
      // Fallback to home route
      navigate(fallbackRoute);
    }
  };
  
  const Icon = iconVariant === 'x' ? X : ChevronLeft;
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn("gap-1", className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {label && <span>{t(label)}</span>}
      {!label && showHomeIcon && <span>{t("Back")}</span>}
    </Button>
  );
}

interface PageHeaderWithBackProps {
  title: string;
  subtitle?: string;
  backButtonProps?: Omit<BackButtonProps, 'className' | 'size'>;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeaderWithBack({
  title,
  subtitle,
  backButtonProps,
  className,
  actions
}: PageHeaderWithBackProps) {
  const { t } = useTranslation();
  
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton size="sm" {...backButtonProps} />
          <h2 className="text-xl font-semibold leading-none tracking-tight">
            {t(title)}
          </h2>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{t(subtitle)}</p>
      )}
    </div>
  );
}