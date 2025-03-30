import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductQuickView({ 
  product, 
  open, 
  onOpenChange, 
  onAddToCart 
}: ProductQuickViewProps) {
  if (!product) return null;

  const rating = Math.floor(3 + Math.random() * 2); // Simulate rating (3-5 stars)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-green-50 flex items-center justify-center p-8">
            <span className="text-6xl text-primary font-semibold">{product.name.substring(0, 2)}</span>
          </div>
          
          <div className="p-6">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
                {product.stock < 10 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                    Limited Stock: {product.stock}
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {formatCurrency(product.price)} per {product.unit}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">{rating}.0</span>
              </div>
              
              <p className="text-gray-700">
                {product.description || "No description available for this product."}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span> 
                  <span className="ml-2 font-medium capitalize">{product.category || "General"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Availability:</span> 
                  <span className="ml-2 font-medium">{product.stock > 0 ? "In Stock" : "Out of Stock"}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                onClick={() => {
                  onAddToCart(product);
                  onOpenChange(false);
                }}
                disabled={product.stock <= 0}
                className="w-full"
              >
                Add to Cart
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}