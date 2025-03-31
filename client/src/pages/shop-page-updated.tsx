import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Filter, 
  X,
  ShoppingCart,
  Search
} from "lucide-react";
import { Product } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";

// Import custom components
import { NavigationBar } from "@/components/shop/navigation-bar";
import { ProductQuickView } from "@/components/shop/product-quick-view";
import { BulkOrderDialog } from "@/components/shop/bulk-order-form";
import { NewsletterForm } from "@/components/shop/newsletter-form";
import { ShareButtons } from "@/components/social/social-media-links";

// Import our new components
import { ProductCard } from "@/components/shop/product-card";
import { 
  ProductFilters, 
  type ProductFilters as ProductFiltersType,
  type PriceRange,
  type StockStatus
} from "@/components/shop/product-filters";
import { QuantitySelector } from "@/components/ui/quantity-selector";

interface CartItem extends Product {
  quantity: number;
}

export default function ShopPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFiltersType>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    stockStatus: { inStock: true, lowStock: true, outOfStock: false },
    sortBy: "featured"
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<number[]>([]);
  const [bulkOrderOpen, setBulkOrderOpen] = useState(false);
  
  const cartSheetRef = useRef<HTMLButtonElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch products from the API
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Function to perform API search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const apiFilters = {
        category: filters.categories.length ? filters.categories.join(',') : undefined,
        minPrice: filters.priceRange.min,
        maxPrice: filters.priceRange.max,
        inStock: filters.stockStatus.inStock || filters.stockStatus.lowStock,
        sortBy: filters.sortBy
      };

      // Use the server-side search API
      const response = await apiRequest('POST', '/api/search', {
        query,
        filters: apiFilters
      });
      
      const results = await response.json();
      
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else {
        console.error('Invalid search results format:', results);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      // Fallback to client-side filtering if API search fails
      const fallbackResults = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        (product.description?.toLowerCase() || "").includes(query.toLowerCase())
      );
      setSearchResults(fallbackResults);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300); // Debounce for 300ms
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // Determine which products to display
  const displayProducts = searchQuery.trim() ? searchResults : products;
  
  // Apply filters to products (but not to search results, as search handles filters)
  const filteredProducts = searchQuery.trim() ? displayProducts : displayProducts.filter(product => {
    // Apply category filter
    const matchesCategory = filters.categories.length === 0 || 
      filters.categories.includes(product.category || "general");
    
    // Apply price filter
    const matchesPrice = 
      product.price >= filters.priceRange.min && 
      product.price <= filters.priceRange.max;
    
    // Apply stock status filter
    let matchesStock = false;
    if (product.stockQuantity > 20 && filters.stockStatus.inStock) {
      matchesStock = true;
    } else if (product.stockQuantity > 0 && product.stockQuantity <= 20 && filters.stockStatus.lowStock) {
      matchesStock = true;
    } else if (product.stockQuantity === 0 && filters.stockStatus.outOfStock) {
      matchesStock = true;
    }
    
    return matchesCategory && matchesPrice && matchesStock;
  });
  
  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "newest":
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - 
               (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      default:
        return 0; // "featured" or default
    }
  });
  
  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category || "general")));
  
  // Find min and max price from products
  const priceRange = products.reduce(
    (acc, product) => {
      return {
        min: Math.min(acc.min, product.price),
        max: Math.max(acc.max, product.price),
      };
    },
    { min: Number.MAX_SAFE_INTEGER, max: 0 }
  );
  
  // Add item to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
    
    // Automatically open cart when adding items
    if (cartSheetRef.current) {
      cartSheetRef.current.click();
    }
  };
  
  // Handle Buy Now
  const handleBuyNow = (product: Product, quantity: number = 1) => {
    // First add to cart
    addToCart(product, quantity);
    // Then redirect to checkout (placeholder for now)
    console.log(`Buy now: ${quantity} × ${product.name}`);
    // You would typically redirect to checkout page here
  };
  
  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };
  
  // Update item quantity in cart
  const updateCartQuantity = (productId: number, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === productId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };
  
  // Toggle favorite status
  const toggleFavorite = (product: Product) => {
    setFavoriteProducts(prev => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      } else {
        return [...prev, product.id];
      }
    });
  };
  
  // Calculate total cart value
  const cartTotal = cartItems.reduce(
    (total, item) => total + 
      (item.salePrice ? item.salePrice : item.price) * item.quantity, 
    0
  );
  
  // Featured products (take 4 products with highest stock or marked as featured)
  const featuredProducts = [...products]
    .filter(p => p.isFeatured || p.stockQuantity > 20)
    .sort((a, b) => b.stockQuantity - a.stockQuantity)
    .slice(0, 4);
  
  // Open quick view for a product
  const openQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    
    // Re-execute search if we have an active search query
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <NavigationBar 
        cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)} 
        onCartClick={() => cartSheetRef.current?.click()}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />
      
      {/* Product Quick View Dialog */}
      <ProductQuickView 
        product={quickViewProduct} 
        open={quickViewOpen} 
        onOpenChange={setQuickViewOpen}
        onAddToCart={addToCart}
      />
      
      {/* Shopping Cart Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            ref={cartSheetRef} 
            variant="outline" 
            className="hidden"
          >
            Cart
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>
              {cartItems.length === 0 ? (
                "Your cart is empty"
              ) : (
                `${cartItems.reduce((total, item) => total + item.quantity, 0)} items in your cart`
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 rounded-md w-16 h-16 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg text-primary font-medium">{item.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.salePrice || item.price)} per {item.unit}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <QuantitySelector
                    initialValue={item.quantity}
                    min={1}
                    max={10}
                    size="sm"
                    allowManualInput={false}
                    onChange={(value) => updateCartQuantity(item.id, value)}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">
                      {formatCurrency((item.salePrice || item.price) * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {cartItems.length > 0 && (
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                </div>
                <Button className="w-full">Proceed to Checkout</Button>
                <Button variant="outline" className="w-full" onClick={() => setCartItems([])}>
                  Clear Cart
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Bulk Order Dialog */}
      <BulkOrderDialog 
        open={bulkOrderOpen} 
        onOpenChange={setBulkOrderOpen} 
      />
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop Fresh, Farm-to-Table Products!</h2>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto mb-6">
            Directly sourced from our sustainable farm. Healthy, organic, and delivered fresh to your doorstep.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Explore Now
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white/20"
              onClick={() => setBulkOrderOpen(true)}>
              Bulk Orders
            </Button>
          </div>
        </div>
      </div>
      
      {/* Featured Products Carousel */}
      <div className="container mx-auto py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {featuredProducts.map(product => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <ProductCard
                  product={product}
                  variant="default"
                  onAddToCart={addToCart}
                  onBuyNow={handleBuyNow}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favoriteProducts.includes(product.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-background" />
          <CarouselNext className="right-0 bg-background" />
        </Carousel>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <div className="hidden lg:block w-64 bg-card p-4 rounded-lg border shadow-sm h-fit sticky top-24">
            <ProductFilters
              availableCategories={categories}
              maxPrice={priceRange.max}
              minPrice={priceRange.min}
              initialFilters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          {/* Mobile filters */}
          <div className="lg:hidden mb-4">
            <ProductFilters
              availableCategories={categories}
              maxPrice={priceRange.max}
              minPrice={priceRange.min}
              initialFilters={filters}
              onFilterChange={handleFilterChange}
              isMobile={true}
            />
          </div>
          
          {/* Products grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">All Products</h2>
              <div className="md:hidden">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isSearching ? (
              <div className="text-center py-12">
                <div className="animate-pulse flex flex-col items-center">
                  <Search className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Searching products...</h3>
                  <p className="text-muted-foreground">Finding the best matches for you</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-muted mb-4"></div>
                  <div className="h-4 bg-muted rounded w-32 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-48"></div>
                </div>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      categories: [],
                      priceRange: { min: priceRange.min, max: priceRange.max },
                      stockStatus: { inStock: true, lowStock: true, outOfStock: false },
                      sortBy: "featured"
                    });
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onBuyNow={handleBuyNow}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favoriteProducts.includes(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Newsletter and Contact sections */}
      <div className="bg-muted/40 py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-2">Subscribe to Our Newsletter</h2>
              <p className="text-muted-foreground mb-6">
                Stay updated with our latest products, farm news, and exclusive offers.
              </p>
              <NewsletterForm />
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-2">Bulk Orders</h2>
              <p className="text-muted-foreground mb-6">
                Interested in wholesale or bulk purchases? Contact us for special pricing and arrangements.
              </p>
              <Button onClick={() => setBulkOrderOpen(true)}>
                Request Bulk Order
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Social sharing section */}
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-2">Share Nature Breed Farm</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Help us spread the word about sustainable, farm-fresh products!
          </p>
          <div className="flex justify-center">
            <ShareButtons 
              showLabel 
              title="Nature Breed Farm - Fresh Products Directly From Our Farm" 
              description="Shop fresh, organic products directly from our sustainable farm. Discover Nature Breed Farm today!"
            />
          </div>
        </div>
      </div>
    </div>
  );
}