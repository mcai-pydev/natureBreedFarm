import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  CreditCard, 
  Landmark, 
  Banknote, 
  Coins, 
  Phone,
  Info,
  CheckCircle2
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type PaymentMethod = 
  | "card"
  | "bank_transfer"
  | "cash_on_delivery"
  | "crypto"
  | "mobile_money";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
  currencyCode?: string;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  amount,
  currencyCode = "USD"
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleChange = (value: string) => {
    onMethodChange(value as PaymentMethod);
    
    // Show success alert briefly when mobile_money or crypto is selected
    if (value === "mobile_money" || value === "crypto") {
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
    } else {
      setShowSuccessAlert(false);
    }
  };

  return (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-6">
        {showSuccessAlert && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {t("shop.paymentMethodSelected")}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{t("shop.selectPaymentMethod")}</CardTitle>
            <CardDescription>
              {t("shop.choosePaymentMethodDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedMethod} 
              onValueChange={handleChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="card" id="payment-card" />
                <Label htmlFor="payment-card" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <CreditCard className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t("shop.creditCard")}</p>
                    <p className="text-sm text-muted-foreground">{t("shop.creditCardDesc")}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="bank_transfer" id="payment-bank" />
                <Label htmlFor="payment-bank" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <Landmark className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t("shop.bankTransfer")}</p>
                    <p className="text-sm text-muted-foreground">{t("shop.bankTransferDesc")}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="mobile_money" id="payment-mobile" />
                <Label htmlFor="payment-mobile" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <Phone className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t("shop.mobileMoney")}</p>
                    <p className="text-sm text-muted-foreground">{t("shop.mobileMoneyDesc")}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="cash_on_delivery" id="payment-cash" />
                <Label htmlFor="payment-cash" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <Banknote className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t("shop.cashOnDelivery")}</p>
                    <p className="text-sm text-muted-foreground">{t("shop.cashOnDeliveryDesc")}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="crypto" id="payment-crypto" />
                <Label htmlFor="payment-crypto" className="flex flex-1 items-center gap-2 cursor-pointer">
                  <Coins className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{t("shop.cryptocurrency")}</p>
                    <p className="text-sm text-muted-foreground">{t("shop.cryptocurrencyDesc")}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment method specific information */}
        {selectedMethod === "mobile_money" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("shop.mobileMoneyInstructions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">{t("shop.mobileMoneySteps")}</div>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>{t("shop.mobileMoneyStep1")}</li>
                  <li>{t("shop.mobileMoneyStep2")}</li>
                  <li>{t("shop.mobileMoneyStep3")}</li>
                  <li>{t("shop.mobileMoneyStep4")}</li>
                </ol>
              </div>
              
              <div className="rounded-md bg-muted p-3 flex items-start space-x-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  {t("shop.mobileMoneyInfo")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedMethod === "crypto" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("shop.cryptoInstructions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">{t("shop.cryptoPaymentSteps")}</div>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>{t("shop.cryptoStep1")}</li>
                  <li>{t("shop.cryptoStep2")}</li>
                  <li>{t("shop.cryptoStep3")}</li>
                </ol>
              </div>
              
              <div className="rounded-md bg-muted p-3 flex items-start space-x-3">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  {t("shop.cryptoInfo")}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}