import { useState, useCallback, useRef } from 'react';

interface UseApiCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const {
    maxRetries = 3,
    retryDelay = 5000,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const retryCount = useRef(0);
  const isMounted = useRef(true);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    retryCount.current = 0;
  }, []);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    if (!isMounted.current) return null;

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      
      if (!isMounted.current) return null;
      
      setData(result);
      setLoading(false);
      retryCount.current = 0;
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      if (!isMounted.current) return null;

      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      
      // Check if this is a network error that shouldn't retry
      const isNetworkError = error.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
                            error.message.includes('net::ERR_INSUFFICIENT_RESOURCES') ||
                            error.message.includes('Failed to fetch') ||
                            error.message.includes('NetworkError');

      if (isNetworkError) {
        setError('Network error. Please check your connection and try again.');
        setLoading(false);
        if (onError) onError(error);
        return null;
      }

      // Implement retry logic for other errors
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        const delay = retryDelay * Math.pow(2, retryCount.current - 1);
        
        console.log(`Retrying API call in ${delay}ms (attempt ${retryCount.current}/${maxRetries})`);
        
        setTimeout(() => {
          if (isMounted.current) {
            execute(...args);
          }
        }, delay);
        
        return null;
      } else {
        // Max retries reached
        setError(error.message || 'An error occurred after multiple attempts');
        setLoading(false);
        if (onError) onError(error);
        return null;
      }
    }
  }, [apiFunction, maxRetries, retryDelay, onError, onSuccess]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    isMounted.current = false;
  }, []);

  // Return cleanup function
  return {
    data,
    loading,
    error,
    execute,
    reset,
    cleanup
  };
}
