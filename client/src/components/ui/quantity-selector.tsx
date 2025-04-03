import { useState, useEffect } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { VisuallyHidden } from "./visually-hidden";

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: "default" | "sm" | "lg";
  allowManualInput?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
  label?: string;
  name?: string;
  id?: string;
}

export function QuantitySelector({
  initialValue = 1,
  min = 1,
  max = 99,
  step = 1,
  size = "default",
  allowManualInput = true,
  disabled = false,
  onChange,
  label = "Quantity",
  name = "quantity",
  id
}: QuantitySelectorProps) {
  // Generate random ID if not provided
  const inputId = id || `quantity-input-${Math.random().toString(36).substring(2, 9)}`;
  const decrementId = `${inputId}-decrement`;
  const incrementId = `${inputId}-increment`;
  const [value, setValue] = useState(initialValue);
  
  // Sync with initialValue if it changes externally
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const updateValue = (newValue: number) => {
    // Ensure value is within bounds
    newValue = Math.max(min, Math.min(max, newValue));
    setValue(newValue);
    onChange?.(newValue);
  };
  
  const increment = () => {
    if (value + step <= max) {
      updateValue(value + step);
    }
  };
  
  const decrement = () => {
    if (value - step >= min) {
      updateValue(value - step);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseInt(e.target.value);
    if (!isNaN(inputValue)) {
      updateValue(inputValue);
    }
  };
  
  // Size variants
  const buttonSizeClass = 
    size === "sm" ? "h-7 w-7" : 
    size === "lg" ? "h-10 w-10" : 
    "h-9 w-9";
  
  const inputSizeClass = 
    size === "sm" ? "h-7 w-12 text-sm" : 
    size === "lg" ? "h-10 w-16 text-lg" : 
    "h-9 w-14 text-base";
  
  return (
    <div className="flex flex-col space-y-1">
      <Label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex items-center" role="group" aria-labelledby={inputId}>
        <Button
          variant="outline"
          size="icon"
          className={buttonSizeClass}
          onClick={decrement}
          disabled={disabled || value <= min}
          type="button"
          id={decrementId}
          aria-label={`Decrease ${label.toLowerCase()}`}
          aria-controls={inputId}
        >
          <MinusIcon className="h-3 w-3" />
        </Button>
        
        {allowManualInput ? (
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleInputChange}
            className={`mx-1 text-center px-1 ${inputSizeClass}`}
            disabled={disabled}
            id={inputId}
            name={name}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
          />
        ) : (
          <div 
            className={`mx-1 flex items-center justify-center ${inputSizeClass} border rounded-md bg-background`}
            aria-live="polite"
            aria-atomic="true"
            id={inputId}
            role="status"
          >
            <span className="font-medium">{value}</span>
          </div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          className={buttonSizeClass}
          onClick={increment}
          disabled={disabled || value >= max}
          type="button"
          id={incrementId}
          aria-label={`Increase ${label.toLowerCase()}`}
          aria-controls={inputId}
        >
          <PlusIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}