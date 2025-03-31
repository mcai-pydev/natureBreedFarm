import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, AlertTriangle, ShoppingCart, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import InventoryManagement from "@/components/products/inventory-management";
import { useAuth } from "@/hooks/use-auth";

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    unit: "kg",
    stock: "",
    category: "produce",
    imageUrl: "",
    lowStockThreshold: "10",
    featured: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // Get products data
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return await response.json();
    }
  });
  
  // Get low stock products
  const { data: lowStockProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", "lowStock"],
    queryFn: async () => {
      const response = await fetch("/api/products?lowStock=true");
      if (!response.ok) throw new Error("Failed to fetch low stock products");
      return await response.json();
    }
  });
  
  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Product added",
        description: "The product has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Edit product mutation
  const editProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData(prev => ({ ...prev, [name]: value === "" ? "" : value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle adding a new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.price || !formData.unit || !formData.stock) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for API
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      unit: formData.unit,
      stock: parseInt(formData.stock),
      category: formData.category || null,
      imageUrl: formData.imageUrl || getImageUrlForCategory(formData.category),
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      featured: formData.featured || false
    };
    
    addProductMutation.mutate(productData);
  };
  
  // Handle editing a product
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;
    
    // Prepare data for API
    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      unit: formData.unit,
      stock: parseInt(formData.stock),
      category: formData.category || null,
      imageUrl: formData.imageUrl || selectedProduct.imageUrl,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      featured: formData.featured || false
    };
    
    editProductMutation.mutate({ id: selectedProduct.id, data: productData });
  };
  
  // Handle deleting a product with confirmation
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };
  
  // Set edit form data from selected product
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      unit: product.unit,
      stock: product.stock.toString(),
      category: product.category || "produce",
      imageUrl: product.imageUrl || "",
      lowStockThreshold: ((product.lowStockThreshold !== null && product.lowStockThreshold !== undefined) 
        ? product.lowStockThreshold 
        : 10).toString(),
      featured: product.featured || false
    });
    setIsEditDialogOpen(true);
  };
  
  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      unit: "kg",
      stock: "",
      category: "produce",
      imageUrl: "",
      lowStockThreshold: "10",
      featured: false
    });
  };
  
  // Get a default image URL based on category
  const getImageUrlForCategory = (category: string) => {
    const categoryImageMap: Record<string, string> = {
      produce: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7",
      dairy: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499",
      livestock: "https://images.unsplash.com/photo-1560468660-6c11a19d7330",
      poultry: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7",
      seafood: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d",
      specialty: "https://images.unsplash.com/photo-1528825871115-3581a5387919"
    };
    
    return categoryImageMap[category] || "https://images.unsplash.com/photo-1627483262769-04d0a1401487";
  };
  
  // Filter products based on search and category
  const filteredProducts = products ? products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) : [];
  
  // Get unique categories for filter
  const categories = products ? 
    ["all", ...Array.from(new Set(products.map(product => product.category || "uncategorized")))] 
    : ["all"];
  
  // Function to get stock status badge
  const getStockStatusBadge = (product: Product) => {
    if (product.stock <= 0) {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Out of Stock</Badge>;
    }
    
    if (product.lowStockThreshold !== null && 
        product.lowStockThreshold !== undefined && 
        product.stock <= product.lowStockThreshold) {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800">Low Stock</Badge>;
    }
    
    return <Badge variant="outline" className="bg-green-100 text-green-800">In Stock</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading products...</p>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>There was an error loading the product data. Please try again later.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/products"] })}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your farm inventory and product listings
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DialogTrigger asChild onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
        </div>
      </div>
      
      {/* Inventory status summary */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Inventory Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              You have {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} with low stock levels that require attention.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-100" onClick={() => window.scrollTo(0, document.body.scrollHeight)}>
              View Low Stock Items
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Search and filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
              size="sm"
            >
              <Package className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Product grid or list view */}
      {viewMode === "grid" ? (
        // Grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <div className="h-48 overflow-hidden bg-gray-100">
                <img 
                  src={product.imageUrl || getImageUrlForCategory(product.category || "produce")} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105" 
                />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {getStockStatusBadge(product)}
                </div>
                <CardDescription className="line-clamp-2">
                  {product.description || `${product.name} from Nature Breed Farm`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <div className="flex justify-between mb-4">
                  <div className="font-medium text-lg">
                    {formatCurrency(product.price)}
                    <span className="text-sm text-muted-foreground ml-1">
                      per {product.unit}
                    </span>
                  </div>
                </div>
                
                <InventoryManagement 
                  product={product} 
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/products"] })}
                />
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => handleEditClick(product)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {user?.role === "Admin" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      ) : (
        // List view
        <Table>
          <TableCaption>Inventory List. Total: {filteredProducts.length} products</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map(product => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category || "Uncategorized"}</TableCell>
                <TableCell>{formatCurrency(product.price)} / {product.unit}</TableCell>
                <TableCell>
                  <span className="font-mono">
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell>{getStockStatusBadge(product)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    
                    {user?.role === "Admin" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-200 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No products found. Try adjusting your search or filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the details for the new product below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select name="unit" value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="lb">Pound (lb)</SelectItem>
                    <SelectItem value="oz">Ounce (oz)</SelectItem>
                    <SelectItem value="liter">Liter (L)</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="jar">Jar</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="head">Head</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock *</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  You'll receive alerts when stock falls below this number
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use a default image based on category
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured as boolean}
                  onChange={handleInputChange}
                  className="form-checkbox h-4 w-4 text-primary rounded"
                />
                <Label htmlFor="featured">Feature this product in listings and shop</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addProductMutation.isPending}>
                {addProductMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the details for {selectedProduct?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditProduct}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select name="category" value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="poultry">Poultry</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price per Unit *</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit *</Label>
                <Select name="unit" value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="lb">Pound (lb)</SelectItem>
                    <SelectItem value="oz">Ounce (oz)</SelectItem>
                    <SelectItem value="liter">Liter (L)</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="jar">Jar</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="head">Head</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Current Stock *</Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="edit-lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.lowStockThreshold}
                  onChange={handleInputChange}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  You'll receive alerts when stock falls below this number
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-imageUrl">Image URL</Label>
                <Input
                  id="edit-imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  name="featured"
                  checked={formData.featured as boolean}
                  onChange={handleInputChange}
                  className="form-checkbox h-4 w-4 text-primary rounded"
                />
                <Label htmlFor="edit-featured">Feature this product in listings and shop</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editProductMutation.isPending}>
                {editProductMutation.isPending ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}