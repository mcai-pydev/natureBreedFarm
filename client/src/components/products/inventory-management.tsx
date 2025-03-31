import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, MinusCircle, PlusCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface InventoryManagementProps {
  product: Product;
  onUpdate?: () => void;
}

export const InventoryManagement = ({ product, onUpdate }: InventoryManagementProps) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(product.lowStockThreshold || 10);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    product.nextRestockDate ? new Date(product.nextRestockDate) : undefined
  );
  const [operation, setOperation] = useState<'increase' | 'decrease'>("increase");

  // Mutation to update product stock
  const updateStockMutation = useMutation({
    mutationFn: async ({
      quantity,
      isIncrease,
      lowStockThreshold,
      nextRestockDate
    }: {
      quantity: number;
      isIncrease: boolean;
      lowStockThreshold: number;
      nextRestockDate?: Date;
    }) => {
      const response = await apiRequest("PATCH", `/api/products/${product.id}/stock`, {
        quantity,
        isIncrease,
        lowStockThreshold,
        nextRestockDate: nextRestockDate ? format(nextRestockDate, "yyyy-MM-dd") : undefined
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      if (onUpdate) onUpdate();
      
      toast({
        title: "Inventory Updated",
        description: `Successfully ${operation === 'increase' ? 'added' : 'removed'} ${quantity} units of ${product.name}`,
        variant: "default",
      });
      
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update inventory: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Also create transaction record for the stock change
  const createTransactionMutation = useMutation({
    mutationFn: async ({ type, quantity, price }: { type: string; quantity: number; price: number }) => {
      const response = await apiRequest("POST", "/api/transactions", {
        productId: product.id,
        quantity,
        price,
        type,
        date: new Date(),
        status: "completed",
        notes: type === "purchase" ? "Inventory restock" : "Inventory reduction"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // After transaction is created, update the stock
      updateStockMutation.mutate({
        quantity,
        isIncrease: operation === "increase",
        lowStockThreshold: sliderValue,
        nextRestockDate: selectedDate
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record transaction: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!quantity || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a positive quantity value",
        variant: "destructive",
      });
      return;
    }
    
    // First create a transaction record, which will then trigger the stock update
    createTransactionMutation.mutate({
      type: operation === "increase" ? "purchase" : "sale",
      quantity,
      price: product.price
    });
  };
  
  // Function to get stock status label and style
  const getStockStatus = () => {
    if (product.stock <= 0) {
      return { label: "Out of Stock", className: "bg-red-100 text-red-800" };
    }
    
    if (product.lowStockThreshold && product.stock <= product.lowStockThreshold) {
      return { label: "Low Stock", className: "bg-amber-100 text-amber-800" };
    }
    
    return { label: "In Stock", className: "bg-green-100 text-green-800" };
  };
  
  const stockStatus = getStockStatus();
  
  return (
    <>
      <div className="flex flex-col gap-2 justify-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={stockStatus.className}>
            {stockStatus.label}
          </Badge>
          
          <span className="text-sm font-medium">
            {product.stock} {product.unit}{product.stock !== 1 ? 's' : ''} available
          </span>
        </div>
        
        {product.lowStockThreshold && (
          <span className="text-xs text-muted-foreground">
            Alert threshold: {product.lowStockThreshold} {product.unit}{product.lowStockThreshold !== 1 ? 's' : ''}
          </span>
        )}
        
        {product.nextRestockDate && (
          <span className="text-xs text-muted-foreground">
            Next restock: {format(new Date(product.nextRestockDate), "MMM dd, yyyy")}
          </span>
        )}
        
        <div className="flex gap-2 mt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-1 items-center"
            onClick={() => {
              setOperation("increase");
              setQuantity(0);
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Add Stock
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex gap-1 items-center"
            onClick={() => {
              setOperation("decrease");
              setQuantity(0);
              setIsDialogOpen(true);
            }}
            disabled={product.stock <= 0}
          >
            <MinusCircle className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {operation === "increase" ? "Add Inventory" : "Remove Inventory"}
            </DialogTitle>
            <DialogDescription>
              {operation === "increase" 
                ? "Add stock to your inventory and update threshold settings"
                : "Remove stock from your inventory"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({product.unit}s)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder={`Enter quantity in ${product.unit}s`}
              />
            </div>
            
            {operation === "increase" && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="threshold">Low Stock Alert Threshold</Label>
                    <span className="text-sm text-muted-foreground">
                      {sliderValue} {product.unit}{sliderValue !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Slider
                    id="threshold"
                    min={1}
                    max={100}
                    step={1}
                    value={[sliderValue]}
                    onValueChange={(value) => setSliderValue(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll receive alerts when inventory falls below this threshold
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restock-date">Next Expected Restock Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="restock-date" 
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
            
            <div className="bg-muted p-3 rounded-md text-sm space-y-2">
              <div className="flex justify-between">
                <span>Current stock:</span>
                <span>{product.stock} {product.unit}s</span>
              </div>
              <div className="flex justify-between">
                <span>New stock level:</span>
                <span>
                  {operation === "increase" 
                    ? (product.stock + quantity)
                    : Math.max(0, product.stock - quantity)
                  } {product.unit}s
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span>Transaction value:</span>
                <span className="font-medium">{formatCurrency(product.price * quantity)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!quantity || quantity <= 0 || createTransactionMutation.isPending || updateStockMutation.isPending}
            >
              {createTransactionMutation.isPending || updateStockMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                operation === "increase" ? "Add Stock" : "Remove Stock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InventoryManagement;