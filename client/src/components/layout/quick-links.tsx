import { Link } from "wouter";
import { 
  Book, 
  HelpCircle, 
  Phone, 
  Mail, 
  Heart, 
  Truck, 
  RotateCcw, 
  Shield, 
  Store, 
  User,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface QuickLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  onClick?: () => void;
}

function QuickLink({ href, icon, label, className, onClick }: QuickLinkProps) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

interface QuickLinksProps {
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QuickLinks({ 
  variant = "horizontal",
  size = "md",
  className
}: QuickLinksProps) {
  const { user } = useAuth();
  
  const iconSize = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];
  
  const containerClass = variant === "horizontal" 
    ? "flex flex-wrap gap-4 md:gap-6" 
    : "flex flex-col gap-3";
    
  const helpLinks = [
    {
      href: "/policies/terms",
      icon: <Book className={iconSize} />,
      label: "Terms of Service",
    },
    {
      href: "/policies/privacy",
      icon: <Shield className={iconSize} />,
      label: "Privacy Policy",
    },
    {
      href: "/policies/shipping",
      icon: <Truck className={iconSize} />,
      label: "Shipping Policy",
    },
    {
      href: "/policies/returns",
      icon: <RotateCcw className={iconSize} />,
      label: "Returns Policy",
    },
    {
      href: "/help",
      icon: <HelpCircle className={iconSize} />,
      label: "Help & FAQ",
    },
  ];
  
  const contactLinks = [
    {
      href: "tel:+2347012345678",
      icon: <Phone className={iconSize} />,
      label: "+234 701 234 5678",
    },
    {
      href: "mailto:info@naturebreed.farm",
      icon: <Mail className={iconSize} />,
      label: "info@naturebreed.farm",
    },
    {
      href: "/contact",
      icon: <MessageSquare className={iconSize} />,
      label: "Contact Us",
    },
  ];
  
  const shopLinks = [
    {
      href: "/shop",
      icon: <Store className={iconSize} />,
      label: "Shop",
    },
    {
      href: user ? "/account/favorites" : "/auth",
      icon: <Heart className={iconSize} />,
      label: "Favorites",
    },
    {
      href: user ? "/account" : "/auth",
      icon: <User className={iconSize} />,
      label: user ? "My Account" : "Login / Register",
    },
  ];
  
  return (
    <div className={cn(containerClass, className)}>
      <div className={containerClass}>
        {shopLinks.map(link => (
          <QuickLink 
            key={link.label}
            href={link.href}
            icon={link.icon}
            label={link.label}
          />
        ))}
      </div>
      
      <div className={containerClass}>
        {contactLinks.map(link => (
          <QuickLink 
            key={link.label}
            href={link.href}
            icon={link.icon}
            label={link.label}
          />
        ))}
      </div>
      
      <div className={containerClass}>
        {helpLinks.map(link => (
          <QuickLink 
            key={link.label}
            href={link.href}
            icon={link.icon}
            label={link.label}
          />
        ))}
      </div>
    </div>
  );
}