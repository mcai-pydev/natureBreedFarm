import { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ProductActionButtonProps extends ButtonProps {
  icon?: React.ReactNode;
  label: string;
  showTooltip?: boolean;
  tooltipContent?: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  onActionComplete?: () => void;
  fullWidth?: boolean;
}

export function ProductActionButton({
  icon,
  label,
  showTooltip = true,
  tooltipContent,
  tooltipSide = "top",
  tooltipAlign = "center",
  isLoading = false,
  loadingText = "Processing...",
  successText = "Success!",
  onActionComplete,
  fullWidth = false,
  className,
  onClick,
  ...props
}: ProductActionButtonProps) {
  const [actionState, setActionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  
  // Reset to idle state after success or error
  const resetState = () => {
    if (actionState === "success" || actionState === "error") {
      setTimeout(() => {
        setActionState("idle");
      }, 2000);
    }
  };
  
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (actionState === "loading") return;
    
    setActionState("loading");
    
    try {
      if (onClick) {
        await Promise.resolve(onClick(e));
      }
      
      setActionState("success");
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      setActionState("error");
      console.error("Action failed:", error);
    }
    
    resetState();
  };
  
  const buttonContent = (
    <>
      {actionState === "loading" ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : actionState === "success" ? (
        successText
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </>
      )}
    </>
  );
  
  const buttonElement = (
    <Button
      className={cn(
        {
          "w-full": fullWidth,
          "bg-green-500 hover:bg-green-600": actionState === "success",
          "bg-red-500 hover:bg-red-600": actionState === "error",
        },
        className
      )}
      onClick={handleClick}
      disabled={isLoading || actionState === "loading"}
      {...props}
    >
      {buttonContent}
    </Button>
  );
  
  if (showTooltip && tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          <TooltipContent side={tooltipSide} align={tooltipAlign}>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return buttonElement;
}