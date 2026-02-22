import axios from 'axios';

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    relevanceScore: number;
}

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

function buildQueries(domain: string): string[] {
    return [
        `"${domain}" funding investment raised series`,
        `"${domain}" hiring engineers careers jobs`,
        `"${domain}" tech stack kubernetes devops aws`,
        `"${domain}" expansion new office global growth market`,
    ];
}

async function runQuery(query: string, apiKey: string): Promise<SearchResult[]> {
    try {
        const response = await axios.post(TAVILY_ENDPOINT, {
            query,
            search_depth: 'advanced',
            max_results: 5,
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        return (response.data.results ?? []).map((item: { title?: string; url?: string; content?: string; snippet?: string; score?: number }) => ({
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

export async function fetchCompanySignals(domain: string): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        console.warn('[searchProvider] TAVILY_API_KEY not set');
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
