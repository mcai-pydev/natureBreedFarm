import { useState, useEffect } from "react";
import { Input, InputProps } from "@/components/ui/input";
import { AlertCircle, CheckCircle } from "lucide-react";

interface EmailInputProps extends Omit<InputProps, "type"> {
  showValidationIcon?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

// Regular expression for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailInput({ 
  showValidationIcon = true, 
  onValidationChange,
  className,
  value,
  onChange,
  ...props 
}: EmailInputProps) {
  const [isValid, setIsValid] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Validate the email value
  useEffect(() => {
    if (typeof value === 'string') {
      const valid = value.trim() !== '' && EMAIL_REGEX.test(value);
      setIsValid(valid);
      onValidationChange?.(valid);
    }
  }, [value, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isDirty) setIsDirty(true);
    onChange?.(e);
  };

  return (
    <div className="relative">
      <Input
        type="email"
        className={`${className} ${isDirty && !isValid ? 'border-red-500 pr-10' : isValid && value ? 'border-green-500 pr-10' : ''}`}
        value={value}
        onChange={handleChange}
        {...props}
      />
      {showValidationIcon && isDirty && value && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      )}
    </div>
  );
}