import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, 
  X, 
  Home, 
  ShoppingBag, 
  DollarSign, 
  BarChart, 
  Settings, 
  LogOut,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function MobileMenu() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: ShoppingBag },
    { href: "/transactions", label: "Transactions", icon: DollarSign },
    { href: "/reports", label: "Reports", icon: BarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  return (
    <div className="md:hidden bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Leaf className="h-8 w-8 text-primary" />
          <span className="font-semibold text-lg text-gray-900">FarmManager</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="p-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Leaf className="h-8 w-8 text-primary" />
                <span className="font-semibold text-lg text-gray-900">FarmManager</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      <a className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive 
                          ? "text-primary bg-primary/10" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      )}>
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 text-gray-500 hover:text-gray-700 justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
