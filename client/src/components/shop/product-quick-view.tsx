import { useState } from "react";
import { Star, ShoppingCart, X } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { QuantitySelector } from "@/components/ui/quantity-selector";

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export function ProductQuickView({
  product,
  open,
  onOpenChange,
  onAddToCart
}: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when product changes
  if (product && quantity > (product.stockQuantity || product.stock)) {
    setQuantity(Math.max(1, product.stockQuantity || product.stock));
  }

  if (!product) return null;

  // Calculate discount percentage if both price and salePrice exist
  const discountPercentage = product.salePrice && product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  // Current price to display (sale price or regular price)
  const currentPrice = product.salePrice && product.salePrice < product.price 
    ? product.salePrice 
    : product.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative h-64 md:h-full bg-primary/5">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl font-semibold text-primary/30">{product.name.substring(0, 2)}</span>
              </div>
            )}
            
            {/* Discount Badge */}
            {discountPercentage && (
              <Badge className="absolute top-4 left-4 bg-orange-500 text-white">
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>
          
          {/* Product Details */}
          <div className="p-6 flex flex-col h-full">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">{product.name}</DialogTitle>
              <DialogDescription className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">
                  {product.category || "General"}
                </Badge>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{product.stockQuantity || product.stock} in stock</span>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                {product.description || `Fresh ${product.name} from Nature Breed Farm.`}
              </p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-2xl font-bold">
                  {formatCurrency(currentPrice)}
                </span>
                {product.salePrice && product.salePrice < product.price && (
                  <span className="ml-2 text-base text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
                <span className="ml-2 text-sm text-muted-foreground">
                  per {product.unit}
                </span>
              </div>
              
              <div className="mb-6">
                <div className="font-medium mb-2">Quantity:</div>
                <QuantitySelector
                  initialValue={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={Math.max(1, product.stockQuantity || product.stock)}
                  disabled={(product.stockQuantity || product.stock) === 0}
                  size="lg"
                />
              </div>
            </div>
            
            <div className="mt-auto">
              <Button 
                className="w-full" 
                size="lg"
                disabled={(product.stockQuantity || product.stock) === 0}
                onClick={() => {
                  if (onAddToCart) {
                    onAddToCart(product, quantity);
                    onOpenChange(false);
                  }
                }}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              
              <div className="text-center mt-4 text-sm text-muted-foreground">
                {(product.stockQuantity || product.stock) > 10 ? (
                  <span className="text-green-600">In stock and ready to ship</span>
                ) : (product.stockQuantity || product.stock) > 0 ? (
                  <span className="text-orange-500">Low stock - order soon</span>
                ) : (
                  <span className="text-red-500">Out of stock</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}