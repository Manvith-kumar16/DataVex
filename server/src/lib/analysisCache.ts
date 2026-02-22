const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

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

export function setInCache<T>(domain: string, data: T): void {
    store.set(domain, { data, cachedAt: Date.now() });
}

export function clearCache(): void {
    store.clear();
}
