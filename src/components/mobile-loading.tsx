'use client';

import { Loader2, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'branded';
}

export default function MobileLoading({ 
  message = 'Loading...', 
  className,
  size = 'md',
  variant = 'default'
}: MobileLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12'
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center', containerClasses[size], className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      </div>
    );
  }

  if (variant === 'branded') {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center text-center',
        containerClasses[size],
        className
      )}>
        <div className="relative mb-4">
          <Leaf className={cn('text-primary', sizeClasses[size])} />
          <Loader2 className={cn(
            'absolute inset-0 animate-spin text-primary/30',
            sizeClasses[size]
          )} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">AgriAssist</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center space-y-4',
      containerClasses[size],
      className
    )}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      )}
    </div>
  );
}

// Full-screen loading overlay for mobile
export function MobileLoadingOverlay({ 
  message = 'Loading...', 
  isVisible = true 
}: { 
  message?: string; 
  isVisible?: boolean; 
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-lg border p-6 mx-4 max-w-sm w-full">
        <MobileLoading 
          message={message} 
          size="lg" 
          variant="branded"
          className="py-4"
        />
      </div>
    </div>
  );
}

// Skeleton loading components for mobile
export function MobileCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-1/2"></div>
      <div className="h-20 bg-muted rounded"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-muted rounded w-16"></div>
        <div className="h-8 bg-muted rounded w-20"></div>
      </div>
    </div>
  );
}

export function MobileListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-card rounded-lg border animate-pulse">
          <div className="h-12 w-12 bg-muted rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );
}