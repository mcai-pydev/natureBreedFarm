import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Filter, 
  X,
  ShoppingCart,
  Search,
  Star,
  ArrowLeft
} from "lucide-react";
import { Product } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
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
import { useLocation } from "wouter";

// Import custom components
import { NavigationBar } from "@/components/shop/navigation-bar";
import { ProductQuickView } from "@/components/shop/product-quick-view";
import { BulkOrderDialog } from "@/components/shop/bulk-order-form";
import { NewsletterForm } from "@/components/shop/newsletter-form";
import { ShareButtons } from "@/components/social/social-media-links";

// Import our components
import { ProductCard } from "@/components/shop/product-card";
import { 
  ProductFilters, 
  type ProductFilters as ProductFiltersType,
  type PriceRange,
  type StockStatus
} from "@/components/shop/product-filters";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { EmailInput } from "@/modules/common/components/email-input";

// Import mobile version of shop page
import MobileShopPage from "./mobile-shop-page";

interface CartItem extends Product {
  quantity: number;
}

export default function ShopPage() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
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
  const [emailIsValid, setEmailIsValid] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  
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

      const response = await apiRequest("GET", `/api/products/search?q=${encodeURIComponent(query)}`, apiFilters);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      // Show filtered products as fallback for search
      setSearchResults(
        products.filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
        )
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debounce
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    // If we have a search query, we need to update search results with new filters
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Get filtered & sorted products
  const getFilteredProducts = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults;
    }
    
    return products.filter(product => {
      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
        return false;
      }
      
      // Price filter
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false;
      }
      
      // Stock filter
      if (!filters.stockStatus.inStock && product.stockStatus === "In Stock") {
        return false;
      }
      if (!filters.stockStatus.lowStock && product.stockStatus === "Low Stock") {
        return false;
      }
      if (!filters.stockStatus.outOfStock && product.stockStatus === "Out of Stock") {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort
      switch (filters.sortBy) {
        case "price-low-high":
          return a.price - b.price;
        case "price-high-low":
          return b.price - a.price;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "featured":
        default:
          return b.featured ? 1 : -1;
      }
    });
  };

  // Handle quick view
  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };

  // Handle add to cart
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
    
    // Open cart if on mobile
    if (isMobile) {
      setTimeout(() => {
        cartSheetRef.current?.click();
      }, 100);
    }
  };

  // Handle remove from cart
  const handleRemoveFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // Handle update cart quantity
  const handleUpdateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Handle toggle favorite
  const handleToggleFavorite = (productId: number) => {
    setFavoriteProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Get unique product categories
  const categories = [...new Set(products.map(product => product.category))];

  // Handle bulk order click
  const handleBulkOrderClick = () => {
    setBulkOrderOpen(true);
  };

  // Handle navigation to login/auth page
  const handleAuthNavigation = () => {
    setLocation("/auth");
  };

  // Filter featured products for the carousel
  const featuredProducts = products.filter(product => product.featured);

  // For mobile devices, render the mobile-optimized version
  if (isMobile) {
    return <MobileShopPage />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <NavigationBar 
        cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={() => cartSheetRef.current?.click()}
        onSearchChange={(query) => setSearchQuery(query)}
        searchQuery={searchQuery}
      />
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-green-900 to-green-700 text-white py-12 px-4 md:px-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Nature Breed Farm Products
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-3xl">
            Direct from our farm to your table. Explore our selection of premium farm products, including livestock and fresh produce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="bg-white text-green-800 hover:bg-gray-100"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Browse Products
            </Button>
            <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={handleBulkOrderClick}
            >
              Request Bulk Order
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Products Carousel */}
      {featuredProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <Carousel className="w-full">
            <CarouselContent>
              {featuredProducts.map(product => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                  <ProductCard
                    product={product}
                    isFavorite={favoriteProducts.includes(product.id)}
                    onQuickView={() => handleQuickView(product)}
                    onAddToCart={() => handleAddToCart(product)}
                    onToggleFavorite={() => handleToggleFavorite(product.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="hidden md:flex">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        
        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {isLoading ? (
            // Skeleton loaders
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : getFilteredProducts().length > 0 ? (
            getFilteredProducts().map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteProducts.includes(product.id)}
                onQuickView={() => handleQuickView(product)}
                onAddToCart={() => handleAddToCart(product)}
                onToggleFavorite={() => handleToggleFavorite(product.id)}
              />
            ))
          ) : (
            <div className="col-span-3 py-12 text-center">
              <p className="text-2xl font-semibold mb-4">No products found</p>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "We couldn't find any products matching your search." 
                  : "There are no products matching your selected filters."}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    categories: [],
                    priceRange: { min: 0, max: 1000 },
                    stockStatus: { inStock: true, lowStock: true, outOfStock: false },
                    sortBy: "featured"
                  });
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
        
        {/* Newsletter Subscription */}
        <div className="bg-primary/10 rounded-lg p-6 md:p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold mb-2">Subscribe to Our Newsletter</h3>
              <p className="text-muted-foreground mb-4">
                Get updates on new products, seasonal offers, and farming tips directly to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <EmailInput
                    placeholder="Your email address"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    onValidationChange={setEmailIsValid}
                    showValidationIcon={true}
                  />
                </div>
                <Button 
                  className="whitespace-nowrap"
                  disabled={!emailIsValid || !emailValue}
                  onClick={() => {
                    // Handle newsletter subscription
                    if (emailIsValid && emailValue) {
                      // Call newsletter subscription API
                      // For now, just show success message
                      alert(`Subscribed with email: ${emailValue}`);
                      setEmailValue("");
                    }
                  }}
                >
                  Subscribe
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-primary/20 p-6 rounded-full">
                <Star className="h-14 w-14 text-primary" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "John D.",
                text: "The rabbits I purchased from Nature Breed Farm are healthy and have excellent genetics. Their breeding advice was invaluable for my small farm.",
              },
              {
                name: "Sarah M.",
                text: "I've been buying duck eggs regularly for the past year. The quality is consistent and they taste amazing. Highly recommend!",
              },
              {
                name: "Michael T.",
                text: "Their goat milk products are exceptional. You can really taste the difference from commercially produced alternatives.",
              }
            ].map((testimonial, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 mr-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.name}</p>
                      <div className="flex text-yellow-500 mt-1">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Social Sharing */}
        <div className="border-t pt-8 pb-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Share Our Farm Shop</h3>
              <p className="text-muted-foreground mb-4 md:mb-0">
                Help us grow our community by sharing with your friends
              </p>
            </div>
            <ShareButtons 
              url="https://naturebreedsfarm.com/shop" 
              title="Check out these amazing farm products!" 
              text="I found some great products from Nature Breed Farm. Take a look!"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter Products</SheetTitle>
            <SheetDescription>
              Adjust the filters to find exactly what you're looking for.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-4">
            <ProductFilters 
              categories={categories}
              filters={filters}
              onChange={handleFilterChange}
            />
            
            <div className="mt-6 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({
                    categories: [],
                    priceRange: { min: 0, max: 1000 },
                    stockStatus: { inStock: true, lowStock: true, outOfStock: false },
                    sortBy: "featured"
                  });
                }}
              >
                Reset
              </Button>
              <Button onClick={() => setMobileFiltersOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Cart Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <span className="hidden" ref={cartSheetRef}></span>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>
              {cartItems.length === 0 
                ? "Your cart is empty."
                : `You have ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart.`}
            </SheetDescription>
          </SheetHeader>
          
          {cartItems.length > 0 ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto py-6">
                <div className="space-y-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-20 w-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{item.name}</h4>
                          <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{formatCurrency(item.price)}</p>
                        <div className="flex items-center">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(value) => handleUpdateCartQuantity(item.id, value)}
                            min={1}
                            max={item.stockStatus !== "Out of Stock" ? 99 : 0}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Shipping and taxes calculated at checkout
                </p>
                <Button className="w-full">
                  Checkout
                </Button>
                <Button variant="outline" className="w-full mt-2">
                  Continue Shopping
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-10">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-center mb-6">
                Looks like you haven't added any products to your cart yet.
              </p>
              <Button onClick={() => setMobileFiltersOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          isOpen={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          onAddToCart={handleAddToCart}
          isFavorite={favoriteProducts.includes(quickViewProduct.id)}
          onToggleFavorite={() => handleToggleFavorite(quickViewProduct.id)}
        />
      )}
      
      {/* Bulk Order Dialog */}
      <BulkOrderDialog
        isOpen={bulkOrderOpen}
        onClose={() => setBulkOrderOpen(false)}
        products={products}
      />
    </div>
  );
}