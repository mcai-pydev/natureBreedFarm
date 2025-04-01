import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '../components/customer-layout';
import CheckoutPage from '@/components/payment/checkout-page';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// In a real app, this would come from a global cart state or API
const mockCartItems: CartItem[] = [
  { id: 1, name: 'Farm Fresh Eggs', price: 5.99, quantity: 2 },
  { id: 2, name: 'Organic Vegetables', price: 12.50, quantity: 1 },
  { id: 3, name: 'Rabbit Meat', price: 15.99, quantity: 1 }
];

export default function CustomerCheckoutPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // In a real app, these would come from a user preferences or location detection
  const currencyCode = 'USD';
  
  useEffect(() => {
    // In a real app, this would fetch cart items from API or state management
    setCartItems(mockCartItems);
    
    // Calculate total
    const total = mockCartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    setTotalAmount(total);
  }, []);
  
  return (
    <CustomerLayout>
      <div className="container py-4">
        <Button 
          variant="ghost" 
          className="mb-4 flex items-center gap-1"
          onClick={() => setLocation('/shop')}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('shop.continueShopping')}
        </Button>
        
        <CheckoutPage 
          cartItems={cartItems}
          totalAmount={totalAmount}
          currencyCode={currencyCode}
        />
      </div>
    </CustomerLayout>
  );
}