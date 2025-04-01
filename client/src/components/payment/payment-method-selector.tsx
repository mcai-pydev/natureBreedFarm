import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Landmark, Phone, Banknote, Coins } from 'lucide-react';
import CryptoPayment from './crypto-payment';

type PaymentMethod = 
  | 'card' 
  | 'bank_transfer' 
  | 'mobile_money' 
  | 'cash_on_delivery' 
  | 'crypto';

interface PaymentMethodSelectorProps {
  amount: number;
  onPaymentComplete: () => void;
  currencyCode?: string;
}

export default function PaymentMethodSelector({ 
  amount, 
  onPaymentComplete,
  currencyCode = 'USD'
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.selectPaymentMethod')}</CardTitle>
          <CardDescription>{t('payment.availableOptions')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="card" id="payment-card" />
              <Label htmlFor="payment-card" className="flex flex-1 items-center gap-2 cursor-pointer">
                <CreditCard className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('payment.creditCard')}</p>
                  <p className="text-sm text-muted-foreground">{t('payment.creditCardDesc')}</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="bank_transfer" id="payment-bank" />
              <Label htmlFor="payment-bank" className="flex flex-1 items-center gap-2 cursor-pointer">
                <Landmark className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('payment.bankTransfer')}</p>
                  <p className="text-sm text-muted-foreground">{t('payment.bankTransferDesc')}</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="mobile_money" id="payment-mobile" />
              <Label htmlFor="payment-mobile" className="flex flex-1 items-center gap-2 cursor-pointer">
                <Phone className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('payment.mobileMoney')}</p>
                  <p className="text-sm text-muted-foreground">{t('payment.mobileMoneyDesc')}</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="cash_on_delivery" id="payment-cash" />
              <Label htmlFor="payment-cash" className="flex flex-1 items-center gap-2 cursor-pointer">
                <Banknote className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('payment.cashOnDelivery')}</p>
                  <p className="text-sm text-muted-foreground">{t('payment.cashOnDeliveryDesc')}</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="crypto" id="payment-crypto" />
              <Label htmlFor="payment-crypto" className="flex flex-1 items-center gap-2 cursor-pointer">
                <Coins className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{t('payment.cryptocurrency')}</p>
                  <p className="text-sm text-muted-foreground">{t('payment.cryptocurrencyDesc')}</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      {paymentMethod === 'crypto' && (
        <CryptoPayment 
          amount={amount} 
          onPaymentComplete={onPaymentComplete}
          currencyCode={currencyCode}
        />
      )}
      
      {/* Here we would render other payment method components based on the selection */}
      {paymentMethod === 'card' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('payment.creditCardPayment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('payment.cardPaymentPlaceholder')}</p>
          </CardContent>
        </Card>
      )}
      
      {paymentMethod === 'bank_transfer' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('payment.bankTransferDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('payment.bankTransferPlaceholder')}</p>
          </CardContent>
        </Card>
      )}
      
      {paymentMethod === 'mobile_money' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('payment.mobileMoneyPayment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('payment.mobileMoneyPlaceholder')}</p>
          </CardContent>
        </Card>
      )}
      
      {paymentMethod === 'cash_on_delivery' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('payment.cashOnDeliveryConfirmation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('payment.cashOnDeliveryPlaceholder')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}