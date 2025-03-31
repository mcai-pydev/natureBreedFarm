import { useState } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { ProductActionButton } from "@/components/ui/product-action-button";
import { ShareButtons } from "@/components/social/social-media-links";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@shared/schema";
import { ShoppingCart, Heart, Eye, BarChart2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "horizontal" | "compact";
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
  className?: string;
  showActions?: boolean;
}

export function ProductCard({
  product,
  variant = "default",
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  isFavorite = false,
  className = "",
  showActions = true,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [showQuantity, setShowQuantity] = useState(false);
  
  // Placeholder image if no image is provided
  const imageSrc = product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
  
  // Check if product is in stock
  const isInStock = product.stockQuantity > 0;
  
  // Calculate discount percentage if there's a sale price
  const discountPercentage = product.salePrice && product.price 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;
  
  // Product price to display (sale price if available, otherwise regular price)
  const displayPrice = product.salePrice || product.price;
  
  const handleAddToCart = () => {
    onAddToCart?.(product, quantity);
    setShowQuantity(false);
  };
  
  const handleBuyNow = () => {
    onBuyNow?.(product, quantity);
    setShowQuantity(false);
  };
  
  const renderStockBadge = () => {
    if (product.stockQuantity > 20) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">In Stock</Badge>;
    } else if (product.stockQuantity > 0) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Low Stock: {product.stockQuantity} left</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of Stock</Badge>;
    }
  };
  
  const renderProductImage = () => (
    <div className="relative overflow-hidden rounded-t-lg">
      {discountPercentage && (
        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
          {discountPercentage}% OFF
        </Badge>
      )}
      
      {product.isNew && (
        <Badge className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600">
          NEW
        </Badge>
      )}
      
      <Link href={`/shop/products/${product.id}`}>
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>
    </div>
  );
  
  const renderPrice = () => (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-bold ${product.salePrice ? 'text-red-600' : 'text-primary'}`}>
        {formatCurrency(displayPrice)}
      </span>
      
      {product.salePrice && (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(product.price)}
        </span>
      )}
    </div>
  );
  
  const renderActions = () => (
    showActions && (
      <div className="mt-4 space-y-3">
        {showQuantity ? (
          <div className="space-y-3">
            <QuantitySelector 
              initialValue={quantity}
              min={1}
              max={Math.min(10, product.stockQuantity || 10)}
              onChange={setQuantity}
              disabled={!isInStock}
              unit={product.unit}
            />
            
            <div className="grid grid-cols-2 gap-2">
              <ProductActionButton
                variant="outline"
                label="Add to Cart"
                icon={<ShoppingCart className="h-4 w-4" />}
                onClick={handleAddToCart}
                disabled={!isInStock}
                fullWidth
              />
              
              <ProductActionButton
                label="Buy Now"
                onClick={handleBuyNow}
                disabled={!isInStock}
                fullWidth
              />
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={() => setShowQuantity(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <ProductActionButton
                variant="outline"
                label="Add to Cart"
                icon={<ShoppingCart className="h-4 w-4" />}
                onClick={() => setShowQuantity(true)}
                disabled={!isInStock}
                fullWidth
              />
              
              <Button
                size="icon"
                variant="outline"
                onClick={() => onToggleFavorite?.(product)}
                className={isFavorite ? "text-red-500 border-red-200" : ""}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1"
                asChild
              >
                <Link href={`/shop/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                asChild
              >
                <Link href={`/reports/products/${product.id}`}>
                  <BarChart2 className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  );
  
  if (variant === "compact") {
    return (
      <Card className={`overflow-hidden h-full ${className}`}>
        <div className="flex h-full">
          <div className="w-24 h-full">
            <img 
              src={imageSrc} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 flex flex-col p-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>
              {renderPrice()}
            </div>
            
            <div className="mt-auto flex justify-between items-center">
              {renderStockBadge()}
              
              <ProductActionButton
                size="sm"
                variant="outline"
                label=""
                showTooltip
                tooltipContent="Add to Cart"
                icon={<ShoppingCart className="h-3.5 w-3.5" />}
                onClick={() => onAddToCart?.(product, 1)}
                disabled={!isInStock}
              />
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  if (variant === "horizontal") {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-1/3">
            {renderProductImage()}
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between mb-2">
              <Badge variant="outline">{product.category}</Badge>
              {renderStockBadge()}
            </div>
            
            <Link href={`/shop/products/${product.id}`}>
              <h3 className="text-xl font-semibold hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
            </Link>
            
            <p className="text-muted-foreground line-clamp-2 my-2">{product.description}</p>
            
            <div className="flex justify-between items-end mt-4">
              <div>
                {renderPrice()}
                <p className="text-sm mt-1">
                  {product.unit && <span>{product.unit} • </span>}
                  {product.supplierName && <span>By {product.supplierName}</span>}
                </p>
              </div>
              
              <div className="flex gap-2">
                <ProductActionButton
                  variant="outline"
                  label="Add to Cart"
                  icon={<ShoppingCart className="h-4 w-4" />}
                  onClick={() => setShowQuantity(prev => !prev)}
                  disabled={!isInStock}
                />
                
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onToggleFavorite?.(product)}
                  className={isFavorite ? "text-red-500 border-red-200" : ""}
                >
                  <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                </Button>
              </div>
            </div>
            
            {showQuantity && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <QuantitySelector 
                  initialValue={quantity}
                  min={1}
                  max={Math.min(10, product.stockQuantity || 10)}
                  onChange={setQuantity}
                  disabled={!isInStock}
                  unit={product.unit}
                />
                
                <ProductActionButton
                  label="Add to Cart"
                  icon={<ShoppingCart className="h-4 w-4" />}
                  onClick={handleAddToCart}
                  disabled={!isInStock}
                  fullWidth
                />
                
                <ProductActionButton
                  label="Buy Now"
                  onClick={handleBuyNow}
                  disabled={!isInStock}
                  fullWidth
                />
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <ShareButtons 
                compact 
                url={`/shop/products/${product.id}`} 
                title={product.name} 
                description={product.description}
                imageUrl={product.imageUrl}
              />
              
              <Button 
                variant="ghost" 
                size="sm"
                asChild
              >
                <Link href={`/shop/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  
  // Default card view
  return (
    <Card className={`overflow-hidden h-full ${className}`}>
      {renderProductImage()}
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <Badge variant="outline">{product.category}</Badge>
          {renderStockBadge()}
        </div>
        
        <Link href={`/shop/products/${product.id}`}>
          <CardTitle className="text-lg mt-2 hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </CardTitle>
        </Link>
        
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {renderPrice()}
        <p className="text-sm mt-1 text-muted-foreground">
          {product.unit && <span>{product.unit}</span>}
          {product.supplierName && <span> • By {product.supplierName}</span>}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {renderActions()}
      </CardFooter>
    </Card>
  );
}