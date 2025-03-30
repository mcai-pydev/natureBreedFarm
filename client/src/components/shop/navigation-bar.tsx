import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, Search, ShoppingCart, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

interface NavigationBarProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function NavigationBar({ 
  cartItemsCount, 
  onCartClick, 
  onSearchChange,
  searchQuery
}: NavigationBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Products", href: "/products" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];
  
  return (
    <div className="bg-white shadow-sm border-b border-green-100">
      <div className="container mx-auto py-4 px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="text-2xl font-bold text-primary flex items-center">
              <span className="text-green-600">🌱</span>
              <span className="ml-2">Nature Breed Farm</span>
            </a>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <a className="text-gray-600 hover:text-primary">{link.name}</a>
              </Link>
            ))}
          </div>
          
          {/* Search and Cart */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 w-[250px]"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-white">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
            
            {user ? (
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-lg font-bold text-primary">Menu</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-4"
                        value={searchQuery}
                        onChange={(e) => {
                          onSearchChange(e.target.value);
                          // Don't close menu on search
                        }}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      {navLinks.map((link) => (
                        <Link key={link.name} href={link.href}>
                          <a 
                            className="block py-2 text-gray-600 hover:text-primary" 
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.name}
                          </a>
                        </Link>
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-gray-100">
                      {user ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.role}</p>
                          </div>
                          <Link href="/settings">
                            <Button variant="outline" size="sm" onClick={() => setMobileMenuOpen(false)}>
                              Settings
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Link href="/auth">
                            <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                              Sign In
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}