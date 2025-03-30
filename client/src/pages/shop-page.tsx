import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  ShoppingCart, 
  Filter, 
  X,
  Star, 
  ChevronDown, 
  SortAsc, 
  SortDesc 
} from "lucide-react";
import { Product } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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

interface CartItem extends Product {
  quantity: number;
}

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("default");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Fetch products from the API
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || (product.category || "general") === category;
    return matchesSearch && matchesCategory;
  });
  
  // Sort products based on sorting option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  // Get unique categories from products
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "general").filter(Boolean)))];
  
  // Add item to cart
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };
  
  // Update item quantity in cart
  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev => 
      prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity <= 0 
            ? { ...item, quantity: 1 } 
            : { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };
  
  // Calculate total cart value
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity, 
    0
  );
  
  // Featured products (take 4 products with highest stock)
  const featuredProducts = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 4);
  
  return (
    <div className="min-h-screen bg-green-50/50">
      {/* Header with search */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto py-4 px-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <h1 className="text-2xl font-bold text-primary">Farm Shop</h1>
          
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border-green-100 focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart
                  {cartItems.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-white">
                      {cartItems.reduce((total, item) => total + item.quantity, 0)}
                    </Badge>
                  )}
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
                        <div className="bg-green-100 rounded-md w-16 h-16 flex items-center justify-center">
                          <span className="text-lg text-primary font-medium">{item.name.substring(0, 2)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-500">{formatCurrency(item.price)} per {item.unit}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
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
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop Fresh, Farm-to-Table Products!</h2>
          <p className="text-green-100 max-w-2xl mx-auto mb-6">
            Directly sourced from our sustainable farm. Healthy, organic, and delivered fresh to your doorstep.
          </p>
          <Button className="bg-white text-primary hover:bg-green-50">Explore Now</Button>
        </div>
      </div>
      
      {/* Featured Products Carousel */}
      <div className="container mx-auto py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
        <Carousel className="w-full max-w-5xl mx-auto">
          <CarouselContent>
            {featuredProducts.map(product => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100 h-full flex flex-col">
                  <div className="bg-green-50 rounded-md p-4 flex items-center justify-center h-40 mb-4">
                    <span className="text-4xl text-primary font-semibold">{product.name.substring(0, 2)}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                    <Button size="sm" onClick={() => addToCart(product)}>Add to Cart</Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-white" />
          <CarouselNext className="right-0 bg-white" />
        </Carousel>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters for desktop */}
          <div className="hidden lg:block w-64 bg-white p-4 rounded-lg border border-green-100 shadow-sm h-fit">
            <h3 className="font-semibold mb-4">Filters</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Categories</h4>
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center">
                    <Button
                      variant={category === cat ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setCategory(cat || "all")}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h4 className="text-sm font-medium mb-2">Sort By</h4>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Mobile filters button */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setMobileFiltersOpen(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Mobile filters sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Categories</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center">
                      <Button
                        variant={category === cat ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setCategory(cat || "all");
                          setMobileFiltersOpen(false);
                        }}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Products grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-40 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                    <CardFooter className="flex justify-between p-4">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </CardFooter>
                  </Card>
                ))
              ) : sortedProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No products found</h3>
                  <p className="text-sm text-gray-400">Try changing your search or filter criteria</p>
                </div>
              ) : (
                sortedProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-green-50 h-40 flex items-center justify-center p-4">
                      <span className="text-4xl text-primary font-semibold">{product.name.substring(0, 2)}</span>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.stock < 10 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                            Limited
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(3 + Math.random() * 2)
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">In Stock: {product.stock}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-4 bg-white border-t border-gray-100">
                      <span className="font-bold text-lg">{formatCurrency(product.price)}</span>
                      <Button size="sm" onClick={() => addToCart(product)}>
                        Add to Cart
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="bg-white py-12 px-4 mt-8 border-t border-green-100">
        <div className="container mx-auto">
          <h2 className="text-2xl font-semibold mb-8 text-center">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Sarah Thompson",
                review: "The freshest produce I've ever purchased online. Everything arrived in perfect condition!",
                rating: 5
              },
              {
                name: "Michael Johnson",
                review: "I love supporting local farmers. The quality is outstanding and prices are reasonable.",
                rating: 4
              },
              {
                name: "Emily Davis",
                review: "Been ordering weekly for 3 months now. Consistent quality and excellent customer service.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-green-50/70">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <Avatar className="mr-3">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{testimonial.name}</h4>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < testimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-primary to-green-600 py-10 px-4 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Planning an Event?</h2>
          <p className="mb-6 text-green-50">Contact us for bulk supplies at wholesale prices.</p>
          <Button variant="outline" className="bg-white text-primary hover:bg-green-50 border-white">
            Contact for Bulk Orders
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-green-100 py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Nature Breed Farm</h3>
              <p className="text-sm text-gray-500">
                Growing sustainable, organic produce since 2010. Our commitment is to quality, freshness, and environmental responsibility.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Home</li>
                <li>Shop</li>
                <li>About Us</li>
                <li>Farm Tours</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Policies</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
                <li>Shipping Policy</li>
                <li>Return Policy</li>
                <li>FAQs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Subscribe to our Newsletter</h3>
              <p className="text-sm text-gray-500 mb-4">
                Get updates on new products, seasonal offers, and farming tips.
              </p>
              <div className="flex">
                <Input placeholder="Your email" className="rounded-r-none" />
                <Button className="rounded-l-none">Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}