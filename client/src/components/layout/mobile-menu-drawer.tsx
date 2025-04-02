import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  ShoppingCart,
  User,
  Heart,
  Search,
  ChevronRight,
  Settings,
  Leaf
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import LanguageSelector from "@/components/ui/language-selector";

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
  showSearchBar = true,
  onSearch,
  cartCount = 0,
  onCartClick,
  className = "",
}: MobileMenuProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Default nav items if none provided
  const defaultNavItems = [
    { label: t('nav.home'), href: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { label: t('nav.shop'), href: "/shop", icon: <ShoppingBag className="h-4 w-4 mr-2" /> },
    { label: t('nav.favorites'), href: "/favorites", icon: <Heart className="h-4 w-4 mr-2" /> },
  ];

  const displayNavItems = navItems.length > 0 ? navItems : defaultNavItems;

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
      setIsOpen(false);
    }
  };

  const isActive = (href: string) => {
    return location === href || (href !== "/" && location.startsWith(href));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={className}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex flex-col overflow-auto">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center">
              <Leaf className="h-5 w-5 text-primary mr-2" />
              <span className="font-bold text-lg">{t('app.title', 'Nature Breed Farm')}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {showSearchBar && (
            <div className="py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="search" 
                  placeholder={t('common.search', 'Search...')} 
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex-1 py-4">
            <nav className="space-y-1">
              {displayNavItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <a className={`flex items-center py-2 px-3 rounded-md text-sm font-medium ${
                    isActive(item.href) 
                      ? "bg-primary/10 text-primary" 
                      : "text-foreground hover:bg-muted/50"
                  }`}>
                    {item.icon}
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <Separator className="my-2" />

          <div className="py-4">
            <h3 className="px-3 text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              {t('account.title', 'Account')}
            </h3>
            <nav className="space-y-1">
              {user ? (
                <>
                  <Link 
                    href="/account" 
                    onClick={() => setIsOpen(false)}
                  >
                    <a className="flex items-center py-2 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted/50">
                      <User className="h-4 w-4 mr-2" />
                      {t('account.profile', 'My Profile')}
                    </a>
                  </Link>
                  <Link 
                    href="/orders" 
                    onClick={() => setIsOpen(false)}
                  >
                    <a className="flex items-center py-2 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted/50">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      {t('account.orders', 'My Orders')}
                    </a>
                  </Link>
                  <button 
                    className="w-full flex items-center py-2 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted/50"
                    onClick={handleLogout}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {t('auth.logout', 'Logout')}
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth" 
                  onClick={() => setIsOpen(false)}
                >
                  <a className="flex items-center py-2 px-3 rounded-md text-sm font-medium text-foreground hover:bg-muted/50">
                    <User className="h-4 w-4 mr-2" />
                    {t('auth.loginOrRegister', 'Login / Register')}
                  </a>
                </Link>
              )}
            </nav>
          </div>
          
          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            {showLanguageSelector && (
              <div className="flex items-center">
                <LanguageSelector />
              </div>
            )}
            
            {showThemeToggle && <ThemeToggle />}
            
            {onCartClick && (
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => {
                  onCartClick();
                  setIsOpen(false);
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}