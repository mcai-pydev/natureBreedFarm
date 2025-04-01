import React from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import LanguageSelector from "@/components/ui/language-selector";
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Leaf,
  Heart,
  ShoppingCart,
  Facebook,
  Twitter,
  Instagram
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CustomerLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function CustomerLayout({ 
  children, 
  showHeader = true,
  showFooter = true
}: CustomerLayoutProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);

  const { t } = useTranslation();
  
  // Navigation items
  const navItems = [
    { label: t('nav.home'), href: "/" },
    { label: t('nav.shop'), href: "/shop" },
    { label: t('nav.about'), href: "/about" },
    { label: t('nav.blog'), href: "/blog" },
    { label: t('nav.contact'), href: "/contact" },
  ];

  // Function to determine if a nav item is active
  const isActive = (href: string) => {
    const [location] = useLocation();
    return location === href || 
      (href !== "/" && location.startsWith(href));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showHeader && (
        <header className="border-b">
          {/* Top Bar */}
          <div className="bg-primary/5 py-2 px-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {useTranslation().t('shop.freeShipping')} <CurrencyDisplay amount={100} />
              </p>
              <div className="flex items-center space-x-4">
                <a href="tel:+1234567890" className="text-xs text-foreground hover:text-primary">
                  {useTranslation().t('shop.callUs')}: (123) 456-7890
                </a>
                <LanguageSelector />
              </div>
            </div>
          </div>
          
          {/* Main Header */}
          <div className="py-4 px-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/">
                  <a className="flex items-center">
                    <Leaf className="h-8 w-8 text-primary mr-2" />
                    <span className="font-bold text-xl hidden sm:inline-block">Nature Breed Farm</span>
                  </a>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-8 items-center">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a className={`text-sm font-medium transition-colors ${
                      isActive(item.href) 
                        ? "text-primary" 
                        : "text-foreground hover:text-primary"
                    }`}>
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Search className="h-5 w-5" />
                </Button>
                
                <Link href="/favorites">
                  <a className="hidden md:flex relative">
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </a>
                </Link>
                
                <Link href="/cart">
                  <a className="relative">
                    <Button variant="ghost" size="icon">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </a>
                </Link>
                
                {user ? (
                  <Link href="/account">
                    <a>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                      </Button>
                    </a>
                  </Link>
                ) : (
                  <Link href="/auth">
                    <a>
                      <Button variant="outline" size="sm" className="hidden md:flex">
                        {useTranslation().t('auth.loginOrRegister')}
                      </Button>
                    </a>
                  </Link>
                )}
                
                {/* Mobile menu button */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-foreground/20" 
                onClick={() => setMobileMenuOpen(false)}
              />
              
              {/* Sidebar */}
              <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background shadow-lg p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Leaf className="h-6 w-6 text-primary mr-2" />
                    <span className="font-bold text-lg">Nature Breed Farm</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="search" 
                      placeholder={t('shop.search')} 
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                
                <nav className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('nav.menu')}</p>
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a 
                          className={`block py-2 text-base font-medium transition-colors ${
                            isActive(item.href) 
                              ? "text-primary" 
                              : "text-foreground hover:text-primary"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('auth.account')}</p>
                    {user ? (
                      <>
                        <Link href="/account">
                          <a 
                            className="block py-2 text-base font-medium text-foreground hover:text-primary"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            My Account
                          </a>
                        </Link>
                        <Link href="/orders">
                          <a 
                            className="block py-2 text-base font-medium text-foreground hover:text-primary"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Orders
                          </a>
                        </Link>
                        <Link href="/favorites">
                          <a 
                            className="block py-2 text-base font-medium text-foreground hover:text-primary"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Favorites
                          </a>
                        </Link>
                        <button 
                          className="block py-2 text-base font-medium text-foreground hover:text-primary w-full text-left"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link href="/auth">
                        <a 
                          className="block py-2 text-base font-medium text-foreground hover:text-primary"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {useTranslation().t('auth.loginOrRegister')}
                        </a>
                      </Link>
                    )}
                  </div>
                </nav>
                
                <div className="mt-8 pt-6 border-t">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">{t('footer.connectWithUs')}</p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-foreground hover:text-primary">
                      <Facebook className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-foreground hover:text-primary">
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a href="#" className="text-foreground hover:text-primary">
                      <Instagram className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-muted text-muted-foreground">
          {/* Main Footer */}
          <div className="max-w-7xl mx-auto py-12 px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Leaf className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-foreground">Nature Breed Farm</span>
              </div>
              <p className="mb-4 text-sm">
                Sustainable farming with a focus on healthy livestock and ethical practices.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2 text-sm">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <a className="hover:text-primary">
                        {item.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('footer.customerService')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary">FAQs</a></li>
                <li><a href="#" className="hover:text-primary">Shipping & Returns</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms & Conditions</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('nav.contact')}</h3>
              <address className="not-italic text-sm space-y-2">
                <p>123 Farm Road, Countryside</p>
                <p>State, Country, 12345</p>
                <p>Phone: (123) 456-7890</p>
                <p>Email: info@naturebreed.farm</p>
              </address>
            </div>
          </div>
          
          {/* Bottom Footer */}
          <div className="border-t border-border">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm mb-4 md:mb-0">
                &copy; {new Date().getFullYear()} Nature Breed Farm. All rights reserved.
              </p>
              <div className="flex space-x-4 text-sm">
                <a href="#" className="hover:text-primary">Privacy Policy</a>
                <a href="#" className="hover:text-primary">Terms of Service</a>
                <a href="#" className="hover:text-primary">Sitemap</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}