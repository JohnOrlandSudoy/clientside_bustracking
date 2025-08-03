// API Cache Service
// This service provides caching functionality for API responses

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // Expiry time in milliseconds
}

class ApiCacheService {
  private static instance: ApiCacheService;
  private cache: Map<string, CacheItem<any>> = new Map();
  private storage: Storage | null = null;

  private constructor() {
    // Try to use localStorage if available
    try {
      this.storage = window.localStorage;
      this.loadCacheFromStorage();
    } catch (error) {
      console.warn('LocalStorage not available, using in-memory cache only');
      this.storage = null;
    }
  }

  public static getInstance(): ApiCacheService {
    if (!ApiCacheService.instance) {
      ApiCacheService.instance = new ApiCacheService();
    }
    return ApiCacheService.instance;
  }

  private loadCacheFromStorage(): void {
    if (!this.storage) return;

    try {
      const cachedData = this.storage.getItem('api_cache');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Convert the parsed object back to a Map
        Object.entries(parsedData).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<any>);
        });
        
        // Clean expired items
        this.cleanExpiredItems();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
      // If loading fails, reset the cache
      this.cache = new Map();
    }
  }

  private saveToStorage(): void {
    if (!this.storage) return;

    try {
      // Convert Map to object for storage
      const cacheObject = Object.fromEntries(this.cache.entries());
      this.storage.setItem('api_cache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  private cleanExpiredItems(): void {
    const now = Date.now();
    let hasExpired = false;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.expiry) {
        this.cache.delete(key);
        hasExpired = true;
      }
    }

    if (hasExpired && this.storage) {
      this.saveToStorage();
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data or null if not found or expired
   */
  public get<T>(key: string): T | null {
    this.cleanExpiredItems();
    
    const item = this.cache.get(key);
    if (!item) return null;
    
    return item.data as T;
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param expiry Expiry time in milliseconds (default: 5 minutes)
   */
  public set<T>(key: string, data: T, expiry: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
    
    this.saveToStorage();
  }

  /**
   * Remove item from cache
   * @param key Cache key
   */
  public remove(key: string): void {
    this.cache.delete(key);
    this.saveToStorage();
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
    if (this.storage) {
      this.storage.removeItem('api_cache');
    }
  }
}

// Export singleton instance
export const apiCache = ApiCacheService.getInstance();

// Utility function to wrap API calls with caching
export async function cachedApiCall<T>(
  key: string,
  apiFn: () => Promise<T>,
  expiryTime: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache first
  const cachedData = apiCache.get<T>(key);
  if (cachedData !== null) {
    return cachedData;
  }

  // If not in cache, call API
  try {
    const data = await apiFn();
    // Store in cache
    apiCache.set(key, data, expiryTime);
    return data;
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  }
}