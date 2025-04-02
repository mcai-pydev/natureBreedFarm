import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { CheckCircle, ArrowLeft, Package, Calendar, Truck } from "lucide-react";
import { useEffect, useRef } from "react";
// @ts-ignore - Type definitions missing for canvas-confetti
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { Card, CardContent } from "@/components/ui/card";
import { useMobile } from "@/hooks/use-mobile";

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { isMobile } = useMobile();
  const confettiRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top and trigger confetti animation when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Trigger confetti animation with a slight delay
    const timer = setTimeout(() => {
      if (confettiRef.current) {
        const rect = confettiRef.current.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // First confetti burst (centered)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { 
            x: x / window.innerWidth,
            y: y / window.innerHeight 
          },
          colors: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107'],
          zIndex: 1000
        });
        
        // Second confetti burst with slight delay (wider spread)
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 80,
            origin: { x: 0.2, y: 0.5 },
            colors: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107'],
            zIndex: 1000
          });
          
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 80,
            origin: { x: 0.8, y: 0.5 },
            colors: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107'],
            zIndex: 1000
          });
        }, 300);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ResponsiveContainer className="py-6">
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <div 
          ref={confettiRef}
          className="mb-8 rounded-full bg-green-100 p-4 dark:bg-green-900/20"
        >
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{t("shop.orderConfirmationTitle")}</h1>
        <p className="text-muted-foreground mb-8">
          {t("shop.orderConfirmationDescription")}
        </p>
        
        <Card className="w-full mb-8">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{t("shop.orderProcessing")}</h3>
                  <p className="text-sm text-muted-foreground">{t("shop.orderProcessingDescription")}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{t("shop.estimatedDelivery")}</h3>
                  <p className="text-sm text-muted-foreground">{t("shop.estimatedDeliveryDescription")}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{t("shop.trackingInfo")}</h3>
                  <p className="text-sm text-muted-foreground">{t("shop.trackingInfoDescription")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
          <Button 
            onClick={() => setLocation("/shop")}
            variant="default"
            className="flex-1"
          >
            {t("shop.browseMoreProducts") || "Browse More Products"}
          </Button>
          
          <Button 
            onClick={() => setLocation("/account/orders")}
            variant="outline"
            className="flex-1"
          >
            {t("shop.viewOrders")}
          </Button>
        </div>
      </div>
    </ResponsiveContainer>
  );
}