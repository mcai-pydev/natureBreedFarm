import { useState } from "react";
import { Link } from "wouter";
import { 
  ShoppingCart, 
  BarChart2, 
  ShoppingBag, 
  FileText, 
  Settings, 
  Home, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuickLink {
  name: string;
  path: string;
  icon: React.ReactNode;
  description: string;
  roles?: string[];
}

interface QuickLinksProps {
  className?: string;
  variant?: "vertical" | "horizontal";
  expanded?: boolean;
}

export function QuickLinks({
  className = "",
  variant = "vertical",
  expanded: initialExpanded = false,
}: QuickLinksProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Define all quick links
  const allLinks: QuickLink[] = [
    {
      name: "Home",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      description: "Dashboard and overview",
    },
    {
      name: "Shop",
      path: "/shop",
      icon: <ShoppingCart className="h-5 w-5" />,
      description: "Browse and purchase products",
    },
    {
      name: "Products",
      path: "/products",
      icon: <ShoppingBag className="h-5 w-5" />,
      description: "Manage farm products",
      roles: ["admin", "manager"],
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <FileText className="h-5 w-5" />,
      description: "View and manage transactions",
      roles: ["admin", "manager"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart2 className="h-5 w-5" />,
      description: "Analytics and reporting",
      roles: ["admin", "manager"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="h-5 w-5" />,
      description: "Account and app settings",
    },
  ];
  
  // Filter links based on user role
  const filteredLinks = allLinks.filter(link => 
    !link.roles || 
    !user || 
    link.roles.includes(user.role)
  );
  
  // Decide if we should render compact or expanded view
  const shouldRenderExpanded = expanded && !isMobile;
  
  // Vertical layout
  if (variant === "vertical") {
    return (
      <div className={cn(
        "flex flex-col border-r bg-background transition-all", 
        shouldRenderExpanded ? "w-56" : "w-16",
        className
      )}>
        <div className="flex items-center justify-between p-2">
          {shouldRenderExpanded && (
            <span className="text-sm font-medium">Quick Links</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="ml-auto"
          >
            {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        
        <TooltipProvider>
          <nav className="flex flex-col gap-1 p-2">
            {filteredLinks.map((link) => (
              <Tooltip key={link.path} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link href={link.path}>
                    <a className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors",
                      "text-muted-foreground hover:text-foreground",
                      shouldRenderExpanded ? "justify-start" : "justify-center"
                    )}>
                      {link.icon}
                      {shouldRenderExpanded && (
                        <span className="text-sm">{link.name}</span>
                      )}
                    </a>
                  </Link>
                </TooltipTrigger>
                {!shouldRenderExpanded && (
                  <TooltipContent side="right">
                    <div>
                      <p className="font-medium">{link.name}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>
      </div>
    );
  }
  
  // Horizontal layout
  return (
    <div className={cn("border-b bg-background p-2", className)}>
      <TooltipProvider>
        <nav className="flex items-center gap-1">
          {filteredLinks.map((link) => (
            <Tooltip key={link.path}>
              <TooltipTrigger asChild>
                <Link href={link.path}>
                  <a className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted transition-colors",
                    "text-muted-foreground hover:text-foreground"
                  )}>
                    {link.icon}
                    <span className="text-sm hidden md:inline">{link.name}</span>
                  </a>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{link.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>
    </div>
  );
}