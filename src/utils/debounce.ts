/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the provided function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that limits the rate at which the provided function can be invoked.
 * 
 * @param func The function to throttle
 * @param limit The minimum time interval between function calls in milliseconds
 * @returns A throttled version of the provided function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Creates a function that will only execute once within the specified time window.
 * 
 * @param func The function to limit
 * @param window The time window in milliseconds
 * @returns A limited version of the provided function
 */
export function onceInWindow<T extends (...args: any[]) => any>(
  func: T,
  window: number
): (...args: Parameters<T>) => void {
  let lastCallTime: number = 0;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastCallTime >= window) {
      lastCallTime = now;
      func(...args);
    }
  };
}