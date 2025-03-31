import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Camera, Download, Copy, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareButtons } from "@/components/social/social-media-links";

interface ScreenshotToolProps {
  targetSelector?: string;
  filename?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  showTooltip?: boolean;
  tooltipText?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ScreenshotTool({
  targetSelector = "body",
  filename = "screenshot.png",
  buttonVariant = "outline",
  buttonSize = "icon",
  showTooltip = true,
  tooltipText = "Take Screenshot",
  showLabel = false,
  label = "Screenshot",
  className = "",
}: ScreenshotToolProps) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);

      // Find the target element to capture
      const targetElement = 
        targetSelector === "body" 
          ? document.body 
          : document.querySelector(targetSelector);

      if (!targetElement) {
        throw new Error(`Target element not found: ${targetSelector}`);
      }

      // Take screenshot
      const canvas = await html2canvas(targetElement as HTMLElement, {
        allowTaint: true,
        useCORS: true,
        scale: 2, // Better quality
        logging: false,
        backgroundColor: null,
      });

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotUrl(dataUrl);
      setIsOpen(true);
      
      toast({
        title: "Screenshot captured",
        description: "Your screenshot is ready to download or share",
      });
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      toast({
        variant: "destructive",
        title: "Screenshot failed",
        description: "There was a problem capturing the screenshot",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadScreenshot = () => {
    if (!screenshotUrl || !downloadLinkRef.current) return;
    
    downloadLinkRef.current.href = screenshotUrl;
    downloadLinkRef.current.download = filename;
    downloadLinkRef.current.click();
  };

  const copyToClipboard = async () => {
    if (!screenshotUrl) return;
    
    try {
      const blob = await fetch(screenshotUrl).then(r => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      
      toast({
        title: "Copied to clipboard",
        description: "Screenshot copied to clipboard successfully",
      });
    } catch (error) {
      console.error("Failed to copy screenshot:", error);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy screenshot to clipboard",
      });
    }
  };

  const button = (
    <Button 
      variant={buttonVariant} 
      size={buttonSize} 
      className={className}
      onClick={captureScreenshot}
      disabled={isCapturing}
    >
      <Camera className={`h-4 w-4 ${isCapturing ? "animate-pulse" : ""} ${showLabel ? "mr-2" : ""}`} />
      {showLabel && label}
      {isCapturing && <span className="sr-only">Capturing...</span>}
    </Button>
  );

  return (
    <>
      {showTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Screenshot Preview</DialogTitle>
            <DialogDescription>
              You can download, copy, or share this screenshot
            </DialogDescription>
          </DialogHeader>
          
          {screenshotUrl && (
            <div className="border rounded-md overflow-hidden max-h-[calc(80vh-200px)] overflow-y-auto">
              <img 
                src={screenshotUrl} 
                alt="Screenshot" 
                className="w-full h-auto"
              />
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 items-center justify-between">
            <ShareButtons 
              url={screenshotUrl || ""} 
              title="Check out this screenshot" 
              description="Screenshot taken from Nature Breed Farm application"
              compact
            />
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={downloadScreenshot}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden download link */}
      <a ref={downloadLinkRef} className="hidden" />
    </>
  );
}