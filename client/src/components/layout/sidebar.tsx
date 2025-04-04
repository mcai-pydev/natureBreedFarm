import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  ShoppingBag, 
  DollarSign, 
  BarChart, 
  Settings, 
  LogOut,
  Leaf,
  Wheat,
  ShoppingCart,
  PawPrint
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
    { href: "/shop", label: "Shop", icon: ShoppingCart },
    { href: "/rabbit-breeding", label: "Rabbit Breeding", icon: PawPrint },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-green-50 to-white border-r border-green-100">
      <div className="p-5 border-b border-green-100 bg-white">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Wheat className="h-7 w-7 text-primary" />
          </div>
          <span className="font-semibold text-xl text-gray-900">Nature Breed</span>
        </div>
      </div>
      
      <nav className="flex-grow p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
            >
              <a className={cn(
                "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive 
                  ? "text-white bg-primary shadow-md" 
                  : "text-gray-700 hover:bg-primary/10 hover:text-primary"
              )}>
                <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-white" : "text-primary")} />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 m-3 border border-green-100 rounded-lg bg-white">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={user?.avatar || ""} alt={user?.name} />
            <AvatarFallback className="bg-primary/10 text-primary">{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-primary/80">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4 border-green-200 text-primary hover:text-white hover:bg-primary"
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
