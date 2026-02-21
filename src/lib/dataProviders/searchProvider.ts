// src/lib/dataProviders/searchProvider.ts
//
// Tavily Search Provider — fetches company intelligence via 4 targeted queries.
//
// Auth: Authorization: Bearer header (Tavily API requirement).
// Env:  VITE_TAVILY_API_KEY in .env file (Vite browser app — no process.env).
//
// On missing key or API failure: returns [] so callers fall back gracefully.

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    relevanceScore: number;
}

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

/**
 * Build the 4 targeted query strings for a given domain.
 * Targeting specific topics maximises keyword-hit rate for signal extraction.
 */
function buildQueries(domain: string): string[] {
    return [
        `${domain} funding investment raised series`,
        `${domain} hiring engineers careers jobs`,
        `${domain} tech stack kubernetes devops aws`,
        `${domain} expansion new office global growth market`,
    ];
}

/**
 * Run a single Tavily query and return normalised SearchResult[].
 * Returns [] on any network/parse failure so callers stay clean.
 */
async function runQuery(query: string, apiKey: string): Promise<SearchResult[]> {
    try {
        const response = await fetch(TAVILY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                search_depth: 'advanced',
                max_results: 5,
            }),
        });

        if (!response.ok) {
            console.warn(`[searchProvider] Tavily returned ${response.status} for query "${query}"`);
            return [];
        }

        const data = await response.json();

        return (data.results ?? []).map((item: Record<string, unknown>) => ({
            title: String(item.title ?? ''),
            url: String(item.url ?? ''),
            snippet: String(item.content ?? item.snippet ?? ''),
            relevanceScore: typeof item.score === 'number' ? item.score : 0.5,
        }));
    } catch (err) {
        console.warn(`[searchProvider] Query failed for "${query}":`, err);
        return [];
    }
}

/**
 * Fetches company intelligence signals from Tavily for a given domain.
 *
 * Runs 4 targeted queries sequentially to respect rate limits.
 * Returns an empty array if VITE_TAVILY_API_KEY is not set.
 *
 * @param domain - Company domain, e.g. "stripe.com"
 */
export async function fetchCompanySignals(domain: string): Promise<SearchResult[]> {
    // Vite exposes env vars via import.meta.env — not process.env
    const apiKey = import.meta.env.VITE_TAVILY_API_KEY as string | undefined;

    if (!apiKey || apiKey.trim() === '') {
        console.warn('[searchProvider] VITE_TAVILY_API_KEY not set — skipping live fetch');
        return [];
    }

    const queries = buildQueries(domain);
    const allResults: SearchResult[] = [];

    for (const query of queries) {
        const results = await runQuery(query, apiKey);
        allResults.push(...results);
    }

    return allResults;
}
