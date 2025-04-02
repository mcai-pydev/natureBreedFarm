import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  onChange?: (isOpen: boolean) => void;
}

export function CollapsibleSection({
  title,
  children,
  className,
  headerClassName,
  contentClassName,
  defaultOpen = false,
  icon,
  badge,
  onChange
}: CollapsibleSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const toggleSection = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onChange?.(newState);
  };
  
  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <button
        type="button"
        onClick={toggleSection}
        className={cn(
          "flex items-center justify-between w-full p-4",
          "text-left bg-card hover:bg-muted/50 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="font-medium text-base">{t(title)}</span>
          {badge && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 ml-2 text-xs font-medium rounded-full bg-muted text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn("p-4 bg-card", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface CollapsibleGroupProps {
  children: ReactNode;
  className?: string;
  accordion?: boolean;
}

export function CollapsibleGroup({
  children,
  className,
  accordion = false
}: CollapsibleGroupProps) {
  const [openSections, setOpenSections] = useState<number[]>([]);
  
  // Clone the children with additional props
  const items = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }
    
    // Only apply to CollapsibleSection components
    if (child.type === CollapsibleSection) {
      return React.cloneElement(child, {
        onChange: (isOpen: boolean) => {
          if (accordion) {
            // In accordion mode, only one section can be open at a time
            setOpenSections(isOpen ? [index] : []);
          } else {
            // In default mode, multiple sections can be open
            setOpenSections(prevOpenSections => {
              if (isOpen) {
                return [...prevOpenSections, index];
              } else {
                return prevOpenSections.filter(i => i !== index);
              }
            });
          }
          
          // Call the original onChange if it exists
          if (child.props.onChange) {
            child.props.onChange(isOpen);
          }
        },
        defaultOpen: openSections.includes(index)
      });
    }
    
    return child;
  });
  
  return (
    <div className={cn("space-y-2", className)}>
      {items}
    </div>
  );
}