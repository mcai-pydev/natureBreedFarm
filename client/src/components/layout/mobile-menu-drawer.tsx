import React, { ReactNode, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useResponsive } from '@/contexts/responsive-context';

interface MobileMenuProps {
  navItems?: Array<{
    label: string;
    href: string;
    icon?: ReactNode;
  }>;
  showThemeToggle?: boolean;
  showLanguageSelector?: boolean;
  showSearchBar?: boolean;
  onSearch?: (query: string) => void;
  cartCount?: number;
  onCartClick?: () => void;
  className?: string;
}

export function MobileMenuDrawer({
  navItems = [],
  showThemeToggle = true,
  showLanguageSelector = true,
  showSearchBar = false,
  onSearch,
  cartCount = 0,
  onCartClick,
  className = '',
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile, orientation } = useResponsive();
  
  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Use a smaller width for the menu in portrait orientation on mobile
  const menuWidth = isMobile && orientation === 'portrait' ? 'w-[85vw]' : 'w-[350px]';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Cart button - only show if onCartClick is provided */}
        {onCartClick && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {cartCount}
              </Badge>
            )}
          </Button>
        )}
        
        {/* Menu trigger */}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
      </div>
      
      <SheetContent side="right" className={`p-0 ${menuWidth}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-lg">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search bar */}
          {showSearchBar && (
            <div className="p-4 border-b">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>
          )}
          
          {/* Navigation items */}
          <div className="flex-1 overflow-auto py-2">
            <nav className="space-y-1">
              {navItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <a className="flex items-center gap-3 px-4 py-3 hover:bg-accent rounded-md mx-2 transition-colors duration-200">
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Footer with theme toggle and language selector */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              {showThemeToggle && <ThemeToggle />}
              {showLanguageSelector && <LanguageSelector />}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}