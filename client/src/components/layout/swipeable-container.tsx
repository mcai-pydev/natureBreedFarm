import React, { 
  useState, 
  useRef, 
  useEffect, 
  ReactNode, 
  TouchEvent, 
  CSSProperties 
} from 'react';
import { cn } from '@/lib/utils';

interface SwipeableContainerProps {
  children: ReactNode | ReactNode[];
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultTouchmove?: boolean;
  disabled?: boolean;
  allowVerticalSwipe?: boolean;
  allowHorizontalSwipe?: boolean;
  showSwipeIndicator?: boolean;
  style?: CSSProperties;
}

export function SwipeableContainer({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefaultTouchmove = true,
  disabled = false,
  allowVerticalSwipe = false,
  allowHorizontalSwipe = true,
  showSwipeIndicator = false,
  style,
}: SwipeableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled || touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartXRef.current;
    const diffY = touchY - touchStartYRef.current;
    
    // Determine primary direction of movement
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY);
    
    if (isHorizontal && allowHorizontalSwipe) {
      if (preventDefaultTouchmove) e.preventDefault();
      setDragOffset({ x: diffX * 0.5, y: 0 });
      setSwipeDirection(diffX > 0 ? 'right' : 'left');
    } else if (!isHorizontal && allowVerticalSwipe) {
      if (preventDefaultTouchmove) e.preventDefault();
      setDragOffset({ x: 0, y: diffY * 0.5 });
      setSwipeDirection(diffY > 0 ? 'down' : 'up');
    }
  };

  const handleTouchEnd = () => {
    if (disabled || touchStartXRef.current === null || touchStartYRef.current === null) return;
    
    const diffX = dragOffset.x;
    const diffY = dragOffset.y;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);
    
    // Handle swipe events if they exceed the threshold
    if (absX > absY && absX > threshold && allowHorizontalSwipe) {
      if (diffX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diffX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absY > absX && absY > threshold && allowVerticalSwipe) {
      if (diffY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (diffY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    
    // Reset state
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  // Clean up touch handlers when unmounting
  useEffect(() => {
    return () => {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };
  }, []);

  // Apply transform styles based on drag offset during touch
  const transformStyle: CSSProperties = isDragging
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        transition: 'none',
      }
    : {
        transform: 'translate(0, 0)',
        transition: 'transform 0.3s ease',
      };
  
  // Combine our dynamic styles with provided styles
  const combinedStyle = {
    ...style,
    ...transformStyle,
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={combinedStyle}
    >
      {children}
      
      {/* Optional swipe indicators */}
      {showSwipeIndicator && isDragging && swipeDirection && (
        <div className={cn(
          'absolute pointer-events-none inset-0 flex items-center justify-center opacity-30',
          swipeDirection === 'left' && 'justify-start pl-4',
          swipeDirection === 'right' && 'justify-end pr-4',
          swipeDirection === 'up' && 'items-start pt-4',
          swipeDirection === 'down' && 'items-end pb-4',
        )}>
          <div className={cn(
            'bg-primary text-primary-foreground rounded-full flex items-center justify-center',
            swipeDirection === 'left' || swipeDirection === 'right' 
              ? 'h-12 w-12' 
              : 'h-12 w-12'
          )}>
            {swipeDirection === 'left' && '←'}
            {swipeDirection === 'right' && '→'}
            {swipeDirection === 'up' && '↑'}
            {swipeDirection === 'down' && '↓'}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A more specialized swipeable container specifically for tab-like content
 */
interface SwipeableTabsProps {
  children: ReactNode[];
  activeIndex: number;
  onChangeIndex: (index: number) => void;
  className?: string;
  style?: CSSProperties;
  showIndicators?: boolean;
}

export function SwipeableTabs({
  children,
  activeIndex,
  onChangeIndex,
  className,
  style,
  showIndicators = false,
}: SwipeableTabsProps) {
  const handleSwipeLeft = () => {
    if (activeIndex < React.Children.count(children) - 1) {
      onChangeIndex(activeIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeIndex > 0) {
      onChangeIndex(activeIndex - 1);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <SwipeableContainer
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        style={style}
        showSwipeIndicator={showIndicators}
        allowHorizontalSwipe={true}
        allowVerticalSwipe={false}
      >
        {React.Children.toArray(children)[activeIndex]}
      </SwipeableContainer>
      
      {/* Optional pagination indicators */}
      {showIndicators && (
        <div className="flex justify-center mt-4 gap-1">
          {React.Children.map(children, (_, index) => (
            <button
              key={index}
              onClick={() => onChangeIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === activeIndex 
                  ? "bg-primary w-4" 
                  : "bg-muted-foreground/30"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}