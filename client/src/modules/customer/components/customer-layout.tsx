import React, { ReactNode, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { MobileMenuDrawer } from '@/components/layout/mobile-menu-drawer';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useResponsive } from '@/contexts/responsive-context';
import { useTranslation } from 'react-i18next';
import { 
  Home, ShoppingCart, Heart, User, 
  LifeBuoy, Mail, Phone, ExternalLink,
  Search, Instagram, Facebook, Twitter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  TwoColumnLayout 
} from '@/components/layout/responsive-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/brand/logo';

interface CustomerLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
  cartCount?: number;
}

export function CustomerLayout({
  children,
  showFooter = true,
  showHeader = true,
  cartCount = 0,
}: CustomerLayoutProps) {
  const { t } = useTranslation();
  const { isMobile, isTablet } = useResponsive();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };
  
  const handleCartClick = () => {
    navigate('/checkout');
  };
  
  const navItems = [
    { label: t('Home'), href: '/', icon: <Home className="w-5 h-5" /> },
    { label: t('Shop'), href: '/shop', icon: <ShoppingCart className="w-5 h-5" /> },
    { label: t('Favorites'), href: '/favorites', icon: <Heart className="w-5 h-5" /> },
    { label: t('Account'), href: '/auth', icon: <User className="w-5 h-5" /> },
  ];
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      {showHeader && (
        <header className="border-b bg-card">
          <div className="container mx-auto">
            {/* Top header with logo and actions */}
            <div className="py-3 px-4 flex items-center justify-between">
              {/* Logo */}
              <Link href="/">
                <a className="flex items-center gap-2">
                  <Logo />
                  <span className="font-bold text-xl hidden md:block">Nature Breed Farm</span>
                </a>
              </Link>
              
              {/* Desktop Actions */}
              {!isMobile && (
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Input
                      type="text"
                      placeholder={t('Search...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={handleSearch}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ThemeToggle />
                  <LanguageSelector />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="relative"
                    onClick={handleCartClick}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('Cart')}
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                  
                  <Link href="/auth">
                    <Button variant="default" size="sm">
                      {t('Sign In')}
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Mobile menu */}
              {isMobile && (
                <MobileMenuDrawer
                  navItems={navItems}
                  cartCount={cartCount}
                  onCartClick={handleCartClick}
                  showSearchBar={true}
                  onSearch={(query) => navigate(`/shop?search=${encodeURIComponent(query)}`)}
                />
              )}
            </div>
            
            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="hidden md:flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-6">
                  {navItems.map((item, index) => (
                    <Link key={index} href={item.href}>
                      <a className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  ))}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    +234 123 456 7890
                  </span>
                </div>
              </nav>
            )}
          </div>
        </header>
      )}
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && (
        <footer className="bg-muted py-12 mt-auto">
          <div className="container mx-auto px-4">
            <ResponsiveContainer>
              <TwoColumnLayout
                stackOnMobile={true}
                gap="lg"
                leftWidth="w-full md:w-2/5"
                rightWidth="w-full md:w-3/5"
                left={
                  <div className="space-y-6">
                    <Link href="/">
                      <a className="flex items-center gap-2">
                        <Logo size="lg" />
                        <span className="font-bold text-xl">Nature Breed Farm</span>
                      </a>
                    </Link>
                    <p className="text-muted-foreground">
                      {t('Empowering farmers with sustainable solutions for optimal agricultural operations and enhanced productivity.')}
                    </p>
                    <div className="flex gap-4">
                      <Button variant="ghost" size="icon">
                        <Facebook className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Instagram className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Twitter className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                }
                right={
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{t('Shop')}</h3>
                      <ul className="space-y-2">
                        <li><Link href="/shop?category=goat"><a className="hover:underline">{t('Goats')}</a></Link></li>
                        <li><Link href="/shop?category=fish"><a className="hover:underline">{t('Fish')}</a></Link></li>
                        <li><Link href="/shop?category=duck"><a className="hover:underline">{t('Ducks')}</a></Link></li>
                        <li><Link href="/shop?category=chicken"><a className="hover:underline">{t('Chickens')}</a></Link></li>
                        <li><Link href="/shop?category=rabbit"><a className="hover:underline">{t('Rabbits')}</a></Link></li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{t('Company')}</h3>
                      <ul className="space-y-2">
                        <li><Link href="/about"><a className="hover:underline">{t('About Us')}</a></Link></li>
                        <li><Link href="/contact"><a className="hover:underline">{t('Contact')}</a></Link></li>
                        <li><Link href="/blog"><a className="hover:underline">{t('Blog')}</a></Link></li>
                        <li><Link href="/careers"><a className="hover:underline">{t('Careers')}</a></Link></li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{t('Support')}</h3>
                      <ul className="space-y-2">
                        <li><Link href="/help"><a className="hover:underline">{t('Help Center')}</a></Link></li>
                        <li><Link href="/policy/privacy"><a className="hover:underline">{t('Privacy Policy')}</a></Link></li>
                        <li><Link href="/policy/terms"><a className="hover:underline">{t('Terms of Service')}</a></Link></li>
                        <li><Link href="/policy/shipping"><a className="hover:underline">{t('Shipping Policy')}</a></Link></li>
                      </ul>
                    </div>
                  </div>
                }
              />
              
              <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Nature Breed Farm. {t('All rights reserved.')}
                </p>
                <div className="flex gap-4 text-sm">
                  <Link href="/policy/privacy"><a className="hover:underline">{t('Privacy')}</a></Link>
                  <Link href="/policy/terms"><a className="hover:underline">{t('Terms')}</a></Link>
                  <Link href="/sitemap"><a className="hover:underline">{t('Sitemap')}</a></Link>
                </div>
              </div>
            </ResponsiveContainer>
          </div>
        </footer>
      )}
    </div>
  );
}