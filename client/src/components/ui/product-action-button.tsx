import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Eye, 
  BarChart2,
  ShoppingBag,
  Plus,
  Minus,
  Trash,
  Copy,
  Edit,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Types of product actions
type ActionType = 
  | "buy" 
  | "wishlist" 
  | "share" 
  | "quickview" 
  | "compare"
  | "add" 
  | "remove" 
  | "delete" 
  | "edit" 
  | "duplicate"
  | "approve"
  | "reject";

interface ProductActionButtonProps {
  action: ActionType;
  onClick: () => void;
  showLabel?: boolean;
  label?: string;
  tooltipText?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  className?: string;
}

export function ProductActionButton({
  action,
  onClick,
  showLabel = false,
  label,
  tooltipText,
  disabled = false,
  variant = "default",
  size = "icon",
  loading = false,
  className,
}: ProductActionButtonProps) {
  // Configuration for each action type
  const actionConfig = {
    buy: {
      icon: <ShoppingCart className="h-4 w-4" />,
      defaultLabel: "Add to Cart",
      defaultTooltip: "Add to cart",
    },
    wishlist: {
      icon: <Heart className="h-4 w-4" />,
      defaultLabel: "Save",
      defaultTooltip: "Add to wishlist",
    },
    share: {
      icon: <Share2 className="h-4 w-4" />,
      defaultLabel: "Share",
      defaultTooltip: "Share this product",
    },
    quickview: {
      icon: <Eye className="h-4 w-4" />,
      defaultLabel: "Quick View",
      defaultTooltip: "Quick view",
    },
    compare: {
      icon: <BarChart2 className="h-4 w-4" />,
      defaultLabel: "Compare",
      defaultTooltip: "Add to comparison",
    },
    add: {
      icon: <Plus className="h-4 w-4" />,
      defaultLabel: "Add",
      defaultTooltip: "Add item",
    },
    remove: {
      icon: <Minus className="h-4 w-4" />,
      defaultLabel: "Remove",
      defaultTooltip: "Remove item",
    },
    delete: {
      icon: <Trash className="h-4 w-4" />,
      defaultLabel: "Delete",
      defaultTooltip: "Delete item",
      defaultVariant: "destructive" as const,
    },
    edit: {
      icon: <Edit className="h-4 w-4" />,
      defaultLabel: "Edit",
      defaultTooltip: "Edit item",
    },
    duplicate: {
      icon: <Copy className="h-4 w-4" />,
      defaultLabel: "Duplicate",
      defaultTooltip: "Duplicate item",
    },
    approve: {
      icon: <CheckCircle className="h-4 w-4" />,
      defaultLabel: "Approve",
      defaultTooltip: "Approve item",
    },
    reject: {
      icon: <XCircle className="h-4 w-4" />,
      defaultLabel: "Reject",
      defaultTooltip: "Reject item",
      defaultVariant: "destructive" as const,
    }
  };

  const config = actionConfig[action];
  const finalLabel = label || config.defaultLabel;
  const finalTooltip = tooltipText || config.defaultTooltip;
  const finalVariant = variant || config.defaultVariant || "default";

  const button = (
    <Button
      variant={finalVariant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "transition-all",
        loading && "animate-pulse",
        className
      )}
    >
      {config.icon}
      {showLabel && <span className={cn("ml-2")}>{finalLabel}</span>}
      {loading && <span className="sr-only">Loading...</span>}
    </Button>
  );

  // If tooltip is enabled and not showing a label
  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{finalTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Return button without tooltip if showing label
  return button;
}

// Specialized quantity selector component that uses the ActionButton
interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max = 999,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  return (
    <div className={cn("flex items-center border rounded-md", className)}>
      <ProductActionButton
        action="remove"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        variant="ghost"
        size="sm"
      />
      
      <span className="w-8 text-center font-medium">
        {quantity}
      </span>
      
      <ProductActionButton
        action="add"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        variant="ghost"
        size="sm"
      />
    </div>
  );
}

// Component for a button to add product to cart with quantity selection
interface AddToCartButtonProps {
  onAddToCart: (quantity: number) => void;
  initialQuantity?: number;
  maxQuantity?: number;
  loading?: boolean;
  className?: string;
}

export function AddToCartButton({
  onAddToCart,
  initialQuantity = 1,
  maxQuantity = 99,
  loading = false,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const { toast } = useToast();

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast({
        title: "Maximum quantity reached",
        description: `You can only add up to ${maxQuantity} of this item`,
        variant: "destructive",
      });
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(quantity);
    // Optionally reset after adding
    setQuantity(initialQuantity);
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
      <QuantitySelector
        quantity={quantity}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        max={maxQuantity}
        disabled={loading}
      />
      
      <Button 
        variant="default" 
        onClick={handleAddToCart}
        disabled={loading}
        className="flex-1"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
        {loading && <span className="sr-only">Loading...</span>}
      </Button>
    </div>
  );
}

// Import needed for the AddToCartButton
import { useState } from "react";