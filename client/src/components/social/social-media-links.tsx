import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link as LinkIcon,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface ShareButtonsProps {
  url?: string;
  title?: string;
  description?: string;
  showLabel?: boolean;
}

// Export both SocialMediaLinks (for backward compatibility) and ShareButtons
export function SocialMediaLinks(props: ShareButtonsProps) {
  return <ShareButtons {...props} />;
}

export function ShareButtons({
  url = window.location.href,
  title = "Nature Breed Farm",
  description = "Check out Nature Breed Farm for fresh farm products!",
  showLabel = false
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  
  const shareLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#1877F2] hover:bg-[#1877F2]/90"
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" />,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "bg-[#1DA1F2] hover:bg-[#1DA1F2]/90"
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: "bg-[#0A66C2] hover:bg-[#0A66C2]/90"
    },
    {
      name: "WhatsApp",
      icon: <SiWhatsapp className="h-4 w-4" />,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      color: "bg-[#25D366] hover:bg-[#25D366]/90"
    },
    {
      name: "Email",
      icon: <Mail className="h-4 w-4" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      color: "bg-gray-600 hover:bg-gray-600/90"
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Link has been copied to your clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shareLinks.map((link) => (
        <Button
          key={link.name}
          variant="default"
          size="sm"
          className={`${link.color} ${showLabel ? "" : "w-9 p-0"} rounded-full`}
          onClick={() => {
            window.open(link.url, "_blank", "noopener,noreferrer");
          }}
        >
          {link.icon}
          {showLabel && <span className="ml-2">{link.name}</span>}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        className={`${showLabel ? "" : "w-9 p-0"} rounded-full`}
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {showLabel && <span className="ml-2">Copy Link</span>}
      </Button>
    </div>
  );
}