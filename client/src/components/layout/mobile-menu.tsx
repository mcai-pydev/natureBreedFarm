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
  Leaf,
  Wheat,
  ShoppingCart
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
    { href: "/shop", label: "Shop", icon: ShoppingCart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  return (
    <div className="md:hidden bg-white border-b border-green-100 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <Wheat className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold text-lg text-gray-900">Nature Breed</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="p-2 text-primary hover:bg-primary/10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-green-100">
            <div className="p-5 border-b border-green-100 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Wheat className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold text-lg text-gray-900">Nature Breed</span>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-b from-green-50 to-white h-full">
              <div className="flex items-center p-3 mb-6 bg-white rounded-lg border border-green-100">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-primary/80">{user?.role}</p>
                </div>
              </div>
              
              <nav className="space-y-1.5">
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
                        "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all",
                        isActive 
                          ? "text-white bg-primary shadow-sm" 
                          : "text-gray-700 hover:bg-primary/10 hover:text-primary"
                      )}>
                        <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-white" : "text-primary")} />
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6 border-green-200 text-primary hover:text-white hover:bg-primary justify-start"
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
