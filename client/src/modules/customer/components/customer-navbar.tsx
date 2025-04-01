import { useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartSheet from './shop/cart-sheet';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import LanguageSelector from '@/components/ui/language-selector';

interface CustomerNavbarProps {
  onAuthClick?: () => void;
}

export default function CustomerNavbar({ onAuthClick }: CustomerNavbarProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="hidden sm:inline">{t('app.title')}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('common.home')}
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/shop">{t('shop.title')}</Link>
            </Button>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <CartSheet triggerRef={cartButtonRef} />
          
          <Button 
            variant="outline" 
            size="icon"
            className="relative"
            onClick={onAuthClick}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}