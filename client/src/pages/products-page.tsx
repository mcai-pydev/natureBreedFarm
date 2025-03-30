import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import ProductCard from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InsertProduct } from "@shared/schema";

// Form validation schema
const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  stock: z.coerce.number().nonnegative("Stock cannot be negative"),
  imageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      unit: "",
      stock: 0,
      imageUrl: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "The product has been created successfully",
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: ProductFormValues) {
    createProductMutation.mutate({
      name: data.name,
      description: data.description || "",
      price: data.price,
      unit: data.unit,
      stock: data.stock,
      imageUrl: data.imageUrl || undefined,
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow">
          <MobileMenu />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Farm Products</h1>
                <p className="text-gray-500">Manage and view your farm's product inventory</p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Enter the details of the new farm product.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Organic Tomatoes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide a short description" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input placeholder="kg, lb, each" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/image.jpg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createProductMutation.isPending}
                        >
                          {createProductMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Product"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
                    <div className="p-4">
                      <div className="h-6 w-2/3 bg-gray-200 animate-pulse mb-2"></div>
                      <div className="h-4 w-full bg-gray-100 animate-pulse mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-gray-200 animate-pulse"></div>
                        <div className="h-4 w-16 bg-gray-200 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Start by adding your first farm product</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-5 w-5 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
