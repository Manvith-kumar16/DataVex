// src/lib/dataProviders/signalExtractor.ts
//
// Signal Extractor — maps raw Tavily SearchResults into ResearchData string arrays.
// Works with the m1 pipeline's ResearchData shape:
//   fundingSignals: string[]
//   hiringSignals: string[]
//   techClues: string[]
//   expansionSignals: string[]

import type { SearchResult } from './searchProvider';

// ── Keyword dictionaries ──────────────────────────────────────────────────────

const FUNDING_KW = ['series', 'raised', 'funding', 'investment', 'venture', 'vc', 'seed', 'capital', 'pre-ipo'];
const HIRING_KW = ['hiring', 'careers', 'engineer', 'developer', 'job listing', 'open role', 'talent', 'recruiter', 'headcount'];
const TECH_KW = ['aws', 'kubernetes', 'react', 'devops', 'docker', 'microservices', 'azure', 'gcp', 'cloud', 'typescript', 'python', 'api', 'next.js', 'node'];
const EXPANSION_KW = ['expansion', 'new office', 'global', 'new market', 'expands', 'regional', 'apac', 'emea', 'europe', 'growth'];

function matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
}

/**
 * Deduplicated label from a search result snippet.
 * Keeps it similar to the existing mock signal format (short, sentence-like).
 */
function toLabel(result: SearchResult, fallback: string): string {
    const snippet = result.snippet?.trim();
    if (!snippet) return fallback;
    // Take first sentence or first 80 chars
    const sentence = snippet.split(/[.!?]/)[0]?.trim();
    return sentence && sentence.length > 12 ? sentence.slice(0, 80) : fallback;
}

export interface ExtractedSignals {
    fundingSignals: string[];
    hiringSignals: string[];
    techClues: string[];
    expansionSignals: string[];
    rawSources: string[];
}

/**
 * Converts Tavily SearchResult[] into categorised string arrays
 * compatible with ResearchData (m1 pipeline).
 */
export function extractSignals(results: SearchResult[]): ExtractedSignals {
    const fundingSignals: string[] = [];
    const hiringSignals: string[] = [];
    const techClues: string[] = [];
    const expansionSignals: string[] = [];
    const rawSources: string[] = [];

    for (const result of results) {
        const text = `${result.title} ${result.snippet}`.toLowerCase();

        if (result.url) rawSources.push(result.url);

        if (matchesAny(text, FUNDING_KW)) {
            fundingSignals.push(toLabel(result, 'Funding activity detected'));
        }
        if (matchesAny(text, HIRING_KW)) {
            hiringSignals.push(toLabel(result, 'Hiring activity detected'));
        }
        if (matchesAny(text, TECH_KW)) {
            techClues.push(toLabel(result, 'Technology signal detected'));
        }
        if (matchesAny(text, EXPANSION_KW)) {
            expansionSignals.push(toLabel(result, 'Expansion activity detected'));
        }
    }

    // Deduplicate within each category (first-seen wins)
    function dedup(arr: string[]): string[] {
        return [...new Map(arr.map((s) => [s.slice(0, 40), s])).values()];
    }

    return {
        fundingSignals: dedup(fundingSignals),
        hiringSignals: dedup(hiringSignals),
        techClues: dedup(techClues),
        expansionSignals: dedup(expansionSignals),
        rawSources: [...new Set(rawSources)],
    };
}
