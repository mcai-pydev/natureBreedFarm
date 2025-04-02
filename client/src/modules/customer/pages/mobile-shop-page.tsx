import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  X,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Heart,
  ShoppingBag,
  Eye
} from 'lucide-react';
import { Product } from '@shared/schema';
import { getQueryFn } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Custom components
import { NavigationBar } from '@/components/shop/navigation-bar';
import { ProductQuickView } from '@/components/shop/product-quick-view';
import { BulkOrderDialog } from '@/components/shop/bulk-order-form';
import { NewsletterForm } from '@/components/shop/newsletter-form';
import { ProductCard } from '@/components/shop/product-card';
import { 
  ProductFilters, 
  type ProductFilters as ProductFiltersType,
  type PriceRange,
  type StockStatus
} from '@/components/shop/product-filters';
import { QuantitySelector } from '@/components/ui/quantity-selector';
import { EmailInput } from '@/modules/common/components/email-input';

// Mobile layout components
import { PullToRefresh } from '@/components/layout/pull-to-refresh';
import { SwipeableContainer } from '@/components/layout/swipeable-container';
import { CollapsibleSection } from '@/components/layout/collapsible-section';
import { MobileStepper } from '@/components/navigation/mobile-stepper';
import { useResponsiveGrid } from '@/hooks/use-responsive-grid';

// Utils & Hooks
import { formatCurrency, cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

// Interfaces
interface CartItem extends Product {
  quantity: number;
}

interface CategoryChip {
  id: string;
  name: string;
  active: boolean;
}

export default function MobileShopPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const ResponsiveGrid = useResponsiveGrid();
  
  // Shop state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState<number[]>([]);
  const [bulkOrderOpen, setBulkOrderOpen] = useState(false);
  const [emailIsValid, setEmailIsValid] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [checkoutStep, setCheckoutStep] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI state
  const [showMobileSortDropdown, setShowMobileSortDropdown] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [categoryChips, setCategoryChips] = useState<CategoryChip[]>([]);
  const [filters, setFilters] = useState<ProductFiltersType>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    stockStatus: { inStock: true, lowStock: true, outOfStock: false },
    sortBy: 'featured'
  });
  
  // Refs
  const cartSheetRef = useRef<HTMLButtonElement>(null);
  const filtersSheetRef = useRef<HTMLButtonElement>(null);
  
  // Fetch products from the API
  const { 
    data: products = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: getQueryFn(),
    onSuccess: (data) => console.log("Mobile - Successfully loaded products:", data),
    onError: (err) => console.error("Mobile - Error loading products:", err)
  });
  
  // Debug information
  console.log("[Mobile Shop Page] Products:", products);
  console.log("[Mobile Shop Page] Loading:", isLoading);
  console.log("[Mobile Shop Page] Error:", isError, error);
  
  // Update category chips when products load
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(product => product.category).filter(Boolean))];
      setCategoryChips(
        uniqueCategories.map(category => ({
          id: category || '',
          name: category || '',
          active: filters.categories.includes(category || '')
        }))
      );
    }
  }, [products, filters.categories]);
  
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
          (product.description && product.description.toLowerCase().includes(query.toLowerCase()))
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
    
    // Update category chips
    setCategoryChips(prev => 
      prev.map(chip => ({
        ...chip,
        active: newFilters.categories.includes(chip.id)
      }))
    );
    
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
      if (filters.categories.length > 0 && (!product.category || !filters.categories.includes(product.category))) {
        return false;
      }
      
      // Price filter
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false;
      }
      
      // Stock filter
      const stockStatus = product.stockStatus || 
        (product.stockQuantity === 0 ? "Out of Stock" : 
         product.stockQuantity && product.stockQuantity <= 10 ? "Low Stock" : "In Stock");
      
      if (!filters.stockStatus.inStock && stockStatus === "In Stock") {
        return false;
      }
      if (!filters.stockStatus.lowStock && stockStatus === "Low Stock") {
        return false;
      }
      if (!filters.stockStatus.outOfStock && stockStatus === "Out of Stock") {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort
      switch (filters.sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "featured":
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });
  };
  
  // Quick view product
  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  };
  
  // Add to cart
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
    
    toast({
      title: t("Added to cart"),
      description: `${product.name} × ${quantity}`,
      duration: 2000
    });
    
    // Open cart
    setIsCartOpen(true);
  };
  
  // Remove from cart
  const handleRemoveFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };
  
  // Update cart quantity
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
  
  // Toggle favorite
  const handleToggleFavorite = (productId: number) => {
    setFavoriteProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  
  // Handle category chip click
  const handleCategoryChipClick = (categoryId: string) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId];
      
      return { ...prev, categories: newCategories };
    });
    
    setCategoryChips(prev => 
      prev.map(chip => ({
        ...chip,
        active: chip.id === categoryId ? !chip.active : chip.active
      }))
    );
  };
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Filter featured products for the carousel
  const featuredProducts = products.filter(product => product.featured).slice(0, 5);
  
  // Get the available filters
  const minProductPrice = Math.min(...products.map(p => p.price), 0);
  const maxProductPrice = Math.max(...products.map(p => p.price), 1000);
  const categories = [...new Set(products.map(p => p.category))];
  
  // Checkout steps
  const checkoutSteps = [
    { label: t("Cart"), description: t("Review items") },
    { label: t("Shipping"), description: t("Delivery details") },
    { label: t("Payment"), description: t("Select method") },
    { label: t("Review"), description: t("Confirm order") }
  ];
  
  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <NavigationBar 
        cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onSearchChange={(query) => setSearchQuery(query)}
        searchQuery={searchQuery}
      />
      
      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetTrigger asChild>
          <button ref={cartSheetRef} className="hidden">Open Cart</button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="mb-4">
            <SheetTitle>{t("Your Cart")}</SheetTitle>
          </SheetHeader>
          
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
              <div className="bg-muted rounded-full p-6 mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t("Your cart is empty")}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("Add items to your cart to see them here.")}
              </p>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  {t("Continue Shopping")}
                </Button>
              </SheetClose>
            </div>
          ) : (
            <>
              {/* Checkout Steps */}
              <div className="mb-4">
                <MobileStepper
                  steps={checkoutSteps}
                  activeStep={checkoutStep}
                  variant="progress"
                  onStepClick={(step) => setCheckoutStep(step)}
                  allowNavigation={true}
                  compact={true}
                />
              </div>
              
              {/* Cart Items - Step 0 */}
              {checkoutStep === 0 && (
                <>
                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-4 py-2">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <div className="h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                <span className="text-xl font-bold text-primary">
                                  {item.name.substring(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                            <p className="text-xs text-muted-foreground mb-1">
                              {item.unit && `Per ${item.unit}`}
                            </p>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center border rounded-md">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-none"
                                  onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-none"
                                  onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="ml-auto font-medium text-sm">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="space-y-4 pt-4">
                    <Separator />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t("Subtotal")}</span>
                        <span className="font-medium">{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm">{t("Shipping")}</span>
                        <span className="text-sm">{t("Calculated at next step")}</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-medium">
                      <span>{t("Total")}</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full"
                        onClick={() => setCheckoutStep(1)}
                      >
                        {t("Continue to Shipping")}
                      </Button>
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full">
                          {t("Continue Shopping")}
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </>
              )}
              
              {/* Shipping - Step 1 (placeholder) */}
              {checkoutStep === 1 && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCheckoutStep(0)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="ml-2 font-medium">{t("Shipping Information")}</h3>
                  </div>
                  
                  <div className="flex-1">
                    {/* Shipping form would go here */}
                    <p className="text-muted-foreground text-center my-8">
                      {t("Shipping form would be implemented here")}
                    </p>
                  </div>
                  
                  <SheetFooter className="mt-4">
                    <Button className="w-full" onClick={() => setCheckoutStep(2)}>
                      {t("Continue to Payment")}
                    </Button>
                  </SheetFooter>
                </div>
              )}
              
              {/* Payment - Step 2 (placeholder) */}
              {checkoutStep === 2 && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCheckoutStep(1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="ml-2 font-medium">{t("Payment Method")}</h3>
                  </div>
                  
                  <div className="flex-1">
                    {/* Payment form would go here */}
                    <p className="text-muted-foreground text-center my-8">
                      {t("Payment selection would be implemented here")}
                    </p>
                  </div>
                  
                  <SheetFooter className="mt-4">
                    <Button className="w-full" onClick={() => setCheckoutStep(3)}>
                      {t("Continue to Review")}
                    </Button>
                  </SheetFooter>
                </div>
              )}
              
              {/* Review - Step 3 (placeholder) */}
              {checkoutStep === 3 && (
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCheckoutStep(2)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="ml-2 font-medium">{t("Order Review")}</h3>
                  </div>
                  
                  <div className="flex-1">
                    {/* Order summary would go here */}
                    <p className="text-muted-foreground text-center my-8">
                      {t("Order summary and confirmation would be here")}
                    </p>
                  </div>
                  
                  <SheetFooter className="mt-4">
                    <Button className="w-full">
                      {t("Place Order")}
                    </Button>
                  </SheetFooter>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
      
      {/* Product Filters Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <button ref={filtersSheetRef} className="hidden">Open Filters</button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("Filters")}</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <ProductFilters
              availableCategories={categories}
              maxPrice={maxProductPrice}
              minPrice={minProductPrice}
              initialFilters={filters}
              onFilterChange={handleFilterChange}
              isMobile={true}
            />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Quick View Dialog */}
      {quickViewProduct && (
        <ProductQuickView
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          product={quickViewProduct}
          onAddToCart={handleAddToCart}
        />
      )}
      
      {/* Bulk Order Dialog */}
      <BulkOrderDialog 
        open={bulkOrderOpen} 
        onOpenChange={setBulkOrderOpen} 
      />
      
      {/* Pull to refresh wrapper */}
      <PullToRefresh 
        onRefresh={refetch} 
        pullThreshold={60}
        disabled={isSearching}
      >
        <main>
          {/* Hero Banner */}
          <div className="relative bg-gradient-to-r from-green-900 to-green-700 text-white py-8 px-4">
            <div className="max-w-md mx-auto text-center">
              <h1 className="text-2xl font-bold mb-3">
                {t("Farm-Fresh Products")}
              </h1>
              <p className="text-base text-primary-foreground/90 mb-5">
                {t("Direct from our sustainable farm to your table.")}
              </p>
              
              {/* Search */}
              <div className="relative mb-4">
                <Input
                  placeholder={t("Search products...")}
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="pl-10 pr-4 py-6 bg-white/10 text-white placeholder:text-white/60 border-transparent focus:border-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-white text-green-800 hover:bg-white/90"
                  onClick={() => {
                    if (filtersSheetRef.current) {
                      filtersSheetRef.current.click();
                    }
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t("Filter")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white bg-transparent text-white hover:bg-white/10"
                  onClick={() => setBulkOrderOpen(true)}
                >
                  {t("Bulk Order")}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Featured Products Carousel */}
          {featuredProducts.length > 0 && (
            <div className="px-4 py-6">
              <h2 className="text-xl font-bold mb-3">{t("Featured")}</h2>
              <div className="relative">
                {/* Swipe indicator animation - left side */}
                <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10 bg-gradient-to-r from-background to-transparent opacity-70 flex items-center">
                  <div className="animate-pulse-slow h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center ml-1">
                    <ChevronLeft className="h-5 w-5 text-foreground/70" />
                  </div>
                </div>
                
                <Carousel className="w-full">
                  <CarouselContent>
                    {featuredProducts.map(product => (
                      <CarouselItem key={product.id} className="basis-3/4 md:basis-1/2 lg:basis-1/3">
                        <ProductCard
                          product={product}
                          variant="featured"
                          isFavorite={favoriteProducts.includes(product.id)}
                          onQuickView={() => handleQuickView(product)}
                          onAddToCart={() => handleAddToCart(product)}
                          onToggleFavorite={() => handleToggleFavorite(product.id)}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-1 h-7 w-7 bg-background/80 backdrop-blur-sm shadow-md" />
                  <CarouselNext className="right-1 h-7 w-7 bg-background/80 backdrop-blur-sm shadow-md" />
                </Carousel>
                
                {/* Swipe indicator animation - right side */}
                <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10 bg-gradient-to-l from-background to-transparent opacity-70 flex items-center justify-end">
                  <div className="animate-pulse-slow h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center mr-1">
                    <ChevronRight className="h-5 w-5 text-foreground/70" />
                  </div>
                </div>
                
                {/* Pagination dots */}
                <div className="flex justify-center mt-3 gap-1">
                  {featuredProducts.slice(0, 5).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${
                        i === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-primary/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Category Chips */}
          {categoryChips.length > 0 && (
            <div className="px-4 overflow-x-auto no-scrollbar">
              <div className="flex flex-nowrap gap-2 py-2 mb-4">
                {categoryChips.map((chip) => (
                  <Badge
                    key={chip.id}
                    variant={chip.active ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-3 py-1 whitespace-nowrap cursor-pointer",
                      chip.active ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                    )}
                    onClick={() => handleCategoryChipClick(chip.id)}
                  >
                    {chip.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Product Grid */}
          <div className="px-4 pb-20">
            {isLoading ? (
              // Skeleton loaders
              <ResponsiveGrid 
                mobileColumns={2} 
                gap="md" 
                className="mx-auto justify-items-center"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse w-full max-w-[180px]">
                    <div className="aspect-square bg-muted rounded-t-lg"></div>
                    <CardContent className="p-3">
                      <div className="h-5 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-3/4 mb-3"></div>
                      <div className="h-7 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </ResponsiveGrid>
            ) : getFilteredProducts().length > 0 ? (
              <ResponsiveGrid 
                mobileColumns={2} 
                gap="md" 
                className="mx-auto justify-items-center"
              >
                {getFilteredProducts().map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="compact"
                    isFavorite={favoriteProducts.includes(product.id)}
                    onQuickView={() => handleQuickView(product)}
                    onAddToCart={() => handleAddToCart(product)}
                    onToggleFavorite={() => handleToggleFavorite(product.id)}
                    className="w-full max-w-[180px]"
                  />
                ))}
              </ResponsiveGrid>
            ) : (
              // Empty state
              <div className="py-12 text-center">
                <div className="bg-muted rounded-full p-6 mx-auto w-fit mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("No products found")}
                </h3>
                <p className="text-muted-foreground mb-6 px-6">
                  {searchQuery 
                    ? t("We couldn't find any products matching your search.") 
                    : t("There are no products matching your selected filters.")}
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
                    setCategoryChips(prev => 
                      prev.map(chip => ({
                        ...chip,
                        active: false
                      }))
                    );
                  }}
                >
                  {t("Reset Filters")}
                </Button>
              </div>
            )}
          </div>
          
          {/* Newsletter Section */}
          <div className="bg-primary/10 px-4 py-8 mt-8 mb-12">
            <div className="max-w-sm mx-auto text-center">
              <h3 className="text-lg font-bold mb-2">{t("Join Our Newsletter")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("Get updates on new products, seasonal offers, and farming tips.")}
              </p>
              <EmailInput
                placeholder={t("Your email address")}
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                onValidationChange={setEmailIsValid}
                showValidationIcon={true}
                className="mb-3"
              />
              <Button 
                className="w-full"
                disabled={!emailIsValid || !emailValue}
                onClick={() => {
                  // Handle newsletter subscription
                  if (emailIsValid && emailValue) {
                    toast({
                      title: t("Subscribed to newsletter"),
                      description: t("Thank you for subscribing to our newsletter!"),
                      duration: 3000
                    });
                    setEmailValue("");
                  }
                }}
              >
                {t("Subscribe")}
              </Button>
            </div>
          </div>
        </main>
      </PullToRefresh>
      
      {/* Sticky Add To Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 flex items-center justify-between z-10">
        <Button
          variant="outline"
          className="gap-1 text-sm"
          onClick={() => {
            if (filtersSheetRef.current) {
              filtersSheetRef.current.click();
            }
          }}
        >
          <Filter className="h-4 w-4" />
          {t("Filter")}
        </Button>
        
        <Button
          className="gap-1 text-sm flex-1 mx-2"
          onClick={() => {
            if (cartSheetRef.current) {
              cartSheetRef.current.click();
            }
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          {cartItems.length > 0 && <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>}
          <span className="ml-1">{formatCurrency(cartTotal)}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => setLocation('/favorites')}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}