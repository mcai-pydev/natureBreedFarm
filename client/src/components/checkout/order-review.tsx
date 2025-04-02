import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/hooks/use-cart";
import { ShippingFormValues } from "./shipping-form";
import { PaymentMethod } from "./payment-method-selector";

interface OrderReviewProps {
  cart: { items: CartItem[] };
  shippingInfo: ShippingFormValues;
  paymentMethod: PaymentMethod;
  currency?: string;
  shippingCost: number;
  taxRate: number;
}

export function OrderReview({
  cart,
  shippingInfo,
  paymentMethod,
  currency = "USD",
  shippingCost,
  taxRate,
}: OrderReviewProps) {
  const { t } = useTranslation();
  
  // Calculate order summary values
  const subtotal = cart.items.reduce((sum: number, item: CartItem) => sum + (item.quantity * item.price), 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount + shippingCost;

  // Format payment method string for display
  const formatPaymentMethod = (method: PaymentMethod): string => {
    switch (method) {
      case "card": return t("shop.creditCard");
      case "bank_transfer": return t("shop.bankTransfer");
      case "cash_on_delivery": return t("shop.cashOnDelivery");
      case "crypto": return t("shop.cryptocurrency");
      case "mobile_money": return t("shop.mobileMoney");
      default: return method;
    }
  };

  // Format shipping method string for display
  const formatShippingMethod = (method: string): string => {
    switch (method) {
      case "standard": return t("shop.shippingStandard");
      case "express": return t("shop.shippingExpress"); 
      case "pickup": return t("shop.shippingPickup");
      default: return method;
    }
  };

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("shop.orderSummary")}</CardTitle>
            <CardDescription>
              {t("shop.reviewYourOrder")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-2">{t("shop.items")}</h3>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t("shop.quantityX", { quantity: item.quantity })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.quantity * item.price, currency)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price, currency)} {t("shop.each")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Shipping Info */}
              <div>
                <h3 className="font-medium mb-2">{t("shop.shippingInformation")}</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">{t("shop.name")}:</span> {shippingInfo.customerName}</p>
                  <p><span className="font-medium">{t("shop.email")}:</span> {shippingInfo.customerEmail}</p>
                  {shippingInfo.customerPhone && (
                    <p><span className="font-medium">{t("shop.phone")}:</span> {shippingInfo.customerPhone}</p>
                  )}
                  <p><span className="font-medium">{t("shop.address")}:</span></p>
                  <p className="whitespace-pre-line pl-4">{shippingInfo.shippingAddress}</p>
                  <p><span className="font-medium">{t("shop.shippingMethod")}:</span> {formatShippingMethod(shippingInfo.shippingMethod)}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <h3 className="font-medium mb-2">{t("shop.paymentMethod")}</h3>
                <p>{formatPaymentMethod(paymentMethod)}</p>
              </div>

              <Separator />

              {/* Order Notes */}
              {shippingInfo.orderNotes && (
                <>
                  <div>
                    <h3 className="font-medium mb-2">{t("shop.orderNotes")}</h3>
                    <p className="text-sm whitespace-pre-line">{shippingInfo.orderNotes}</p>
                  </div>
                  <Separator />
                </>
              )}

              {/* Order Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">{t("shop.subtotal")}</p>
                  <p>{formatCurrency(subtotal, currency)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">{t("shop.shipping")}</p>
                  <p>{formatCurrency(shippingCost, currency)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">{t("shop.tax")}</p>
                  <p>{formatCurrency(taxAmount, currency)}</p>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <p>{t("shop.total")}</p>
                  <p>{formatCurrency(totalAmount, currency)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}