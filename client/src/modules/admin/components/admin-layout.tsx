import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useResponsive } from '@/contexts/responsive-context';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LanguageSelector } from '@/components/i18n/language-selector';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Receipt, BarChart, Settings, 
  Users, MessageSquare, Book, LifeBuoy, LogOut, Menu, X, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/brand/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AdminLayoutProps {
  children: ReactNode;
}

interface SideNavItem {
  title: string;
  href: string;
  icon: ReactNode;
  badge?: string | number;
  submenu?: Array<{
    title: string;
    href: string;
  }>;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems: SideNavItem[] = [
    {
      title: t('Dashboard'),
      href: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: t('Products'),
      href: '/admin/products',
      icon: <Package className="h-5 w-5" />,
      badge: 3,
    },
    {
      title: t('Transactions'),
      href: '/admin/transactions',
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      title: t('Reports'),
      href: '/admin/reports',
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: t('Customers'),
      href: '/admin/customers',
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: t('Breeding'),
      href: '/admin/breeding',
      icon: <Book className="h-5 w-5" />,
    },
    {
      title: t('Messages'),
      href: '/admin/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 5,
    },
    {
      title: t('Settings'),
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  // Determine if a nav item is active
  const isActive = (href: string) => {
    return location === href || location.startsWith(`${href}/`);
  };
  
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/admin">
          <a className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-xl">Admin</span>
          </a>
        </Link>
      </div>
      
      <Separator />
      
      <div className="flex-1 overflow-auto py-2">
        <nav className="space-y-1 px-2">
          {navItems.map((item, idx) => (
            <Link key={idx} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.badge && (
                  <Badge 
                    variant={isActive(item.href) ? "outline" : "secondary"} 
                    className="ml-auto"
                  >
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <Separator />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarFallback>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.name || t('Admin User')}</div>
            <div className="text-sm text-muted-foreground">{user?.username || 'admin'}</div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {t('Logout')}
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-r bg-card hidden md:block">
          <SidebarContent />
        </aside>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center px-4 sticky top-0 z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              )}
              
              <h1 className="text-lg font-semibold">
                {navItems.find(item => isActive(item.href))?.title || t('Admin')}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  3
                </span>
              </Button>
              
              <ThemeToggle />
              <LanguageSelector />
              
              {!isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 ml-4"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {t('Logout')}
                </Button>
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}