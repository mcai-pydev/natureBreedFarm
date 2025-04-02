import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface StepItem {
  label: string;
  description?: string;
  icon?: ReactNode;
  optional?: boolean;
}

interface MobileStepperProps {
  steps: StepItem[];
  activeStep: number;
  className?: string;
  variant?: 'dots' | 'text' | 'progress' | 'icons';
  onStepClick?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  allowNavigation?: boolean;
  compact?: boolean;
  colorCompleted?: boolean;
}

export function MobileStepper({
  steps,
  activeStep,
  className,
  variant = 'progress',
  onStepClick,
  orientation = 'horizontal',
  showLabels = true,
  allowNavigation = false,
  compact = false,
  colorCompleted = true
}: MobileStepperProps) {
  const { t } = useTranslation();
  
  // Determine if a step is completed, active, or upcoming
  const getStepStatus = (index: number) => {
    if (index < activeStep) return 'completed';
    if (index === activeStep) return 'active';
    return 'upcoming';
  };
  
  // Horizontal dots variant (most compact)
  if (variant === 'dots' && orientation === 'horizontal') {
    return (
      <div className={cn("flex justify-center items-center gap-2", className)}>
        {steps.map((_, index) => {
          const status = getStepStatus(index);
          return (
            <button
              key={index}
              onClick={() => allowNavigation && onStepClick?.(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                status === 'completed' && colorCompleted ? "bg-primary" : "",
                status === 'completed' && !colorCompleted ? "bg-muted-foreground" : "",
                status === 'active' ? "bg-primary w-4" : "",
                status === 'upcoming' ? "bg-muted-foreground/30" : "",
                allowNavigation ? "cursor-pointer hover:opacity-80" : "cursor-default"
              )}
              disabled={!allowNavigation}
              aria-label={t('Step {{stepNumber}} of {{totalSteps}}', { stepNumber: index + 1, totalSteps: steps.length })}
            />
          );
        })}
      </div>
    );
  }
  
  // Progress bar variant (horizontal only)
  if (variant === 'progress' && orientation === 'horizontal') {
    const progress = Math.round((activeStep / (steps.length - 1)) * 100);
    
    return (
      <div className={cn("space-y-2 w-full", className)}>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full bg-primary transition-all duration-300 ease-in-out",
              colorCompleted ? "bg-primary" : "bg-muted-foreground"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {showLabels && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('Step {{number}}', { number: activeStep + 1 })}</span>
            <span>{t('of {{totalSteps}}', { totalSteps: steps.length })}</span>
          </div>
        )}
      </div>
    );
  }
  
  // Text variant (simplest and most accessible)
  if (variant === 'text') {
    return (
      <div className={cn(
        "flex items-center text-sm",
        orientation === 'horizontal' ? "justify-center gap-2" : "flex-col gap-1",
        className
      )}>
        <span className={cn(
          "font-medium",
          colorCompleted ? "text-primary" : "text-foreground"
        )}>
          {t('Step {{number}}', { number: activeStep + 1 })}
        </span>
        <span className="text-muted-foreground">
          {t('of {{totalSteps}}', { totalSteps: steps.length })}
        </span>
        {showLabels && !compact && (
          <span className="text-muted-foreground ml-2">
            ({t(steps[activeStep].label)})
          </span>
        )}
      </div>
    );
  }
  
  // Default: Icons variant with full step display
  return (
    <div className={cn(
      orientation === 'horizontal' 
        ? "flex items-center justify-between w-full" 
        : "flex flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        
        // Render the connector (line between steps)
        const renderConnector = (index < steps.length - 1) && (
          <div 
            className={cn(
              orientation === 'horizontal' 
                ? "flex-1 h-px mx-2"
                : "w-px h-8 absolute top-8 bottom-0 left-4",
              status === 'completed' && colorCompleted 
                ? "bg-primary"
                : "bg-muted"
            )}
          />
        );
        
        return (
          <React.Fragment key={index}>
            <div 
              className={cn(
                "flex items-center",
                orientation === 'vertical' && "relative",
                orientation === 'horizontal' && compact && "flex-col"
              )}
            >
              <button
                onClick={() => allowNavigation && onStepClick?.(index)}
                disabled={!allowNavigation}
                className={cn(
                  "flex items-center justify-center rounded-full w-8 h-8 text-xs font-medium transition-colors",
                  status === 'completed' && colorCompleted
                    ? "bg-primary text-primary-foreground" 
                    : status === 'completed' && !colorCompleted
                    ? "bg-muted-foreground text-muted-foreground-foreground"
                    : status === 'active'
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30" 
                    : "bg-muted text-muted-foreground",
                  allowNavigation 
                    ? "cursor-pointer hover:opacity-80" 
                    : "cursor-default",
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.icon || (index + 1)
                )}
              </button>
              
              {showLabels && (
                <div className={cn(
                  "flex flex-col",
                  orientation === 'horizontal' && !compact && "ml-2",
                  orientation === 'horizontal' && compact && "mt-1 text-center",
                  orientation === 'vertical' && "ml-3"
                )}>
                  <span className={cn(
                    "text-sm font-medium",
                    status === 'active'
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                    {t(step.label)}
                  </span>
                  
                  {step.description && !compact && (
                    <span className="text-xs text-muted-foreground">
                      {t(step.description)}
                      {step.optional && (
                        <span className="ml-1 text-muted-foreground/70">
                          ({t('Optional')})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {orientation === 'horizontal' 
              ? index < steps.length - 1 && renderConnector
              : renderConnector}
          </React.Fragment>
        );
      })}
    </div>
  );
}