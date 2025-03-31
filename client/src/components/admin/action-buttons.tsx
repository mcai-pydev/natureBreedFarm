import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Pencil, 
  Trash2, 
  Copy, 
  Eye, 
  MoreHorizontal, 
  FileDown, 
  FilePlus, 
  FilePen, 
  FileX,
  CheckSquare,
  Square,
  MoreVertical,
  RefreshCw,
  Archive,
  Lock,
  Unlock
} from "lucide-react";

// Edit Button
interface EditButtonProps {
  onClick: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  disabled?: boolean;
  tooltipContent?: string;
}

export function EditButton({
  onClick,
  size = "default",
  variant = "outline",
  showText = true,
  disabled = false,
  tooltipContent = "Edit",
}: EditButtonProps) {
  const buttonContent = (
    <Button size={size} variant={variant} onClick={onClick} disabled={disabled}>
      <Pencil className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
      {showText && "Edit"}
    </Button>
  );

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}

// Delete Button with confirmation
interface DeleteButtonProps {
  onDelete: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  disabled?: boolean;
  tooltipContent?: string;
  alertTitle?: string;
  alertDescription?: string;
  itemName?: string;
}

export function DeleteButton({
  onDelete,
  size = "default",
  variant = "outline",
  showText = true,
  disabled = false,
  tooltipContent = "Delete",
  alertTitle = "Are you sure?",
  alertDescription = "This action cannot be undone.",
  itemName,
}: DeleteButtonProps) {
  const buttonContent = (
    <Button size={size} variant={variant} disabled={disabled} className="text-red-500 hover:text-red-700">
      <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
      {showText && "Delete"}
    </Button>
  );

  const button = !showText ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    buttonContent
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName ? `Are you sure you want to delete "${itemName}"? ` : ""}
            {alertDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// View Button
interface ViewButtonProps {
  onClick: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  disabled?: boolean;
  tooltipContent?: string;
}

export function ViewButton({
  onClick,
  size = "default",
  variant = "outline",
  showText = true,
  disabled = false,
  tooltipContent = "View",
}: ViewButtonProps) {
  const buttonContent = (
    <Button size={size} variant={variant} onClick={onClick} disabled={disabled}>
      <Eye className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
      {showText && "View"}
    </Button>
  );

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}

// Duplicate Button
interface DuplicateButtonProps {
  onClick: () => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  disabled?: boolean;
  tooltipContent?: string;
}

export function DuplicateButton({
  onClick,
  size = "default",
  variant = "outline",
  showText = true,
  disabled = false,
  tooltipContent = "Duplicate",
}: DuplicateButtonProps) {
  const buttonContent = (
    <Button size={size} variant={variant} onClick={onClick} disabled={disabled}>
      <Copy className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
      {showText && "Duplicate"}
    </Button>
  );

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}

// More Actions Menu
interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
}

interface MoreActionsButtonProps {
  actions: ActionMenuItem[];
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  menuTitle?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  tooltipContent?: string;
}

export function MoreActionsButton({
  actions,
  size = "default",
  variant = "outline",
  menuTitle,
  disabled = false,
  orientation = "horizontal",
  tooltipContent = "More Actions",
}: MoreActionsButtonProps) {
  const icon = orientation === "horizontal" ? (
    <MoreHorizontal className="h-4 w-4" />
  ) : (
    <MoreVertical className="h-4 w-4" />
  );

  const buttonContent = (
    <Button size={size} variant={variant} disabled={disabled}>
      {icon}
    </Button>
  );

  const triggerButton = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {menuTitle && (
          <>
            <DropdownMenuLabel>{menuTitle}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.variant === "destructive" ? "text-red-500 focus:text-red-500" : ""}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Batch Action Buttons
export interface BatchActionProps {
  selectedIds: string[] | number[];
  onSelectAll: () => void;
  onSelectNone: () => void;
  onDelete: (ids: string[] | number[]) => void;
  onExport?: (ids: string[] | number[]) => void;
  onArchive?: (ids: string[] | number[]) => void;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (ids: string[] | number[]) => void;
    disabled?: boolean;
  }>;
  totalCount: number;
}

export function BatchActions({
  selectedIds,
  onSelectAll,
  onSelectNone,
  onDelete,
  onExport,
  onArchive,
  customActions = [],
  totalCount,
}: BatchActionProps) {
  const hasSelection = selectedIds.length > 0;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
      <div className="flex items-center gap-2 mr-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSelectAll} 
          className="h-8 px-2"
        >
          <CheckSquare className="h-4 w-4 mr-1" />
          All
        </Button>
        
        {hasSelection && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onSelectNone}
            className="h-8 px-2"
          >
            <Square className="h-4 w-4 mr-1" />
            None
          </Button>
        )}
      </div>
      
      {hasSelection && (
        <>
          <Badge variant="secondary" className="mr-2">
            {selectedIds.length} of {totalCount} selected
          </Badge>
          
          <div className="flex items-center gap-2">
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExport(selectedIds)}
                className="h-8"
              >
                <FileDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            
            {onArchive && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onArchive(selectedIds)}
                className="h-8"
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
            )}
            
            {customActions.map((action, index) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm" 
                onClick={() => action.onClick(selectedIds)}
                disabled={action.disabled}
                className="h-8"
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
            
            <DeleteButton
              size="sm"
              variant="outline"
              onDelete={() => onDelete(selectedIds)}
              showText={true}
              alertTitle="Delete Selected Items"
              alertDescription={`Are you sure you want to delete ${selectedIds.length} selected item${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Toggle Status Button (Active/Inactive, Published/Draft, etc.)
interface ToggleStatusButtonProps {
  isActive: boolean;
  onToggle: () => void;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: "sm" | "default" | "lg";
  disabled?: boolean;
  showIcon?: boolean;
  showStatus?: boolean;
}

export function ToggleStatusButton({
  isActive,
  onToggle,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  size = "default",
  disabled = false,
  showIcon = true,
  showStatus = true,
}: ToggleStatusButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size={size}
      onClick={onToggle}
      disabled={disabled}
      className={isActive ? "bg-green-500 hover:bg-green-600" : ""}
    >
      {showIcon && (isActive ? (
        <Unlock className="h-4 w-4 mr-2" />
      ) : (
        <Lock className="h-4 w-4 mr-2" />
      ))}
      {showStatus && (isActive ? activeLabel : inactiveLabel)}
    </Button>
  );
}

// Create Button
interface CreateButtonProps {
  onClick: () => void;
  label?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

export function CreateButton({
  onClick,
  label = "Create",
  size = "default",
  variant = "default",
  disabled = false,
}: CreateButtonProps) {
  return (
    <Button 
      size={size} 
      variant={variant} 
      onClick={onClick} 
      disabled={disabled}
    >
      <FilePlus className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

// Select All Checkbox for Tables
interface SelectAllCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
}

export function SelectAllCheckbox({
  checked,
  onCheckedChange,
  indeterminate = false,
}: SelectAllCheckboxProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Checkbox
              checked={checked}
              onCheckedChange={onCheckedChange}
              ref={(input) => {
                if (input) {
                  input.indeterminate = indeterminate;
                }
              }}
              aria-label="Select all"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Select all</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Refresh Button
interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  tooltipContent?: string;
}

export function RefreshButton({
  onClick,
  isLoading = false,
  size = "default",
  variant = "outline",
  showText = true,
  tooltipContent = "Refresh",
}: RefreshButtonProps) {
  const buttonContent = (
    <Button size={size} variant={variant} onClick={onClick} disabled={isLoading}>
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} ${showText ? "mr-2" : ""}`} />
      {showText && "Refresh"}
    </Button>
  );

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}