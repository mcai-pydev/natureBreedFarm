import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Menu, X, Home, ShoppingBag, Package, FileText, BarChart2, Bot, Settings, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NavigationBar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { title: "Dashboard", path: "/", icon: <Home className="h-5 w-5 mr-2" /> },
    { title: "Shop", path: "/shop", icon: <ShoppingBag className="h-5 w-5 mr-2" /> },
    { title: "Products", path: "/products", icon: <Package className="h-5 w-5 mr-2" /> },
    { title: "Transactions", path: "/transactions", icon: <FileText className="h-5 w-5 mr-2" /> },
    { title: "Reports", path: "/reports", icon: <BarChart2 className="h-5 w-5 mr-2" /> },
    { title: "AI Assistant", path: "/ai-assistant", icon: <Bot className="h-5 w-5 mr-2" /> },
    { title: "Rabbit Breeding", path: "/rabbit-breeding", icon: <Rabbit className="h-5 w-5 mr-2" /> },
    { title: "Settings", path: "/settings", icon: <Settings className="h-5 w-5 mr-2" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const userInitials = user ? (user.username || "U").substring(0, 2).toUpperCase() : "G";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className="font-bold text-xl text-primary">Nature Breed Farm</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className={cn(
                  "text-sm",
                  location === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          {/* User menu for desktop */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <div className="w-full cursor-pointer">Settings</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button>Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm md:hidden">
          <nav className="container mx-auto px-4 py-6 flex flex-col space-y-3">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={location === item.path ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start text-base",
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={closeMenu}
                >
                  {item.icon}
                  {item.title}
                </Button>
              </Link>
            ))}

            {/* User section in mobile menu */}
            <div className="pt-4 border-t">
              {user ? (
                <>
                  <div className="flex items-center gap-2 mb-4 px-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.username}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/auth">
                  <Button className="w-full" onClick={closeMenu}>
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}