import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { 
  Truck, 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  ShoppingBag 
} from "lucide-react";

import { useCart, CartItem } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ShippingForm, ShippingFormValues } from "@/components/checkout/shipping-form";
import { PaymentMethodSelector, PaymentMethod } from "@/components/checkout/payment-method-selector";
import { OrderReview } from "@/components/checkout/order-review";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { insertOrderSchema } from "@shared/schema";

// Checkout steps
type CheckoutStep = "shipping" | "payment" | "review";

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isMobile } = useMobile();
  const { cart, clearCart } = useCart();
  
  // Checkout state
  const [activeStep, setActiveStep] = useState<CheckoutStep>("shipping");
  const [shippingInfo, setShippingInfo] = useState<ShippingFormValues | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  
  // Constants for calculations
  const shippingCost = shippingInfo?.shippingMethod === "express" ? 15 : (shippingInfo?.shippingMethod === "pickup" ? 0 : 5);
  const taxRate = 0.05; // 5% tax
  const currency = "USD";

  // Redirect if cart is empty
  if (cart.items.length === 0 && !submittingOrder) {
    setLocation("/shop");
    return null;
  }

  // Handle shipping form submission
  const handleShippingSubmit = (data: ShippingFormValues) => {
    setShippingInfo(data);
    setActiveStep("payment");
  };

  // Handle payment selection
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  // Calculate order totals
  const subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount + (shippingCost || 0);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return await res.json();
    },
    onSuccess: () => {
      setSubmittingOrder(false);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Show success toast
      toast({
        title: t("shop.orderSuccess"),
        description: t("shop.orderSuccessMessage"),
      });
      
      // Redirect to order confirmation
      setLocation("/order-confirmation");
    },
    onError: (error) => {
      setSubmittingOrder(false);
      toast({
        title: t("shop.orderError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle place order
  const handlePlaceOrder = () => {
    if (!shippingInfo) return;

    setSubmittingOrder(true);
    
    // Prepare order items
    const orderItems = cart.items.map((item: CartItem) => ({
      productId: item.id,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.quantity * item.price,
    }));
    
    // Prepare order data
    const orderData = {
      customerName: shippingInfo.customerName,
      customerEmail: shippingInfo.customerEmail,
      customerPhone: shippingInfo.customerPhone || "",
      shippingAddress: shippingInfo.shippingAddress,
      billingAddress: shippingInfo.billingAddress || shippingInfo.shippingAddress,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "processing",
      shippingMethod: shippingInfo.shippingMethod,
      shippingFee: shippingCost,
      subtotal: subtotal,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      orderNotes: shippingInfo.orderNotes || "",
      status: "pending",
      orderItems: orderItems
    };
    
    // Submit order
    try {
      const validatedData = insertOrderSchema.parse(orderData);
      createOrderMutation.mutate({ ...validatedData, orderItems });
    } catch (error: any) {
      setSubmittingOrder(false);
      toast({
        title: t("shop.validationError"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Get step icon
  const getStepIcon = (step: CheckoutStep) => {
    switch (step) {
      case "shipping": return <Truck className="h-5 w-5" />;
      case "payment": return <CreditCard className="h-5 w-5" />;
      case "review": return <CheckCircle className="h-5 w-5" />;
    }
  };

  return (
    <ResponsiveContainer className="py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => setLocation("/shop")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("shop.backToShop")}
        </Button>
        <h1 className="text-2xl font-bold">{t("shop.checkout")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Main checkout content */}
        <div className="md:col-span-2 lg:col-span-3">
          {/* Steps for mobile */}
          {isMobile && (
            <div className="flex justify-between mb-6 border-b pb-4">
              {["shipping", "payment", "review"].map((step, index) => (
                <div 
                  key={step} 
                  className={`flex flex-col items-center ${activeStep === step ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    activeStep === step 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs">{t(`shop.${step}Step`)}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Desktop tabs */}
          {!isMobile && (
            <Tabs value={activeStep} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="shipping"
                  onClick={() => setActiveStep("shipping")}
                  disabled={activeStep === "payment" && !shippingInfo}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  {t("shop.shipping")}
                </TabsTrigger>
                <TabsTrigger 
                  value="payment"
                  onClick={() => shippingInfo && setActiveStep("payment")}
                  disabled={!shippingInfo}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("shop.payment")}
                </TabsTrigger>
                <TabsTrigger 
                  value="review"
                  onClick={() => shippingInfo && setActiveStep("review")}
                  disabled={!shippingInfo}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("shop.review")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          {/* Shipping Info */}
          {activeStep === "shipping" && (
            <div className="space-y-4">
              <ShippingForm 
                onSubmit={handleShippingSubmit}
                defaultValues={shippingInfo || undefined}
              />
              
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    if (shippingInfo) {
                      setActiveStep("payment");
                    }
                  }}
                  className="w-full md:w-auto"
                >
                  {t("shop.continueToPayment")}
                </Button>
              </div>
            </div>
          )}
          
          {/* Payment Method */}
          {activeStep === "payment" && (
            <div className="space-y-4">
              <PaymentMethodSelector 
                selectedMethod={paymentMethod}
                onMethodChange={handlePaymentMethodChange}
                amount={totalAmount}
                currencyCode={currency}
              />
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep("shipping")}
                >
                  {t("shop.backToShipping")}
                </Button>
                <Button
                  onClick={() => setActiveStep("review")}
                >
                  {t("shop.continueToReview")}
                </Button>
              </div>
            </div>
          )}
          
          {/* Order Review */}
          {activeStep === "review" && shippingInfo && (
            <div className="space-y-4">
              <OrderReview 
                cart={cart}
                shippingInfo={shippingInfo}
                paymentMethod={paymentMethod}
                currency={currency}
                shippingCost={shippingCost || 0}
                taxRate={taxRate}
              />
              
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveStep("payment")}
                >
                  {t("shop.backToPayment")}
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={createOrderMutation.isPending}
                  className="gap-2"
                >
                  {createOrderMutation.isPending && (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  )}
                  {t("shop.placeOrder")}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Order Summary Sidebar */}
        <div className="border rounded-lg p-4 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">{t("shop.orderSummary")}</h2>
            <span className="text-sm text-muted-foreground">
              {cart.items.reduce((count: number, item: CartItem) => count + item.quantity, 0)} {t("shop.items")}
            </span>
          </div>
          
          <div className="space-y-3 mb-4 max-h-60 overflow-auto">
            {cart.items.map((item: CartItem) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity, currency)}</p>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shop.subtotal")}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shop.shipping")}</span>
              <span>{shippingCost !== undefined ? formatCurrency(shippingCost, currency) : "--"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("shop.tax")} (5%)</span>
              <span>{formatCurrency(taxAmount, currency)}</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between font-semibold">
            <span>{t("shop.total")}</span>
            <span>{formatCurrency(totalAmount, currency)}</span>
          </div>
          
          {activeStep !== "review" && (
            <Button 
              variant="default" 
              className="w-full mt-4"
              onClick={() => {
                if (activeStep === "shipping" && shippingInfo) {
                  setActiveStep("payment");
                } else if (activeStep === "payment") {
                  setActiveStep("review");
                }
              }}
              disabled={activeStep === "shipping" && !shippingInfo}
            >
              {activeStep === "shipping" 
                ? t("shop.continueToPayment") 
                : t("shop.continueToReview")}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  );
}