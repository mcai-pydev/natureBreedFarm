import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackPath?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
  showLabel?: boolean;
  onBack?: () => void;
  icon?: 'chevron' | 'arrow';
}

export function BackButton({
  fallbackPath = '/',
  variant = 'ghost',
  size = 'icon',
  className,
  label,
  showLabel = false,
  onBack,
  icon = 'chevron'
}: BackButtonProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  const buttonLabel = label || t('Back');
  
  const Icon = icon === 'chevron' ? ChevronLeft : ArrowLeft;
  
  const handleClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    
    // Try to use browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to the provided path
      setLocation(fallbackPath);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "group",
        showLabel && size !== 'icon' && "gap-2",
        className
      )}
      onClick={handleClick}
      aria-label={buttonLabel}
    >
      <Icon className={cn(
        "h-4 w-4",
        size === 'lg' && "h-5 w-5",
        "transition-transform group-hover:-translate-x-0.5"
      )} />
      {showLabel && size !== 'icon' && (
        <span>{buttonLabel}</span>
      )}
    </Button>
  );
}

interface PageHeaderWithBackProps {
  title: string;
  backButtonProps?: Omit<BackButtonProps, 'showLabel'>;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeaderWithBack({
  title,
  backButtonProps,
  className,
  actions
}: PageHeaderWithBackProps) {
  const { t } = useTranslation();
  
  return (
    <div className={cn(
      "flex items-center justify-between border-b pb-4 mb-4",
      className
    )}>
      <div className="flex items-center gap-2">
        <BackButton {...backButtonProps} />
        <h1 className="text-xl font-semibold">{t(title)}</h1>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}