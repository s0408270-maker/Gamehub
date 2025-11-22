// Simple in-memory cache with TTL (Time-To-Live)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 30000; // 30 seconds

  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();
