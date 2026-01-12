import { useEffect, useRef, useState } from 'react';

interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeNavigationOptions) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isHorizontalSwipe.current = false;
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX.current;
      const diffY = currentY - touchStartY.current;

      // Determine if this is a horizontal swipe (only on first significant movement)
      if (!isHorizontalSwipe.current && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }

      // Only track horizontal swipes
      if (isHorizontalSwipe.current) {
        e.preventDefault();
        setSwipeOffset(diffX);
      }
    };

    const handleTouchEnd = () => {
      if (isHorizontalSwipe.current) {
        if (swipeOffset > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (swipeOffset < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      setIsSwiping(false);
      setSwipeOffset(0);
      isHorizontalSwipe.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isSwiping, swipeOffset, threshold, onSwipeLeft, onSwipeRight]);

  return {
    isSwiping: isSwiping && isHorizontalSwipe.current,
    swipeOffset: isHorizontalSwipe.current ? swipeOffset : 0,
  };
};
