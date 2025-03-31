import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

export type ProductCategory = string;

export interface PriceRange {
  min: number;
  max: number;
}

export interface StockStatus {
  inStock: boolean;
  lowStock: boolean;
  outOfStock: boolean;
}

export interface ProductFilters {
  categories: ProductCategory[];
  priceRange: PriceRange;
  stockStatus: StockStatus;
  sortBy: string;
}

interface ProductFiltersProps {
  availableCategories: ProductCategory[];
  maxPrice: number;
  minPrice: number;
  initialFilters?: Partial<ProductFilters>;
  onFilterChange: (filters: ProductFilters) => void;
  isMobile?: boolean;
}

export function ProductFilters({
  availableCategories,
  maxPrice,
  minPrice,
  initialFilters,
  onFilterChange,
  isMobile = false,
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: initialFilters?.categories || [],
    priceRange: initialFilters?.priceRange || { min: minPrice, max: maxPrice },
    stockStatus: initialFilters?.stockStatus || { inStock: true, lowStock: true, outOfStock: false },
    sortBy: initialFilters?.sortBy || "featured",
  });
  
  // Update external state when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  const handleCategoryChange = (category: string, checked: boolean) => {
    setFilters(prev => {
      if (checked) {
        return { ...prev, categories: [...prev.categories, category] };
      } else {
        return { ...prev, categories: prev.categories.filter(c => c !== category) };
      }
    });
  };
  
  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min: value[0], max: value[1] },
    }));
  };
  
  const handleStockStatusChange = (status: keyof StockStatus, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      stockStatus: { ...prev.stockStatus, [status]: checked },
    }));
  };
  
  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      categories: [],
      priceRange: { min: minPrice, max: maxPrice },
      stockStatus: { inStock: true, lowStock: true, outOfStock: false },
      sortBy: "featured",
    });
  };
  
  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.priceRange.min > minPrice ||
      filters.priceRange.max < maxPrice ||
      !filters.stockStatus.inStock ||
      !filters.stockStatus.lowStock ||
      filters.stockStatus.outOfStock ||
      filters.sortBy !== "featured"
    );
  };
  
  const filtersContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Reset All
          </Button>
        )}
      </div>
      
      <Accordion type="multiple" defaultValue={["categories", "price", "stock"]}>
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {availableCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category, checked === true)
                    }
                  />
                  <label 
                    htmlFor={`category-${category}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider 
                defaultValue={[filters.priceRange.min, filters.priceRange.max]}
                min={minPrice}
                max={maxPrice}
                step={1}
                onValueChange={handlePriceChange}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm">{formatCurrency(filters.priceRange.min)}</span>
                <span className="text-sm">{formatCurrency(filters.priceRange.max)}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="stock">
          <AccordionTrigger>Stock Status</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="in-stock"
                  checked={filters.stockStatus.inStock}
                  onCheckedChange={(checked) => 
                    handleStockStatusChange("inStock", checked === true)
                  }
                />
                <label 
                  htmlFor="in-stock"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  In Stock
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="low-stock"
                  checked={filters.stockStatus.lowStock}
                  onCheckedChange={(checked) => 
                    handleStockStatusChange("lowStock", checked === true)
                  }
                />
                <label 
                  htmlFor="low-stock"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Low Stock
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="out-of-stock"
                  checked={filters.stockStatus.outOfStock}
                  onCheckedChange={(checked) => 
                    handleStockStatusChange("outOfStock", checked === true)
                  }
                />
                <label 
                  htmlFor="out-of-stock"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Out of Stock
                </label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="space-y-2">
        <label htmlFor="sort-select" className="text-sm font-medium">
          Sort By
        </label>
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger id="sort-select">
            <SelectValue placeholder="Sort by" />
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
  
  if (isMobile) {
    return (
      <div className="flex items-center justify-between mb-4">
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
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
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters() && (
                <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {filters.categories.length +
                    (filters.priceRange.min > minPrice || filters.priceRange.max < maxPrice ? 1 : 0) +
                    (filters.stockStatus.inStock !== true || 
                     filters.stockStatus.lowStock !== true || 
                     filters.stockStatus.outOfStock !== false ? 1 : 0)
                  }
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter and sort products by category, price, and availability
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">{filtersContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
  
  return <div className="w-full">{filtersContent}</div>;
}