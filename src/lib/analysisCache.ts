const analysisCache = new Map<string, any>();

export function getCachedAnalysis(domain: string) {
    if (analysisCache.has(domain)) {
        console.log(`Cache hit for domain: ${domain}`);
        return analysisCache.get(domain);
    }

    console.log(`Cache miss for domain: ${domain}`);
    return null;
}

export function setCachedAnalysis(domain: string, data: any) {
    analysisCache.set(domain, data);
}
