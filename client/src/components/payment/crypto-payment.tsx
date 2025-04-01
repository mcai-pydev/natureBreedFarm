import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bitcoin, Coins, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code'; // We'll need to install this
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Placeholder wallet addresses - in a real app these would come from an API or config
const CRYPTO_WALLETS = {
  BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ETH: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  USDT: 'TKFLguUqRJzkJpvN5D7NkstzCTBnkJJ78N',
  BNB: 'bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
};

interface CryptoPaymentProps {
  amount: number;
  onPaymentComplete: () => void;
  currencyCode?: string;
}

export default function CryptoPayment({ 
  amount, 
  onPaymentComplete,
  currencyCode = 'USD'
}: CryptoPaymentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'completed'>('pending');
  const [copied, setCopied] = useState(false);
  
  // Convert amount to crypto (this would normally be done via an API)
  const cryptoAmount = {
    BTC: (amount / 65000).toFixed(8), // Rough conversion
    ETH: (amount / 3500).toFixed(6),
    USDT: amount.toFixed(2),
    BNB: (amount / 600).toFixed(6),
    USDC: amount.toFixed(2)
  };
  
  const walletAddress = CRYPTO_WALLETS[selectedCrypto as keyof typeof CRYPTO_WALLETS];
  
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: t('payment.addressCopied'),
      description: t('payment.pasteInWallet'),
    });
  };
  
  const simulatePaymentVerification = () => {
    setPaymentStatus('verifying');
    
    // Simulate verification process
    setTimeout(() => {
      setPaymentStatus('completed');
      toast({
        title: t('payment.paymentConfirmed'),
        description: t('payment.orderProcessing'),
      });
      onPaymentComplete();
    }, 3000);
  };
  
  const getCryptoIcon = (crypto: string) => {
    switch(crypto) {
      case 'BTC':
        return <Bitcoin className="h-5 w-5" />;
      default:
        return <Coins className="h-5 w-5" />;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {t('payment.cryptoPayment')}
        </CardTitle>
        <CardDescription>
          {t('payment.chooseCrypto')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">{t('payment.scanQR')}</TabsTrigger>
            <TabsTrigger value="copy">{t('payment.copyAddress')}</TabsTrigger>
          </TabsList>
          
          <div className="my-4">
            <Label>{t('payment.selectCrypto')}</Label>
            <RadioGroup
              value={selectedCrypto}
              onValueChange={setSelectedCrypto}
              className="grid grid-cols-2 gap-2 mt-2"
            >
              {Object.keys(CRYPTO_WALLETS).map((crypto) => (
                <div key={crypto} className="flex items-center space-x-2">
                  <RadioGroupItem value={crypto} id={crypto} />
                  <Label htmlFor={crypto} className="flex items-center gap-1">
                    {getCryptoIcon(crypto)}
                    {crypto}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="text-center my-4">
            <p className="text-lg font-semibold">
              {cryptoAmount[selectedCrypto as keyof typeof cryptoAmount]} {selectedCrypto}
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {amount.toFixed(2)} {currencyCode}
            </p>
          </div>
          
          <TabsContent value="scan" className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-lg mb-3">
              <QRCode 
                value={walletAddress}
                size={200}
                className="max-w-full"
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {t('payment.scanInstructions')}
            </p>
          </TabsContent>
          
          <TabsContent value="copy">
            <div className="space-y-2">
              <Label htmlFor="wallet-address">{t('payment.walletAddress')}</Label>
              <div className="flex">
                <Input
                  id="wallet-address"
                  value={walletAddress}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAddress}
                  className="ml-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('payment.copyInstructions')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {paymentStatus === 'verifying' && (
          <div className="mt-4 text-center">
            <div className="animate-pulse">
              {t('payment.verifyingPayment')}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <Button 
          className="w-full" 
          onClick={simulatePaymentVerification}
          disabled={paymentStatus !== 'pending'}
        >
          {paymentStatus === 'pending' ? t('payment.iHavePaid') : 
           paymentStatus === 'verifying' ? t('payment.verifying') : 
           t('payment.completed')}
        </Button>
        
        <p className="text-sm text-center text-muted-foreground mt-4">
          {t('payment.secureTransaction')}
        </p>
      </CardFooter>
    </Card>
  );
}