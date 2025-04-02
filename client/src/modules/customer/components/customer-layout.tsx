import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useResponsive } from '@/contexts/responsive-context';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { ResponsiveContainer } from '@/components/layout/responsive-container';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/brand/logo';
import {
  Home,
  ShoppingBag,
  Phone,
  Info,
  LogIn,
  Menu,
  X,
  Search,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface CustomerLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function CustomerLayout({ children, hideFooter = false }: CustomerLayoutProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems: NavItem[] = [
    {
      title: t('Home'),
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: t('Shop'),
      href: '/shop',
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: t('About'),
      href: '/about',
      icon: <Info className="h-5 w-5" />,
    },
    {
      title: t('Contact'),
      href: '/contact',
      icon: <Phone className="h-5 w-5" />,
    },
  ];
  
  // Determine if a nav item is active
  const isActive = (href: string) => {
    return location === href || location.startsWith(`${href}/`);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-background shadow-sm">
        <div className="relative border-b">
          <ResponsiveContainer fullWidth className="flex h-16 items-center justify-between">
            {/* Left side: Logo */}
            <div className="flex items-center gap-2">
              <Link href="/">
                <a className="flex items-center gap-2">
                  <Logo size={isMobile ? 'sm' : 'md'} showText={!isMobile} />
                </a>
              </Link>
            </div>
            
            {/* Center: Desktop navigation */}
            {!isMobile && (
              <nav className="mx-4 hidden md:flex space-x-4 lg:space-x-6">
                {navItems.map((item, i) => (
                  <Link key={i} href={item.href}>
                    <a
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        isActive(item.href)
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </a>
                  </Link>
                ))}
              </nav>
            )}
            
            {/* Right side: Cart, Theme, Languages, Login */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  3
                </Badge>
              </Button>
              
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              
              <ThemeToggle />
              <LanguageSelector />
              
              {!user ? (
                <Button asChild variant="outline" size="sm" className="ml-4 hidden md:flex">
                  <Link href="/auth">
                    <a className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      {t('Login')}
                    </a>
                  </Link>
                </Button>
              ) : (
                <Avatar className="ml-2">
                  <AvatarFallback>
                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}
                  </AvatarFallback>
                </Avatar>
              )}
              
              {/* Mobile menu button */}
              {isMobile && (
                <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader className="mb-4">
                      <SheetTitle>{t('Menu')}</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col space-y-3">
                      {navItems.map((item, i) => (
                        <SheetClose key={i} asChild>
                          <Link href={item.href}>
                            <a
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md",
                                isActive(item.href)
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted"
                              )}
                            >
                              {item.icon}
                              {item.title}
                            </a>
                          </Link>
                        </SheetClose>
                      ))}
                      
                      <Separator />
                      
                      {!user ? (
                        <SheetClose asChild>
                          <Link href="/auth">
                            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted">
                              <LogIn className="h-5 w-5" />
                              {t('Login / Register')}
                            </a>
                          </Link>
                        </SheetClose>
                      ) : (
                        <div className="flex items-center gap-3 px-3 py-2">
                          <Avatar>
                            <AvatarFallback>
                              {user.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.username}</span>
                          </div>
                        </div>
                      )}
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </ResponsiveContainer>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      {!hideFooter && (
        <footer className="border-t bg-muted/40">
          <ResponsiveContainer className="py-8 md:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <Logo size="md" />
                <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                  {t('Nature Breed Farm provides sustainable farming solutions and high-quality livestock for farmers worldwide.')}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">{t('Quick Links')}</h3>
                <ul className="space-y-2 text-sm">
                  {navItems.map((item, i) => (
                    <li key={i}>
                      <Link href={item.href}>
                        <a className="text-muted-foreground hover:text-foreground transition-colors">
                          {item.title}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">{t('Our Products')}</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/shop/goats">
                      <a className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('Goats')}
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/fish">
                      <a className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('Fish')}
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/ducks">
                      <a className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('Ducks')}
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/chickens">
                      <a className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('Chickens')}
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/rabbits">
                      <a className="text-muted-foreground hover:text-foreground transition-colors">
                        {t('Rabbits')}
                      </a>
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">{t('Contact')}</h3>
                <address className="not-italic text-sm text-muted-foreground space-y-2">
                  <p>123 Farm Lane</p>
                  <p>Agriculture District</p>
                  <p>contact@naturebreed.com</p>
                  <p>+234 123 456 7890</p>
                </address>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Nature Breed Farm. {t('All rights reserved.')}
              </p>
              
              <div className="flex items-center gap-2">
                <ThemeToggle size="sm" />
                <LanguageSelector size="sm" />
              </div>
            </div>
          </ResponsiveContainer>
        </footer>
      )}
    </div>
  );
}