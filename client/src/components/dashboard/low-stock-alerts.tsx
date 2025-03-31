import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle, PlusCircle, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const LowStockAlerts = () => {
  const { toast } = useToast();
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [thresholdValue, setThresholdValue] = useState("");
  const [nextRestockDate, setNextRestockDate] = useState("");

  // Fetch low stock products
  const { data: lowStockProducts, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products", "lowStock"],
    queryFn: async () => {
      const response = await fetch("/api/products?lowStock=true");
      if (!response.ok) throw new Error("Failed to fetch low stock products");
      return await response.json();
    }
  });

  // Mutation to update product stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ 
      id, 
      quantity, 
      isIncrease, 
      lowStockThreshold,
      nextRestockDate
    }: { 
      id: number; 
      quantity: number; 
      isIncrease: boolean;
      lowStockThreshold?: number;
      nextRestockDate?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/products/${id}/stock`, {
        quantity,
        isIncrease,
        lowStockThreshold,
        nextRestockDate: nextRestockDate || undefined
      });
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate the products cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "Stock Updated",
        description: "Product stock has been successfully updated.",
        variant: "default",
      });
      
      setRestockDialogOpen(false);
      setSelectedProduct(null);
      setRestockQuantity("");
      setThresholdValue("");
      setNextRestockDate("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update stock: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create a transaction for restock (purchase)
  const createTransactionMutation = useMutation({
    mutationFn: async ({ productId, quantity, price }: { productId: number; quantity: number; price: number }) => {
      const response = await apiRequest("POST", "/api/transactions", {
        productId,
        quantity,
        price,
        type: "purchase",
        date: new Date(),
        status: "completed",
        notes: "Restock due to low inventory"
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // After creating transaction, we'll update stock (if needed)
      if (selectedProduct && parseFloat(restockQuantity) > 0) {
        const quantity = parseFloat(restockQuantity);
        const lowStockThreshold = thresholdValue 
          ? parseFloat(thresholdValue) 
          : undefined;
          
        updateStockMutation.mutate({
          id: selectedProduct.id,
          quantity,
          isIncrease: true,
          lowStockThreshold,
          nextRestockDate: nextRestockDate || undefined
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create restock transaction: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity("");
    setThresholdValue(product.lowStockThreshold?.toString() || "");
    setNextRestockDate("");
    setRestockDialogOpen(true);
  };
  
  const submitRestock = () => {
    if (!selectedProduct || !restockQuantity) return;
    
    const quantity = parseFloat(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid positive number for the quantity.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a purchase transaction
    createTransactionMutation.mutate({
      productId: selectedProduct.id,
      quantity,
      price: selectedProduct.price
    });
  };
  
  const getStockStatusColor = (product: Product) => {
    if (!product.stock) return "bg-red-100 text-red-800";
    if (product.lowStockThreshold && product.stock <= product.lowStockThreshold / 2) 
      return "bg-red-100 text-red-800";
    if (product.lowStockThreshold && product.stock <= product.lowStockThreshold) 
      return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>Loading inventory status...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="h-3 w-3 rounded-full bg-muted"></div>
            <div className="h-3 w-3 rounded-full bg-muted"></div>
            <div className="h-3 w-3 rounded-full bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>There was an error fetching the inventory status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-100 text-red-800 p-4 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>Failed to load low stock products. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products that need attention</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {lowStockProducts?.length || 0} items
          </Badge>
        </CardHeader>
        <CardContent>
          {lowStockProducts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="mx-auto h-8 w-8 mb-2" />
              <p>All products have sufficient stock.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockProducts?.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between border p-3 rounded-md"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className={getStockStatusColor(product)}>
                        {product.stock} {product.unit}s left
                      </Badge>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Alert at {product.lowStockThreshold} {product.unit}s
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            Low stock threshold setting
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {product.nextRestockDate && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                Next restock: {new Date(product.nextRestockDate).toLocaleDateString()}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Scheduled restock date
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => handleRestock(product)}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Restock Dialog */}
      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restock Product</DialogTitle>
            <DialogDescription>
              Add inventory for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                className="col-span-3"
                placeholder="Enter quantity to add"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                type="number"
                min="1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threshold" className="text-right">
                Low Stock Alert
              </Label>
              <Input
                id="threshold"
                className="col-span-3"
                placeholder="Update low stock threshold"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                type="number"
                min="1"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restockDate" className="text-right">
                Next Restock
              </Label>
              <Input
                id="restockDate"
                className="col-span-3"
                type="date"
                value={nextRestockDate}
                onChange={(e) => setNextRestockDate(e.target.value)}
              />
            </div>
            
            {selectedProduct && (
              <div className="bg-muted p-3 rounded-md text-sm mt-2">
                <div className="flex justify-between">
                  <span>Current stock:</span>
                  <span className="font-medium">{selectedProduct.stock} {selectedProduct.unit}s</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Purchase cost:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedProduct.price * (parseFloat(restockQuantity) || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRestockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRestock}
              disabled={!restockQuantity || parseFloat(restockQuantity) <= 0 || createTransactionMutation.isPending || updateStockMutation.isPending}
            >
              {(createTransactionMutation.isPending || updateStockMutation.isPending) ? 
                "Processing..." : "Restock Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LowStockAlerts;