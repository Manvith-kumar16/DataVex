import type { SearchResult } from './searchProvider';

const FUNDING_KW = ['series', 'raised', 'funding', 'investment', 'venture', 'vc', 'seed', 'capital', 'pre-ipo'];
const HIRING_KW = ['hiring', 'careers', 'engineer', 'developer', 'job listing', 'open role', 'talent', 'recruiter', 'headcount'];
const TECH_KW = ['aws', 'kubernetes', 'react', 'devops', 'docker', 'microservices', 'azure', 'gcp', 'cloud', 'typescript', 'python', 'api', 'next.js', 'node'];
const EXPANSION_KW = ['expansion', 'new office', 'global', 'new market', 'expands', 'regional', 'apac', 'emea', 'europe', 'growth'];

function matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
}

function toLabel(result: SearchResult, fallback: string): string {
    const snippet = result.snippet?.trim();
    if (!snippet) return fallback;
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

export function extractSignals(results: SearchResult[], targetDomain: string): ExtractedSignals {
    const fundingSignals: string[] = [];
    const hiringSignals: string[] = [];
    const techClues: string[] = [];
    const expansionSignals: string[] = [];
    const rawSources: string[] = [];

    const targetName = targetDomain.split('.')[0].toLowerCase();

    for (const result of results) {
        if (!result.url) continue;

        const url = result.url.toLowerCase();
        const text = `${result.title} ${result.snippet}`.toLowerCase();

        const isDirectSource = url.includes(targetDomain.toLowerCase());
        const mentionsTargetExactly = text.includes(targetDomain.toLowerCase()) || text.includes(targetName);

        if (!isDirectSource && !mentionsTargetExactly) {
            continue;
        }

        rawSources.push(result.url);

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
