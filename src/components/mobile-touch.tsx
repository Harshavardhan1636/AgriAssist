'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  disabled?: boolean;
  haptic?: boolean;
}

// Enhanced touch feedback component for mobile
export function TouchFeedback({ 
  children, 
  className, 
  onTap, 
  disabled = false,
  haptic = false 
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const touchStartTime = useRef<number>(0);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    touchStartTime.current = Date.now();
    
    // Haptic feedback on supported devices
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [disabled, haptic]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    setIsPressed(false);
    
    // Only trigger onTap if it was a quick touch (not a long press)
    const touchDuration = Date.now() - touchStartTime.current;
    if (touchDuration < 500 && onTap) {
      onTap();
    }
  }, [disabled, onTap]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <div
      className={cn(
        'touch-target transition-all duration-150 select-none',
        isPressed && !disabled && 'scale-95 opacity-80',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
    >
      {children}
    </div>
  );
}

// Swipe gesture handler
interface SwipeHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}: SwipeHandlerProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if it's a horizontal or vertical swipe
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (absDeltaY > threshold) {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }

    touchStart.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStart = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStart.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === 0 || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStart.current;

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [threshold, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    touchStart.current = 0;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullDistance > 0 && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-200"
          style={{ height: pullDistance }}
        >
          <div className="text-primary text-sm font-medium">
            {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  );
}

// Long press handler
interface LongPressProps {
  children: React.ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

export function LongPress({
  children,
  onLongPress,
  delay = 500,
  className
}: LongPressProps) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleStart = useCallback(() => {
    setIsLongPressing(true);
    timeoutRef.current = setTimeout(() => {
      onLongPress();
      setIsLongPressing(false);
    }, delay);
  }, [onLongPress, delay]);

  const handleEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLongPressing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'select-none',
        isLongPressing && 'opacity-70',
        className
      )}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {children}
    </div>
  );
}