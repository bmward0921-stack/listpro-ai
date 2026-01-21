import React, { ReactNode, forwardRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  progress,
  threshold = 80,
}) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: pullDistance }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 transition-all",
          isRefreshing && "animate-pulse"
        )}
        style={{
          transform: `scale(${0.5 + progress * 0.5})`,
          opacity: progress,
        }}
      >
        <RefreshCw
          className={cn(
            "w-5 h-5 text-primary transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
          }}
        />
      </div>
    </div>
  );
};

interface PullToRefreshContainerProps {
  children: ReactNode;
  className?: string;
}

export const PullToRefreshContainer = forwardRef<HTMLDivElement, PullToRefreshContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("h-full overflow-y-auto overscroll-y-contain", className)}
      >
        {children}
      </div>
    );
  }
);

PullToRefreshContainer.displayName = 'PullToRefreshContainer';
