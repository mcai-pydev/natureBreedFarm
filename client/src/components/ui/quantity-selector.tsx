import { useState, useEffect } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: "default" | "sm" | "lg";
  allowManualInput?: boolean;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export function QuantitySelector({
  initialValue = 1,
  min = 1,
  max = 99,
  step = 1,
  size = "default",
  allowManualInput = true,
  disabled = false,
  onChange
}: QuantitySelectorProps) {
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
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon"
        className={buttonSizeClass}
        onClick={decrement}
        disabled={disabled || value <= min}
        type="button"
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
        />
      ) : (
        <div className={`mx-1 flex items-center justify-center ${inputSizeClass} border rounded-md bg-background`}>
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
      >
        <PlusIcon className="h-3 w-3" />
      </Button>
    </div>
  );
}