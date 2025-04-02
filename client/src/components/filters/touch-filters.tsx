import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { X, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Filter option type
export interface FilterOption<T = string> {
  id: string;
  label: string;
  value: T;
  count?: number;
  icon?: ReactNode;
  color?: string;
}

// Filter group type
export interface FilterGroup<T = string> {
  id: string;
  label: string;
  options: FilterOption<T>[];
  multiSelect?: boolean;
  expanded?: boolean;
}

interface TouchFilterChipProps<T = string> {
  option: FilterOption<T>;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

export function TouchFilterChip<T = string>({
  option,
  isSelected,
  onClick,
  variant = 'outline'
}: TouchFilterChipProps<T>) {
  const { t } = useTranslation();
  
  return (
    <Badge
      variant={isSelected ? 'default' : variant}
      className={cn(
        "px-3 py-1 h-8 cursor-pointer select-none flex items-center gap-1.5",
        isSelected ? "" : "hover:bg-muted",
        option.color && isSelected && `bg-${option.color}-500 hover:bg-${option.color}-600`,
        option.color && !isSelected && `text-${option.color}-500 border-${option.color}-200`
      )}
      onClick={onClick}
    >
      {option.icon && (
        <span className="h-3.5 w-3.5">{option.icon}</span>
      )}
      <span>{t(option.label)}</span>
      {option.count !== undefined && !isSelected && (
        <span className="ml-1 text-xs opacity-70">({option.count})</span>
      )}
      {isSelected && (
        <X className="h-3.5 w-3.5 ml-1" />
      )}
    </Badge>
  );
}

interface TouchFilterBarProps {
  selectedFilters: Record<string, any>;
  onFilterChange: (groupId: string, value: any) => void;
  filterGroups: FilterGroup[];
  className?: string;
  showFilterButton?: boolean;
  filtersButtonLabel?: string;
  showClearButton?: boolean;
  clearButtonLabel?: string;
  onClearFilters?: () => void;
}

export function TouchFilterBar({
  selectedFilters,
  onFilterChange,
  filterGroups,
  className,
  showFilterButton = true,
  filtersButtonLabel,
  showClearButton = true,
  clearButtonLabel,
  onClearFilters
}: TouchFilterBarProps) {
  const { t } = useTranslation();
  const appliedFiltersCount = Object.keys(selectedFilters).reduce((count, key) => {
    const value = selectedFilters[key];
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);
  
  // Get all selected filter options for the horizontal scroll view
  const getSelectedOptions = () => {
    const options: { groupId: string; option: FilterOption }[] = [];
    
    filterGroups.forEach(group => {
      const selectedValues = selectedFilters[group.id];
      
      if (!selectedValues) return;
      
      if (Array.isArray(selectedValues)) {
        selectedValues.forEach(value => {
          const option = group.options.find(opt => opt.value === value);
          if (option) {
            options.push({ groupId: group.id, option });
          }
        });
      } else {
        const option = group.options.find(opt => opt.value === selectedValues);
        if (option) {
          options.push({ groupId: group.id, option });
        }
      }
    });
    
    return options;
  };
  
  // Handle removing a filter
  const handleRemoveFilter = (groupId: string, value: any) => {
    const group = filterGroups.find(g => g.id === groupId);
    
    if (!group) return;
    
    if (group.multiSelect) {
      const currentValues = (selectedFilters[groupId] as any[]) || [];
      onFilterChange(groupId, currentValues.filter(v => v !== value));
    } else {
      onFilterChange(groupId, null);
    }
  };
  
  const selectedOptions = getSelectedOptions();
  
  return (
    <div className={cn("w-full flex space-x-2 overflow-hidden", className)}>
      {showFilterButton && (
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="shrink-0 h-8"
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {t(filtersButtonLabel || 'Filters')}
              {appliedFiltersCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
                  {appliedFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <SheetHeader className="px-4 py-3 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <SheetTitle>{t('Filters')}</SheetTitle>
                {showClearButton && appliedFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onClearFilters?.()}
                  >
                    {t(clearButtonLabel || 'Clear all')}
                  </Button>
                )}
              </div>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(80vh-8rem)]">
              <div className="p-4 space-y-6">
                {filterGroups.map(group => (
                  <FilterGroupSection
                    key={group.id}
                    group={group}
                    selectedValues={selectedFilters[group.id]}
                    onFilterChange={onFilterChange}
                  />
                ))}
              </div>
            </ScrollArea>
            
            <SheetFooter className="px-4 py-3 border-t sticky bottom-0 bg-background z-10">
              <SheetClose asChild>
                <Button className="w-full">
                  {t('Apply Filters')}
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
      
      {showClearButton && appliedFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-2"
          onClick={() => onClearFilters?.()}
        >
          <X className="w-3.5 h-3.5 mr-1" />
          {t(clearButtonLabel || 'Clear')}
        </Button>
      )}
      
      {selectedOptions.length > 0 ? (
        <ScrollArea className="w-full">
          <div className="flex space-x-2 py-1 overflow-x-auto">
            {selectedOptions.map(({ groupId, option }) => (
              <TouchFilterChip
                key={`${groupId}-${option.id}`}
                option={option}
                isSelected={true}
                onClick={() => handleRemoveFilter(groupId, option.value)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-muted-foreground text-sm flex items-center px-2">
          {t('No filters applied')}
        </div>
      )}
    </div>
  );
}

interface FilterGroupSectionProps {
  group: FilterGroup;
  selectedValues: any;
  onFilterChange: (groupId: string, value: any) => void;
}

function FilterGroupSection({
  group,
  selectedValues,
  onFilterChange
}: FilterGroupSectionProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(group.expanded || false);
  
  const isOptionSelected = (option: FilterOption) => {
    if (!selectedValues) return false;
    
    if (Array.isArray(selectedValues)) {
      return selectedValues.includes(option.value);
    }
    
    return selectedValues === option.value;
  };
  
  const handleOptionClick = (option: FilterOption) => {
    if (group.multiSelect) {
      const currentValues = (selectedValues as any[]) || [];
      const isSelected = currentValues.includes(option.value);
      
      if (isSelected) {
        onFilterChange(
          group.id, 
          currentValues.filter(v => v !== option.value)
        );
      } else {
        onFilterChange(group.id, [...currentValues, option.value]);
      }
    } else {
      if (selectedValues === option.value) {
        onFilterChange(group.id, null);
      } else {
        onFilterChange(group.id, option.value);
      }
    }
  };
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm flex items-center justify-between">
        <span>{t(group.label)}</span>
        {group.options.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 p-0 text-xs text-muted-foreground"
          >
            {isExpanded ? t('Show less') : t('Show all')}
          </Button>
        )}
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {group.options
          .slice(0, isExpanded ? undefined : 5)
          .map(option => {
            const selected = isOptionSelected(option);
            
            return group.multiSelect ? (
              <div 
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer",
                  "border border-input transition-colors",
                  selected 
                    ? "bg-primary/10 border-primary/50" 
                    : "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center",
                  selected 
                    ? "bg-primary border-primary text-primary-foreground" 
                    : "bg-background border-muted-foreground/30"
                )}>
                  {selected && <Check className="w-3 h-3" />}
                </div>
                <span>{t(option.label)}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    ({option.count})
                  </span>
                )}
              </div>
            ) : (
              <div
                key={option.id}
                onClick={() => handleOptionClick(option)}
                className={cn(
                  "px-3 py-1.5 rounded-md cursor-pointer",
                  "border transition-colors",
                  selected 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "hover:bg-muted border-input"
                )}
              >
                <span>{t(option.label)}</span>
                {option.count !== undefined && !selected && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({option.count})
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}