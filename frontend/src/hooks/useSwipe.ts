'use client';

import { useEffect, useRef, useState } from 'react';
import { isIOS, hapticFeedback } from '@/utils/iosHelpers';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeHandlers) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (Math.abs(distanceX) > threshold) {
        if (distanceX > 0 && onSwipeLeft) {
          if (isIOS()) hapticFeedback('light');
          onSwipeLeft();
        } else if (distanceX < 0 && onSwipeRight) {
          if (isIOS()) hapticFeedback('light');
          onSwipeRight();
        }
      }
    } else {
      if (Math.abs(distanceY) > threshold) {
        if (distanceY > 0 && onSwipeUp) {
          if (isIOS()) hapticFeedback('light');
          onSwipeUp();
        } else if (distanceY < 0 && onSwipeDown) {
          if (isIOS()) hapticFeedback('light');
          onSwipeDown();
        }
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Hook for swipeable element
export function useSwipeableElement(handlers: SwipeHandlers) {
  const elementRef = useRef<HTMLDivElement>(null);
  const swipeHandlers = useSwipe(handlers);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', swipeHandlers.onTouchStart);
    element.addEventListener('touchmove', swipeHandlers.onTouchMove);
    element.addEventListener('touchend', swipeHandlers.onTouchEnd);

    return () => {
      element.removeEventListener('touchstart', swipeHandlers.onTouchStart);
      element.removeEventListener('touchmove', swipeHandlers.onTouchMove);
      element.removeEventListener('touchend', swipeHandlers.onTouchEnd);
    };
  }, [swipeHandlers]);

  return elementRef;
}
