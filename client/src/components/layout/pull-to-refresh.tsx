import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<any>;
  className?: string;
  pullThreshold?: number;
  maxPullDistance?: number;
  refreshIndicatorHeight?: number;
  disabled?: boolean;
  pullText?: string;
  releaseText?: string;
  refreshingText?: string;
  showPullText?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  pullThreshold = 80,
  maxPullDistance = 120,
  refreshIndicatorHeight = 60,
  disabled = false,
  pullText,
  releaseText,
  refreshingText,
  showPullText = true
}: PullToRefreshProps) {
  const { t } = useTranslation();
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const ptrText = {
    pull: pullText || 'Pull down to refresh',
    release: releaseText || 'Release to refresh',
    refreshing: refreshingText || 'Refreshing...'
  };

  // Handle touch start event
  const handleTouchStart = (e: TouchEvent) => {
    // Only activate pull-to-refresh if at the top of the content
    if (disabled || (contentRef.current && contentRef.current.scrollTop > 0)) {
      return;
    }

    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setIsPulling(true);
  };

  // Handle touch move event
  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);

    // Apply resistance as the pull gets longer
    const resistance = 0.5;
    const resistedDistance = Math.min(maxPullDistance, distance * resistance);
    
    // Update pull distance
    setPullDistance(resistedDistance);

    // Prevent scrolling if pulling down
    if (distance > 5) {
      e.preventDefault();
    }
  };

  // Handle touch end event
  const handleTouchEnd = async () => {
    if (!isPulling) return;

    // If pulled past threshold, trigger refresh
    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      // Keep showing the indicator at the threshold height during refresh
      setPullDistance(refreshIndicatorHeight);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        // Reset after refresh is done
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  useEffect(() => {
    // If disabled, make sure we reset the state
    if (disabled) {
      setIsPulling(false);
      setPullDistance(0);
      setIsRefreshing(false);
    }
  }, [disabled]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.addEventListener('touchstart', handleTouchStart, { passive: false });
    content.addEventListener('touchmove', handleTouchMove, { passive: false });
    content.addEventListener('touchend', handleTouchEnd);

    return () => {
      content.removeEventListener('touchstart', handleTouchStart);
      content.removeEventListener('touchmove', handleTouchMove);
      content.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, pullThreshold]);

  // Calculate progress percentage for the indicator
  const progress = Math.min(100, (pullDistance / pullThreshold) * 100);
  
  // Determine what text to show
  const refreshText = isRefreshing
    ? t(ptrText.refreshing)
    : pullDistance >= pullThreshold
    ? t(ptrText.release)
    : t(ptrText.pull);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex flex-col items-center justify-end",
          "transition-opacity duration-200",
          pullDistance === 0 && !isRefreshing ? "opacity-0" : "opacity-100"
        )}
        style={{
          height: `${pullDistance}px`,
          top: -pullDistance,
        }}
      >
        <div className="flex flex-col items-center justify-center h-full py-2">
          <div className="relative flex items-center justify-center mb-1">
            {isRefreshing ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <svg
                className="w-5 h-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: `rotate(${pullDistance >= pullThreshold ? 180 : progress * 1.8}deg)`,
                  transition: pullDistance >= pullThreshold ? 'transform 0.2s ease-in-out' : 'none'
                }}
              >
                <path
                  d="M12 5V19M12 5L6 11M12 5L18 11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          {showPullText && (
            <span className="text-xs text-muted-foreground font-medium">
              {refreshText}
            </span>
          )}
        </div>
      </div>

      {/* Content with padding for pull indicator */}
      <div
        ref={contentRef}
        className="w-full h-full overflow-auto"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: !isPulling || isRefreshing ? 'transform 0.2s ease-out' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
}