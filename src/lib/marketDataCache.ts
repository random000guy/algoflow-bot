interface CachedData<T> {
  data: T;
  timestamp: number;
}

class MarketDataCache {
  private cache: Map<string, CachedData<any>> = new Map();
  private cacheDuration: number;

  constructor(cacheDurationMs: number = 90000) { // Default 90 seconds
    this.cacheDuration = cacheDurationMs;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    
    // If cache is stale, remove it and return null
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return false;
    }

    const age = Date.now() - cached.timestamp;
    
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  getCacheAge(key: string): number | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    return Date.now() - cached.timestamp;
  }
}

// Export a singleton instance
export const marketDataCache = new MarketDataCache(90000); // 90 seconds cache
