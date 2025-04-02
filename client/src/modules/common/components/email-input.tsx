import React, { useState, useEffect, forwardRef } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailInputProps extends Omit<InputProps, "type"> {
  showValidationIcon?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, showValidationIcon = true, onValidationChange, ...props }, ref) => {
    const [email, setEmail] = useState<string>(props.value?.toString() || "");
    const [isValid, setIsValid] = useState<boolean | null>(null);
    
    // Email validation regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Update validation state when email changes
    useEffect(() => {
      if (email === "") {
        setIsValid(null);
        if (onValidationChange) onValidationChange(false);
        return;
      }
      
      const valid = emailRegex.test(email);
      setIsValid(valid);
      
      if (onValidationChange) {
        onValidationChange(valid);
      }
    }, [email, onValidationChange]);
    
    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEmail(value);
      
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    return (
      <div className="relative">
        <Input
          type="email"
          className={cn(
            "pr-10",
            className
          )}
          ref={ref}
          {...props}
          onChange={handleChange}
        />
        
        {showValidationIcon && email !== "" && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    );
  }
)

EmailInput.displayName = "EmailInput";