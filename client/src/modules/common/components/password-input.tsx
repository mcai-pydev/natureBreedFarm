import React, { useState, forwardRef } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, CircleSlash, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PasswordInputProps extends Omit<InputProps, "type"> {
  showStrengthIndicator?: boolean;
  showVisibilityToggle?: boolean;
  strengthLevels?: number;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    className, 
    showStrengthIndicator = false,
    showVisibilityToggle = true,
    strengthLevels = 3,
    ...props 
  }, ref) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState<string>(props.value?.toString() || "");
    
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    // Calculate password strength (simplified version)
    const calculatePasswordStrength = (password: string): number => {
      if (!password) return 0;
      
      // We'll use a simple scoring system for demonstration
      let score = 0;
      
      // Length check (at least 8 characters)
      if (password.length >= 8) score += 1;
      
      // Complexity checks
      if (/[A-Z]/.test(password)) score += 1;  // Has uppercase
      if (/[a-z]/.test(password)) score += 1;  // Has lowercase
      if (/[0-9]/.test(password)) score += 1;  // Has numbers
      if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Has special characters
      
      // For various strength levels, we adjust the score
      const maxScore = 5;
      return Math.min(strengthLevels, Math.ceil((score / maxScore) * strengthLevels));
    };
    
    const strength = calculatePasswordStrength(password);
    
    const getStrengthText = (strength: number): string => {
      if (password === '') return '';
      
      if (strengthLevels === 3) {
        switch (strength) {
          case 0: return t('Weak');
          case 1: return t('Weak');
          case 2: return t('Medium');
          case 3: return t('Strong');
          default: return '';
        }
      } else if (strengthLevels === 4) {
        switch (strength) {
          case 0: return t('Very Weak');
          case 1: return t('Weak');
          case 2: return t('Medium');
          case 3: return t('Strong');
          case 4: return t('Very Strong');
          default: return '';
        }
      }
      
      return '';
    };
    
    const strengthText = getStrengthText(strength);
    
    const getStrengthColor = (strength: number): string => {
      if (password === '') return '';
      
      switch (strength) {
        case 0: return 'bg-destructive';
        case 1: return 'bg-destructive';
        case 2: return 'bg-yellow-500';
        case 3: return 'bg-green-500';
        case 4: return 'bg-green-600';
        default: return '';
      }
    };
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn(
              showVisibilityToggle && "pr-10",
              className
            )}
            ref={ref}
            value={password}
            onChange={handleChange}
            {...props}
          />
          
          {showVisibilityToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? t('Hide password') : t('Show password')}
              </span>
            </Button>
          )}
        </div>
        
        {showStrengthIndicator && password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: strengthLevels }).map((_, index) => (
                <div 
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    index < strength 
                      ? getStrengthColor(strength) 
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            {strengthText && (
              <div className="flex items-center gap-1 text-xs">
                {strength <= 1 ? (
                  <CircleSlash className="h-3 w-3 text-destructive" />
                ) : strength >= 3 ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : null}
                <span className={cn(
                  strength <= 1 ? "text-destructive" : 
                  strength === 2 ? "text-yellow-500" : 
                  "text-green-500"
                )}>
                  {strengthText}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";