import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeableContainerProps {
  children: ReactNode[];
  className?: string;
  showIndicator?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  initialSlide?: number;
  itemClassName?: string;
  onChange?: (index: number) => void;
  swipeThreshold?: number;
  animationDuration?: number;
}

export function SwipeableContainer({
  children,
  className,
  showIndicator = true,
  showArrows = false,
  loop = false,
  initialSlide = 0,
  itemClassName,
  onChange,
  swipeThreshold = 50,
  animationDuration = 300
}: SwipeableContainerProps) {
  const [activeIndex, setActiveIndex] = useState(initialSlide);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const childrenArray = React.Children.toArray(children);
  
  // Handle touch start event
  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };
  
  // Handle touch move event
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    if (Math.abs(diff) > 10) {
      // Prevent scrolling when swiping horizontally
      e.preventDefault();
    }
    
    // Calculate the translate offset for the drag
    setTranslateX(diff);
  };
  
  // Handle touch end event
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = currentX.current - startX.current;
    
    if (Math.abs(diff) >= swipeThreshold) {
      // Swiped past threshold, change slide
      if (diff > 0 && (activeIndex > 0 || loop)) {
        // Swiped right (prev)
        handlePrev();
      } else if (diff < 0 && (activeIndex < childrenArray.length - 1 || loop)) {
        // Swiped left (next)
        handleNext();
      }
    }
    
    // Reset drag state
    setTranslateX(0);
    setIsDragging(false);
  };
  
  // Handle next slide
  const handleNext = () => {
    let nextIndex: number;
    
    if (activeIndex >= childrenArray.length - 1) {
      // If at the last slide
      nextIndex = loop ? 0 : childrenArray.length - 1;
    } else {
      nextIndex = activeIndex + 1;
    }
    
    setActiveIndex(nextIndex);
    onChange?.(nextIndex);
  };
  
  // Handle previous slide
  const handlePrev = () => {
    let prevIndex: number;
    
    if (activeIndex <= 0) {
      // If at the first slide
      prevIndex = loop ? childrenArray.length - 1 : 0;
    } else {
      prevIndex = activeIndex - 1;
    }
    
    setActiveIndex(prevIndex);
    onChange?.(prevIndex);
  };
  
  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, activeIndex, childrenArray.length, loop]);
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Container with swipeable content */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden"
      >
        <div
          className="flex transition-transform"
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${translateX}px))`,
            transitionDuration: isDragging ? '0ms' : `${animationDuration}ms`
          }}
        >
          {childrenArray.map((child, index) => (
            <div 
              key={index} 
              className={cn(
                "flex-shrink-0 w-full", 
                itemClassName
              )}
              aria-hidden={index !== activeIndex}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      
      {/* Slide indicators */}
      {showIndicator && childrenArray.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === activeIndex 
                  ? "bg-primary w-4" 
                  : "bg-muted-foreground/30"
              )}
              onClick={() => {
                setActiveIndex(index);
                onChange?.(index);
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Navigation arrows */}
      {showArrows && childrenArray.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute top-1/2 left-2 -translate-y-1/2 opacity-70 hover:opacity-100",
              (!loop && activeIndex === 0) && "hidden"
            )}
            onClick={handlePrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute top-1/2 right-2 -translate-y-1/2 opacity-70 hover:opacity-100",
              (!loop && activeIndex === childrenArray.length - 1) && "hidden"
            )}
            onClick={handleNext}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}