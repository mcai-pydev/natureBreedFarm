import React, { ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

export interface MobileMenuItem {
  title: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  childItems?: MobileMenuItem[];
}

export interface MobileMenuSection {
  title?: string;
  items: MobileMenuItem[];
}

interface MobileMenuDrawerProps {
  sections: MobileMenuSection[];
  title?: string;
  trigger?: ReactNode;
  footer?: ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  width?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  backButtonLabel?: string;
}

export function MobileMenuDrawer({
  sections,
  title = "Menu",
  trigger,
  footer,
  side = 'left',
  width = "w-[280px]",
  isOpen,
  onOpenChange,
  showBackButton = false,
  onBackClick,
  backButtonLabel = "Back"
}: MobileMenuDrawerProps) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Function to handle link clicks
  const handleLinkClick = (href: string, onClick?: () => void) => {
    // Close the menu
    if (onOpenChange) {
      onOpenChange(false);
    }
    
    // Navigate to the href
    setLocation(href);
    
    // Call the onClick handler if provided
    if (onClick) {
      onClick();
    }
  };
  
  // Function to check if an item is active
  const isActive = (href: string) => {
    return location === href || location.startsWith(`${href}/`);
  };
  
  // Render menu items
  const renderMenuItem = (item: MobileMenuItem) => {
    const active = isActive(item.href);
    const hasChildren = item.childItems && item.childItems.length > 0;
    
    return (
      <div
        key={item.href}
        className={cn(
          "flex items-center px-2 py-2 rounded-md",
          active ? "bg-accent/50" : "hover:bg-accent/20",
          item.disabled && "opacity-50 pointer-events-none"
        )}
      >
        {hasChildren ? (
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setActiveSection(item.title)}
            disabled={item.disabled}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
              <span className={active ? "font-medium" : ""}>{t(item.title)}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <button
            className="flex items-center gap-3 w-full"
            onClick={() => handleLinkClick(item.href, item.onClick)}
            disabled={item.disabled}
          >
            {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
            <span className={active ? "font-medium" : ""}>{t(item.title)}</span>
          </button>
        )}
      </div>
    );
  };
  
  // Render submenu view
  const renderSubMenu = () => {
    if (!activeSection) return null;
    
    const section = sections.find(s => 
      s.items.some(item => item.title === activeSection)
    );
    
    if (!section) return null;
    
    const parentItem = section.items.find(item => item.title === activeSection);
    
    if (!parentItem || !parentItem.childItems) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8"
            onClick={() => setActiveSection(null)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">{t(parentItem.title)}</h3>
        </div>
        
        <div className="space-y-1">
          {parentItem.childItems.map(renderMenuItem)}
        </div>
      </div>
    );
  };
  
  // Render main menu view
  const renderMainMenu = () => {
    return (
      <>
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            {section.title && (
              <h3 className="px-2 text-sm font-medium text-muted-foreground">
                {t(section.title)}
              </h3>
            )}
            
            <div className="space-y-1">
              {section.items.map(renderMenuItem)}
            </div>
            
            {index < sections.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </>
    );
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      
      <SheetContent
        side={side}
        className={cn("p-0", width)}
      >
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 h-8 w-8 p-0"
                onClick={onBackClick}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <SheetTitle className={showBackButton ? "ml-2" : ""}>
              {t(title)}
            </SheetTitle>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-4">
            {activeSection ? renderSubMenu() : renderMainMenu()}
          </div>
        </ScrollArea>
        
        {footer && (
          <div className="p-4 border-t">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}