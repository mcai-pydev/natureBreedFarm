import { useMutation } from "@tanstack/react-query";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  Link as LinkIcon 
} from "lucide-react";
import { SiWhatsapp, SiPinterest } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialShareProps {
  product: Product;
  className?: string;
}

export function SocialShare({ product, className }: SocialShareProps) {
  const { toast } = useToast();
  
  const shareMutation = useMutation({
    mutationFn: async ({ productId, platform }: { productId: number; platform: string }) => {
      const res = await apiRequest("POST", `/api/products/${productId}/share`, { platform });
      return await res.json();
    },
    onError: (error: Error) => {
      console.error("Failed to record share:", error);
    }
  });
  
  const handleShare = (platform: string) => {
    let shareUrl = "";
    const productUrl = `${window.location.origin}/shop?product=${product.id}`;
    const message = `Check out ${product.name} from Nature Breed Farm!`;
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`;
        break;
      case "pinterest":
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&description=${encodeURIComponent(message)}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + productUrl)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(productUrl).then(() => {
          toast({
            title: "Link copied!",
            description: "Product link copied to clipboard",
          });
        });
        break;
    }
    
    // Record the share
    if (platform !== 'copy') {
      window.open(shareUrl, '_blank');
    }
    
    shareMutation.mutate({ productId: product.id, platform });
  };
  
  return (
    <div className={`flex space-x-2 ${className}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-8 h-8"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Facebook</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-8 h-8"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on Twitter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-8 h-8"
              onClick={() => handleShare("whatsapp")}
            >
              <SiWhatsapp className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share on WhatsApp</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-8 h-8"
              onClick={() => handleShare("copy")}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy Link</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}