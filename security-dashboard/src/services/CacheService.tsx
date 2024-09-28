const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  private static cache: Record<string, CacheItem<any>> = {};

  static set<T>(key: string, data: T): void {
    this.cache[key] = { data, timestamp: Date.now() };
  }

  static get<T>(key: string): T | null {
    const item = this.cache[key];
    if (!item) return null;

    if (Date.now() - item.timestamp > CACHE_DURATION) {
      delete this.cache[key];
      return null;
    }

    return item.data;
  }

  static clear(key?: string): void {
    if (key) {
      delete this.cache[key];
    } else {
      this.cache = {};
    }
  }
}