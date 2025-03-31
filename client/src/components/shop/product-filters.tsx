import { useState, useEffect } from "react";
import { Filter, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

export type PriceRange = {
  min: number;
  max: number;
};

export type StockStatus = {
  inStock: boolean;
  lowStock: boolean;
  outOfStock: boolean;
};

export type ProductFilters = {
  categories: string[];
  priceRange: PriceRange;
  stockStatus: StockStatus;
  sortBy: string;
};

interface ProductFiltersProps {
  availableCategories: string[];
  maxPrice: number;
  minPrice: number;
  initialFilters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  isMobile?: boolean;
}

export function ProductFilters({
  availableCategories,
  maxPrice,
  minPrice,
  initialFilters,
  onFilterChange,
  isMobile = false
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.priceRange.min > minPrice || filters.priceRange.max < maxPrice) count++;
    const stockStatusCount = Object.values(filters.stockStatus).filter(v => !v).length;
    if (stockStatusCount > 0) count++;
    if (filters.sortBy !== "featured") count++;
    setActiveFiltersCount(count);
  }, [filters, minPrice, maxPrice]);
  
  // When the initialFilters prop changes, update the internal state
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    const defaultFilters: ProductFilters = {
      categories: [],
      priceRange: { min: minPrice, max: maxPrice },
      stockStatus: { inStock: true, lowStock: true, outOfStock: false },
      sortBy: "featured"
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // Toggle category selection
  const toggleCategory = (category: string) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };
  
  // Update price range
  const updatePriceRange = (values: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min: values[0], max: values[1] }
    }));
  };
  
  // Toggle stock status
  const toggleStockStatus = (key: keyof StockStatus) => {
    setFilters(prev => ({
      ...prev,
      stockStatus: {
        ...prev.stockStatus,
        [key]: !prev.stockStatus[key]
      }
    }));
  };
  
  // Update sort option
  const updateSortOption = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };
  
  // Mobile filter trigger
  if (isMobile) {
    return (
      <div className="mb-4 flex items-center justify-between">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-1">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 h-5 min-w-5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Filters</span>
                <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`category-${category}`} 
                        checked={filters.categories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label 
                        htmlFor={`category-${category}`}
                        className="capitalize"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Price Range */}
              <div>
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <div className="px-2">
                  <Slider
                    defaultValue={[filters.priceRange.min, filters.priceRange.max]}
                    min={minPrice}
                    max={maxPrice}
                    step={1}
                    value={[filters.priceRange.min, filters.priceRange.max]}
                    onValueChange={updatePriceRange}
                    className="mb-4"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatCurrency(filters.priceRange.min)}</span>
                    <span>{formatCurrency(filters.priceRange.max)}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Stock Status */}
              <div>
                <h3 className="text-sm font-medium mb-3">Stock Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inStock" 
                      checked={filters.stockStatus.inStock}
                      onCheckedChange={() => toggleStockStatus('inStock')}
                    />
                    <Label htmlFor="inStock">In Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="lowStock" 
                      checked={filters.stockStatus.lowStock}
                      onCheckedChange={() => toggleStockStatus('lowStock')}
                    />
                    <Label htmlFor="lowStock">Low Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outOfStock" 
                      checked={filters.stockStatus.outOfStock}
                      onCheckedChange={() => toggleStockStatus('outOfStock')}
                    />
                    <Label htmlFor="outOfStock">Out of Stock</Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Sort Options */}
              <div>
                <h3 className="text-sm font-medium mb-3">Sort By</h3>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={updateSortOption}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Featured" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-8">
              <Button className="w-full" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort By:</span>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value) => {
              updateSortOption(value);
              applyFilters();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }
  
  // Desktop filter panel
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters} 
            className="h-8 px-2 text-xs"
          >
            Reset All
          </Button>
        )}
      </div>
      
      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium mb-3">Categories</h3>
        <div className="space-y-2">
          {availableCategories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={`desktop-category-${category}`} 
                checked={filters.categories.includes(category)}
                onCheckedChange={() => {
                  toggleCategory(category);
                  applyFilters();
                }}
              />
              <Label 
                htmlFor={`desktop-category-${category}`}
                className="capitalize"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      <Separator />
      
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={[filters.priceRange.min, filters.priceRange.max]}
            min={minPrice}
            max={maxPrice}
            step={1}
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={updatePriceRange}
            onValueCommit={applyFilters}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm">
            <span>{formatCurrency(filters.priceRange.min)}</span>
            <span>{formatCurrency(filters.priceRange.max)}</span>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Stock Status */}
      <div>
        <h3 className="text-sm font-medium mb-3">Stock Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="desktop-inStock" 
              checked={filters.stockStatus.inStock}
              onCheckedChange={() => {
                toggleStockStatus('inStock');
                applyFilters();
              }}
            />
            <Label htmlFor="desktop-inStock">In Stock</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="desktop-lowStock" 
              checked={filters.stockStatus.lowStock}
              onCheckedChange={() => {
                toggleStockStatus('lowStock');
                applyFilters();
              }}
            />
            <Label htmlFor="desktop-lowStock">Low Stock</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="desktop-outOfStock" 
              checked={filters.stockStatus.outOfStock}
              onCheckedChange={() => {
                toggleStockStatus('outOfStock');
                applyFilters();
              }}
            />
            <Label htmlFor="desktop-outOfStock">Out of Stock</Label>
          </div>
        </div>
      </div>
      
      <Separator />
      
      {/* Sort Options */}
      <div>
        <h3 className="text-sm font-medium mb-3">Sort By</h3>
        <Select 
          value={filters.sortBy} 
          onValueChange={(value) => {
            updateSortOption(value);
            applyFilters();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}