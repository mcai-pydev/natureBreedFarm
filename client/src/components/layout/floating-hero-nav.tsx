import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  ShoppingBag, 
  Package, 
  FileText, 
  BarChart2, 
  FileQuestion,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

export function FloatingHeroNav() {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    { title: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { title: "Shop", path: "/shop", icon: <ShoppingBag className="h-5 w-5" /> },
    { title: "Products", path: "/products", icon: <Package className="h-5 w-5" /> },
    { title: "Transactions", path: "/transactions", icon: <FileText className="h-5 w-5" /> },
    { title: "Reports", path: "/reports", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "AI Assistant", path: "/ai-assistant", icon: <Bot className="h-5 w-5" /> },
    { title: "Policies", path: "/policies", icon: <FileQuestion className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
      <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-1 shadow-2xl animate-slideUpAndFadeIn">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full text-white hover:bg-white/30 hover:text-white gap-2 transition-all duration-300",
                location === item.path 
                  ? "bg-primary/70 text-white font-medium shadow-inner shadow-white/10" 
                  : "bg-transparent"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                location === item.path ? "scale-110" : ""
              )}>
                {item.icon}
              </span>
              <span>{item.title}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Mobile version with just icons, shown at the bottom of the screen on small devices
export function FloatingHeroNavMobile() {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    { title: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { title: "Shop", path: "/shop", icon: <ShoppingBag className="h-5 w-5" /> },
    { title: "Products", path: "/products", icon: <Package className="h-5 w-5" /> },
    { title: "Transactions", path: "/transactions", icon: <FileText className="h-5 w-5" /> },
    { title: "Reports", path: "/reports", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "AI Assistant", path: "/ai-assistant", icon: <Bot className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden w-[90%] max-w-md">
      <div className="bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-2 py-2 flex items-center justify-between shadow-2xl animate-slideUpAndFadeIn">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full text-white hover:bg-white/30 hover:text-white w-12 h-12 relative",
                location === item.path 
                  ? "bg-primary/70 text-white shadow-inner shadow-white/10" 
                  : "bg-transparent",
                "transition-all duration-300 ease-in-out"
              )}
              title={item.title}
            >
              <span className={cn(
                "transition-transform duration-300 ease-out",
                location === item.path ? "scale-125" : ""
              )}>
                {item.icon}
              </span>
              
              {location === item.path && (
                <span className="absolute -bottom-6 text-[10px] font-medium text-white/90 animate-fadeIn">
                  {item.title}
                </span>
              )}
              
              {location === item.path && (
                <span className="absolute inset-0 rounded-full bg-white/10 animate-pulse ring-2 ring-white/20"></span>
              )}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}