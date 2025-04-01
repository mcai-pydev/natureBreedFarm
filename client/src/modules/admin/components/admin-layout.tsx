import React from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSelector from "@/components/ui/language-selector";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  PawPrint,
  Users,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Mail,
  Menu,
  X,
  Leaf
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // Redirect to auth page if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Navigation items
  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/admin" },
    { icon: <Package className="h-5 w-5" />, label: "Products", href: "/admin/products" },
    { icon: <ShoppingCart className="h-5 w-5" />, label: "Orders", href: "/admin/orders" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Reports", href: "/admin/reports" },
    { icon: <PawPrint className="h-5 w-5" />, label: "Breeding", href: "/admin/breeding" },
    { icon: <Users className="h-5 w-5" />, label: "Customers", href: "/admin/customers" },
    { icon: <Mail className="h-5 w-5" />, label: "Email", href: "/admin/email" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Chat", href: "/admin/chat" },
    { icon: <Settings className="h-5 w-5" />, label: "Settings", href: "/admin/settings" },
  ];

  // Function to determine if a nav item is active
  const isActive = (href: string) => {
    const [location] = useLocation();
    return location === href || 
      (href !== "/admin" && location.startsWith(href));
  };

  // Navigate back to landing page
  const handleBackToLanding = () => {
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-foreground/20" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-card shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <Leaf className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold text-lg">Farm Admin</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-8rem)]">
              <div className="px-3 py-2">
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a 
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.href) 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.label}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
            </ScrollArea>
            
            <div className="absolute bottom-0 w-full p-4 border-t">
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || "Admin"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleBackToLanding}
                >
                  Public Site
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:flex h-full flex-col bg-card border-r transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className={`p-4 flex ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <Leaf className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-lg">Farm Admin</span>
            </div>
          )}
          {sidebarCollapsed && <Leaf className="h-6 w-6 text-primary" />}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={sidebarCollapsed ? "mt-2" : ""}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className={`px-3 py-2 ${sidebarCollapsed ? "flex flex-col items-center" : ""}`}>
            <nav className={`space-y-1 ${sidebarCollapsed ? "w-full" : ""}`}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href) 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
        </ScrollArea>

        <div className={`p-4 border-t ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.role || "Admin"}</p>
              </div>
            </div>
          )}
          <div className={`flex ${sidebarCollapsed ? "flex-col gap-2" : "gap-2"}`}>
            {sidebarCollapsed ? (
              <>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleBackToLanding}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleBackToLanding}
                >
                  Public Site
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background z-10 border-b h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold hidden md:inline-block">
              {useTranslation().t('dashboard.welcome')}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSelector />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}