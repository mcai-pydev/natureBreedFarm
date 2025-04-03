import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  User, 
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";

interface NavigationBarProps {
  cartItemsCount?: number;
  onCartClick?: () => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

export function NavigationBar({
  cartItemsCount = 0,
  onCartClick,
  onSearchChange,
  searchQuery = ""
}: NavigationBarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const { user, logoutMutation } = useAuth();
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local search query when the parent prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Debounced search handler
  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange?.(value);
    }, 300);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navLinks = [
    { title: "Home", path: "/" },
    { title: "Shop", path: "/shop" },
    { title: "Products", path: "/products" },
    { title: "Transactions", path: "/transactions" },
    { title: "Reports", path: "/reports" },
    { title: "Policy", path: "/policies" }
  ];
  
  // Render mobile search view
  if (searchOpen && isMobile) {
    return (
      <div className="w-full bg-background border-b sticky top-0 z-50 flex items-center px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => setSearchOpen(false)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative flex-1">
          <label htmlFor="mobile-search" className="sr-only">
            Search products
          </label>
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="mobile-search"
            type="search"
            placeholder="Search products..."
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 w-full"
            autoFocus
            aria-label="Search products"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-primary font-bold text-xl">Nature Breed Farm</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.path ? "text-primary" : "text-foreground/80"
              }`}
            >
              {link.title}
            </Link>
          ))}
        </div>
        
        {/* Search, Cart, Account (Desktop) */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="relative w-60">
            <label htmlFor="desktop-search" className="sr-only">
              Search products
            </label>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="desktop-search"
              type="search"
              placeholder="Search products..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 w-full"
              aria-label="Search products"
            />
            {localSearchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
            aria-label={`Shopping cart with ${cartItemsCount} items`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartItemsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 px-1 py-px text-[10px] min-w-[16px] h-[16px] flex items-center justify-center"
                aria-hidden="true"
              >
                {cartItemsCount > 99 ? "99+" : cartItemsCount}
              </Badge>
            )}
          </Button>
          
          <div className="relative">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/settings" 
                  className="flex items-center space-x-1"
                >
                  <div className="bg-primary/10 h-9 w-9 rounded-full flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || user.username} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{user.name || user.username}</span>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
              </div>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search products"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={onCartClick}
            aria-label={`Shopping cart with ${cartItemsCount} items`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartItemsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 px-1 py-px text-[10px] min-w-[16px] h-[16px] flex items-center justify-center"
                aria-hidden="true"
              >
                {cartItemsCount > 99 ? "99+" : cartItemsCount}
              </Badge>
            )}
          </Button>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <div id="mobile-menu" className="flex flex-col space-y-6 py-4">
                {user ? (
                  <div className="flex flex-col items-center space-y-3 pb-6 border-b">
                    <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name || user.username} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{user.name || user.username}</div>
                      <div className="text-sm text-muted-foreground">{user.role || "User"}</div>
                    </div>
                    <div className="flex space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href="/settings">Profile</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center pb-6 border-b">
                    <Button asChild>
                      <Link href="/auth">Login / Register</Link>
                    </Button>
                  </div>
                )}
                
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.path}>
                      <Link 
                        href={link.path}
                        className={`flex items-center py-2 px-3 rounded-md ${
                          location === link.path 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-foreground/80 hover:bg-accent"
                        }`}
                      >
                        {link.title}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}