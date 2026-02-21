// src/lib/analysisCache.ts
//
// In-memory cache for Tavily search results with 6-hour TTL.
// Prevents redundant API calls when the same domain is analysed multiple times.

// ── Config ────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ── Types ─────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

const store = new Map<string, CacheEntry<unknown>>();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Retrieve a cached value for a domain, or null if absent/expired.
 */
export function getFromCache<T>(domain: string): T | null {
    const entry = store.get(domain) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;
    if (age > CACHE_TTL_MS) {
        store.delete(domain);
        return null;
    }

    return entry.data;
}

/**
 * Store a value for a domain, tagged with the current timestamp.
 */
export function setInCache<T>(domain: string, data: T): void {
    store.set(domain, { data, cachedAt: Date.now() });
}

/**
 * Manually evict a specific domain's cache entry.
 */
export function evictCache(domain: string): void {
    store.delete(domain);
}

/**
 * Clear the entire cache (useful for testing or forced refresh).
 */
export function clearCache(): void {
    store.clear();
}

/**
 * Returns the number of active (non-expired) cache entries.
 */
export function cacheSize(): number {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now - entry.cachedAt > CACHE_TTL_MS) store.delete(key);
    }
    return store.size;
}

// ── Legacy compatibility ──────────────────────────────────────────────────────
// Keep old function names so existing callers don't break.

/** @deprecated Use getFromCache() instead */
export function getCachedAnalysis<T>(domain: string): T | null {
    return getFromCache<T>(domain);
}

/** @deprecated Use setInCache() instead */
export function setCachedAnalysis<T>(domain: string, data: T): void {
    setInCache(domain, data);
}
