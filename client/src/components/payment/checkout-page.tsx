import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PaymentMethodSelector from './payment-method-selector';

interface CheckoutPageProps {
  cartItems?: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  currencyCode?: string;
}

export default function CheckoutPage({ 
  cartItems = [], 
  totalAmount, 
  currencyCode = 'USD' 
}: CheckoutPageProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  const handlePaymentComplete = () => {
    setOrderPlaced(true);
    setCurrentStep('confirmation');
  };
  
  const handleContinueShopping = () => {
    setLocation('/shop');
  };
  
  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">{t('shop.checkout')}</h1>
      
      {!orderPlaced ? (
        <div className="grid gap-8 md:grid-cols-[1fr_400px]">
          <div>
            <Tabs 
              value={currentStep} 
              onValueChange={(value) => setCurrentStep(value as typeof currentStep)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">{t('shop.shippingInfo')}</TabsTrigger>
                <TabsTrigger value="payment">{t('shop.paymentInfo')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('shop.shippingInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">{t('auth.fullNameLabel').split(' ')[0]}</Label>
                        <Input id="first-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">{t('auth.fullNameLabel').split(' ')[1]}</Label>
                        <Input id="last-name" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                      <Input id="email" type="email" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phoneLabel')}</Label>
                      <Input id="phone" type="tel" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('auth.addressLabel')}</Label>
                      <Textarea id="address" rows={3} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setCurrentStep('payment')}
                    >
                      {t('common.next')}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="payment" className="mt-6">
                <PaymentMethodSelector 
                  amount={totalAmount} 
                  onPaymentComplete={handlePaymentComplete}
                  currencyCode={currencyCode}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('shop.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} {currencyCode}
                    </span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between">
                  <span className="font-medium">{t('shop.total')}</span>
                  <span className="font-bold text-lg">
                    {totalAmount.toFixed(2)} {currencyCode}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {t('shop.freeShipping')} 100 {currencyCode}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CheckCircle className="text-green-500 h-16 w-16 mx-auto my-2" />
            <CardTitle className="text-xl">{t('shop.orderSuccess')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>{t('email.order.thankYou')}</p>
            <p className="text-sm text-muted-foreground">
              {t('email.order.support')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleContinueShopping}>
              {t('shop.continueShopping')}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}