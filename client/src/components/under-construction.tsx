import { useEffect } from "react";
import { HardHat, Construction, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface UnderConstructionProps {
  title?: string;
  message?: string;
  returnPath?: string;
  returnLabel?: string;
  showToast?: boolean;
}

export function UnderConstruction({
  title = "Under Construction",
  message = "This feature is currently being developed. Check back soon!",
  returnPath = "/",
  returnLabel = "Return to Dashboard",
  showToast = true,
}: UnderConstructionProps) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    if (showToast) {
      toast({
        title: "Feature in development",
        description: "This section is not yet available.",
        variant: "default",
      });
    }
  }, [showToast, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center">
      <div className="flex items-center justify-center space-x-2 mb-8">
        <HardHat className="h-12 w-12 text-primary" />
        <Construction className="h-16 w-16 text-primary" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
      
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        {message}
      </p>
      
      <div className="grid gap-4">
        <Button
          onClick={() => setLocation(returnPath)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {returnLabel}
        </Button>
      </div>
    </div>
  );
}

export default UnderConstruction;