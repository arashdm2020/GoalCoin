// iOS-specific utility functions and helpers

/**
 * Detect if the user is on iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

/**
 * Detect if running in iOS standalone mode (PWA)
 */
export const isIOSStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    isIOS() &&
    (window.navigator as any).standalone === true
  );
};

/**
 * Get safe area insets for iOS
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0'),
    bottom: parseInt(style.getPropertyValue('--sab') || '0'),
    left: parseInt(style.getPropertyValue('--sal') || '0'),
    right: parseInt(style.getPropertyValue('--sar') || '0'),
  };
};

/**
 * Trigger haptic feedback on iOS
 */
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!isIOS()) return;
  
  try {
    if ('vibrate' in navigator) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
      navigator.vibrate(duration);
    }
  } catch (error) {
    // Silently fail if vibration is not supported
  }
};

/**
 * Prevent iOS rubber band scrolling
 */
export const preventRubberBand = (element: HTMLElement) => {
  if (!isIOS()) return;
  
  element.addEventListener('touchstart', (e) => {
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const height = element.clientHeight;
    const delta = (e as TouchEvent).touches[0].clientY;
    
    if (scrollTop === 0 && delta > 0) {
      e.preventDefault();
    } else if (scrollTop + height >= scrollHeight && delta < 0) {
      e.preventDefault();
    }
  });
};

/**
 * Fix iOS input zoom
 */
export const preventIOSInputZoom = () => {
  if (!isIOS()) return;
  
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    );
  }
};

/**
 * iOS-safe scroll lock
 */
export const lockScroll = () => {
  if (typeof document === 'undefined') return;
  
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
};

export const unlockScroll = () => {
  if (typeof document === 'undefined') return;
  
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
};

/**
 * Get iOS version
 */
export const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;
  
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Check if device has notch (iPhone X and newer)
 */
export const hasNotch = (): boolean => {
  if (!isIOS()) return false;
  
  const version = getIOSVersion();
  if (!version) return false;
  
  // iPhone X was released with iOS 11
  return version >= 11 && window.screen.height >= 812;
};
