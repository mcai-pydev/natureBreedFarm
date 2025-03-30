import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  ShoppingBag, 
  DollarSign, 
  BarChart, 
  Settings, 
  LogOut,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: ShoppingBag },
    { href: "/transactions", label: "Transactions", icon: DollarSign },
    { href: "/reports", label: "Reports", icon: BarChart },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Leaf className="h-8 w-8 text-primary" />
          <span className="font-semibold text-lg text-gray-900">FarmManager</span>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
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
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4 text-gray-500 hover:text-gray-700"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
