import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  allowManualInput?: boolean;
  unit?: string;
}

export function QuantitySelector({
  initialValue = 1,
  min = 1,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  className,
  size = "md",
  allowManualInput = true,
  unit,
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialValue);

  useEffect(() => {
    // Update internal state if initialValue changes externally
    setQuantity(initialValue);
  }, [initialValue]);

  const sizes = {
    sm: {
      container: "h-8",
      button: "h-8 w-8 p-0",
      input: "h-8 text-sm",
      icon: "h-3 w-3",
    },
    md: {
      container: "h-10",
      button: "h-10 w-10 p-0",
      input: "h-10 text-base",
      icon: "h-4 w-4",
    },
    lg: {
      container: "h-12",
      button: "h-12 w-12 p-0",
      input: "h-12 text-lg",
      icon: "h-5 w-5",
    },
  };

  const decrement = () => {
    if (quantity > min) {
      const newValue = Math.max(min, quantity - step);
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const increment = () => {
    if (quantity < max) {
      const newValue = Math.min(max, quantity + step);
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const newValue = Math.min(max, Math.max(min, value));
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center border rounded-md overflow-hidden",
        sizes[size].container,
        disabled ? "opacity-50 cursor-not-allowed" : "",
        className
      )}
    >
      <Button
        variant="ghost"
        className={cn(
          "rounded-none border-r",
          sizes[size].button
        )}
        onClick={decrement}
        disabled={disabled || quantity <= min}
        tabIndex={disabled ? -1 : 0}
        aria-label="Decrease quantity"
      >
        <Minus className={sizes[size].icon} />
      </Button>

      {allowManualInput ? (
        <Input
          type="number"
          value={quantity}
          onChange={handleInputChange}
          className={cn(
            "border-0 text-center flex-1 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0",
            sizes[size].input
          )}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-label="Quantity"
        />
      ) : (
        <div className={cn(
          "flex-1 flex items-center justify-center text-center",
          sizes[size].input
        )}>
          <span>{quantity}</span>
          {unit && <span className="ml-1 text-muted-foreground text-sm">{unit}</span>}
        </div>
      )}

      <Button
        variant="ghost"
        className={cn(
          "rounded-none border-l",
          sizes[size].button
        )}
        onClick={increment}
        disabled={disabled || quantity >= max}
        tabIndex={disabled ? -1 : 0}
        aria-label="Increase quantity"
      >
        <Plus className={sizes[size].icon} />
      </Button>
    </div>
  );
}