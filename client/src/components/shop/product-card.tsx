import { useState } from "react";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { QuantitySelector } from "@/components/ui/quantity-selector";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact" | "featured";
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  onToggleFavorite?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  isFavorite?: boolean;
}

export function ProductCard({
  product,
  variant = "default",
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  onQuickView,
  isFavorite = false
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";
  
  // Determine stock status
  const stockStatus = () => {
    const stock = product.stockQuantity ?? product.stock;
    if (stock <= 0) return { text: "Out of Stock", color: "destructive" };
    if (stock <= 10) return { text: "Low Stock", color: "warning" };
    return { text: "In Stock", color: "success" };
  };
  
  // Calculate discount percentage if both price and salePrice exist
  const discountPercentage = product.salePrice && product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  // Current price to display (sale price or regular price)
  const currentPrice = product.salePrice && product.salePrice < product.price 
    ? product.salePrice 
    : product.price;
  
  // Card layout varies based on variant
  if (isCompact) {
    return (
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="w-full h-32 bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">{product.name.substring(0, 2)}</span>
            </div>
          )}
          
          {/* Product badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNew && (
              <Badge className="bg-primary">New</Badge>
            )}
            {discountPercentage && (
              <Badge variant="outline" className="bg-orange-500 text-white border-none">
                {discountPercentage}% OFF
              </Badge>
            )}
          </div>
          
          {/* Favorite button */}
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 
                         ${isFavorite ? 'text-red-500' : 'text-gray-500'}`}
              onClick={() => onToggleFavorite(product)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-sm truncate">{product.name}</h3>
          <div className="flex items-baseline mt-1 gap-1">
            <span className="font-semibold text-base">
              {formatCurrency(currentPrice)}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className={`w-full ${isFeatured ? 'h-40' : 'h-48'} object-cover`}
          />
        ) : (
          <div className={`w-full ${isFeatured ? 'h-40' : 'h-48'} bg-primary/10 flex items-center justify-center`}>
            <span className="text-3xl font-semibold text-primary">{product.name.substring(0, 2)}</span>
          </div>
        )}
        
        {/* Product badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-primary">New</Badge>
          )}
          {discountPercentage && (
            <Badge variant="outline" className="bg-orange-500 text-white border-none">
              {discountPercentage}% OFF
            </Badge>
          )}
          <Badge 
            variant={stockStatus().color as "default" | "secondary" | "destructive" | "outline"}
            className="capitalize"
          >
            {stockStatus().text}
          </Badge>
        </div>
        
        {/* Quick actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {onToggleFavorite && (
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 rounded-full bg-background/80 
                         ${isFavorite ? 'text-red-500 border-red-500' : 'text-muted-foreground'}`}
              onClick={() => onToggleFavorite(product)}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
          
          {onQuickView && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 text-muted-foreground"
              onClick={() => onQuickView(product)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className={`px-4 pt-4 ${isFeatured ? 'pb-2' : 'pb-3'}`}>
        <div className="flex items-center gap-1 mb-1">
          <Badge variant="outline" className="text-xs capitalize">
            {product.category || "General"}
          </Badge>
          {product.supplierName && (
            <span className="text-xs text-muted-foreground truncate">
              by {product.supplierName}
            </span>
          )}
        </div>
      
        <h3 className="font-medium text-lg mb-1 truncate">{product.name}</h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description || `Fresh ${product.name} from Nature Breed Farm.`}
        </p>
        
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-lg">
              {formatCurrency(currentPrice)}
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            per {product.unit}
          </span>
        </div>
        
        {!isFeatured && (
          <div className="mt-3">
            <div className="font-medium text-sm mb-1">Quantity:</div>
            <QuantitySelector
              initialValue={quantity}
              onChange={setQuantity}
              min={1}
              max={Math.max(1, product.stockQuantity || product.stock)}
              disabled={product.stockQuantity === 0 || product.stock === 0}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className={`px-4 pt-0 pb-4 gap-2 ${isFeatured ? 'flex-col' : 'flex-row'}`}>
        {isFeatured ? (
          <>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => onQuickView && onQuickView(product)}
              disabled={product.stockQuantity === 0 || product.stock === 0}
            >
              <Eye className="mr-2 h-4 w-4" />
              Quick View
            </Button>
            {onAddToCart && (
              <Button 
                className="w-full"
                onClick={() => onAddToCart(product, 1)}
                disabled={product.stockQuantity === 0 || product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            )}
          </>
        ) : (
          <>
            {onAddToCart && (
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => onAddToCart(product, quantity)}
                disabled={product.stockQuantity === 0 || product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            )}
            {onBuyNow && (
              <Button 
                className="flex-1"
                onClick={() => onBuyNow(product, quantity)}
                disabled={product.stockQuantity === 0 || product.stock === 0}
              >
                Buy Now
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}