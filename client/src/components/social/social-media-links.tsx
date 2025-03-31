import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Share2
} from "lucide-react";
import { 
  SiFacebook, 
  SiInstagram, 
  SiYoutube, 
  SiPinterest,
  SiTiktok,
} from "react-icons/si";
// Twitter (X) icon is no longer in react-icons/si, using Lucide's Twitter icon instead

interface SocialMediaLinksProps {
  variant?: "icon" | "text" | "both";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  vertical?: boolean;
  className?: string;
}

export function SocialMediaLinks({
  variant = "icon",
  size = "md",
  showTooltip = true,
  vertical = false,
  className = "",
}: SocialMediaLinksProps) {
  const socialLinks = [
    {
      name: "Facebook",
      url: "https://facebook.com/NatureBreedFarm",
      icon: <SiFacebook />,
    },
    {
      name: "Instagram",
      url: "https://instagram.com/NatureBreedFarm",
      icon: <SiInstagram />,
    },
    {
      name: "Twitter",
      url: "https://twitter.com/NatureBreedFarm",
      icon: <Twitter />,
    },
    {
      name: "YouTube",
      url: "https://youtube.com/NatureBreedFarm",
      icon: <SiYoutube />,
    },
    {
      name: "Pinterest",
      url: "https://pinterest.com/NatureBreedFarm",
      icon: <SiPinterest />,
    },
    {
      name: "TikTok",
      url: "https://tiktok.com/@NatureBreedFarm",
      icon: <SiTiktok />,
    },
  ];

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const iconSize = sizeClasses[size];
  const containerClass = vertical ? "flex flex-col gap-2" : "flex gap-2";

  const renderLink = (link: typeof socialLinks[0]) => {
    const linkContent = (
      <>
        {variant === "icon" || variant === "both" ? (
          <span className={iconSize}>{link.icon}</span>
        ) : null}
        {variant === "text" || variant === "both" ? (
          <span className={variant === "both" ? "ml-2" : ""}>{link.name}</span>
        ) : null}
      </>
    );

    return showTooltip ? (
      <TooltipProvider key={link.name}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="transition-colors hover:text-primary"
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                {linkContent}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Follow us on {link.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <Button
        key={link.name}
        variant="ghost"
        size="sm"
        className="transition-colors hover:text-primary"
        asChild
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center"
        >
          {linkContent}
        </a>
      </Button>
    );
  };

  return (
    <div className={`${containerClass} ${className}`}>
      {socialLinks.map(renderLink)}
    </div>
  );
}

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

export function ShareButtons({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = "Check out Nature Breed Farm",
  description = "A comprehensive farm management platform with amazing products",
  imageUrl,
  showLabel = false,
  compact = false,
  className = "",
}: ShareButtonsProps) {
  const shareLinks = [
    {
      name: "Facebook",
      icon: <SiFacebook className="h-4 w-4" />,
      color: "hover:text-blue-600",
      getUrl: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" />,
      color: "hover:text-blue-400",
      getUrl: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "Pinterest",
      icon: <SiPinterest className="h-4 w-4" />,
      color: "hover:text-red-600",
      getUrl: () => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}&media=${encodeURIComponent(imageUrl || "")}`,
    },
  ];

  // Web Share API handler
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  // Check if Web Share API is available
  const canUseWebShareAPI = typeof navigator !== "undefined" && navigator.share;

  const containerClass = compact ? "inline-flex gap-1" : "flex flex-wrap gap-2";

  return (
    <div className={`${containerClass} ${className}`}>
      {!compact && (
        <div className="flex items-center text-sm font-medium text-gray-500 mr-2">
          {showLabel && "Share:"}
        </div>
      )}

      {shareLinks.map((link) => (
        <TooltipProvider key={link.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`${link.color} ${compact ? "p-1 h-8 w-8" : ""}`}
                asChild
              >
                <a
                  href={link.getUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(link.getUrl(), "_blank", "width=600,height=400");
                    
                    // Also track the share via API
                    try {
                      fetch('/api/products/:id/share', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ platform: link.name.toLowerCase() }),
                      });
                    } catch (error) {
                      console.error("Error tracking share:", error);
                    }
                  }}
                  className="flex items-center justify-center"
                >
                  {link.icon}
                  {!compact && showLabel && (
                    <span className="ml-2">{link.name}</span>
                  )}
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share on {link.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {canUseWebShareAPI && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`hover:text-primary ${compact ? "p-1 h-8 w-8" : ""}`}
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                {!compact && showLabel && <span className="ml-2">More</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share via...</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}