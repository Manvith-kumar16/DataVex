// src/lib/agents/researchAgent.ts
//
// ResearchAgent — Stage 1 of the modular pipeline.
//
// Responsibility:
//   Gather raw intelligence signals for a given domain.
//
//   LIVE mode (when VITE_TAVILY_API_KEY is set):
//     → Calls Tavily API via fetchCompanySignals()
//     → Extracts typed Signal[] via extractSignals()
//     → Returns populated SharedMemory with real sourceUrls
//
//   FALLBACK mode (no key, key quota exhausted, or network failure):
//     → Generates deterministic seeded-mock signals (domain hash based)
//     → Identical to this agent's original behaviour
//     → Zero downtime — tests continue to work unmodified
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Appends new Signal[] to memory.rawSignals
//   • Writes AgentOutput to memory.agentOutputs["research"]
//   • Returns updated SharedMemory (Promise — async for live fetch)

import type { SharedMemory, Signal, SignalType } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';
import { fetchCompanySignals } from '@/lib/dataProviders/searchProvider';
import { extractSignals } from '@/lib/dataProviders/signalExtractor';
import { getFromCache, setInCache } from '@/lib/analysisCache';

// ── Deterministic seeded pseudo-random helpers (fallback) ─────────────────────

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

function seededRandom(seed: number, index: number): number {
    const x = Math.sin(seed + index * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

function pickSeeded<T>(arr: T[], seed: number, idx: number): T {
    return arr[Math.floor(seededRandom(seed, idx) * arr.length)];
}

// ── Mock signal catalogue (fallback) ─────────────────────────────────────────

interface SignalTemplate {
    type: SignalType;
    content: string;
    baseReliability: number;
}

const SIGNAL_TEMPLATES: readonly SignalTemplate[] = [
    { type: 'FUNDING', content: 'Series B funding round completed in Q3', baseReliability: 0.90 },
    { type: 'FUNDING', content: 'Strategic investment received from major VC', baseReliability: 0.85 },
    { type: 'FUNDING', content: 'Revenue growth exceeding 40% YoY detected', baseReliability: 0.80 },
    { type: 'HIRING', content: 'VP of Engineering role posted — urgently hiring', baseReliability: 0.88 },
    { type: 'HIRING', content: 'Data Science team expanding with 5+ open roles', baseReliability: 0.82 },
    { type: 'HIRING', content: 'Cloud and DevOps engineer roles actively recruiting', baseReliability: 0.78 },
    { type: 'HIRING', content: 'AI/ML team build-out signalled via job postings', baseReliability: 0.75 },
    { type: 'TECH', content: 'Microservices migration in progress detected', baseReliability: 0.70 },
    { type: 'TECH', content: 'Kubernetes adoption signals identified in job specs', baseReliability: 0.65 },
    { type: 'TECH', content: 'Legacy .NET backend replacement project underway', baseReliability: 0.60 },
    { type: 'EXPANSION', content: 'New office opened in EU market', baseReliability: 0.92 },
    { type: 'EXPANSION', content: 'APAC expansion announcement published', baseReliability: 0.88 },
    { type: 'MARKET', content: 'Enterprise tier product launched to market', baseReliability: 0.83 },
    { type: 'MARKET', content: 'Partner program launch observed on company blog', baseReliability: 0.76 },
    { type: 'RISK', content: 'Technical debt signals: manual deployment processes', baseReliability: 0.55 },
    { type: 'RISK', content: 'Security compliance gaps identified in job listings', baseReliability: 0.50 },
] as const;

/**
 * Generates deterministic seeded-mock signals for a domain.
 * Used as fallback when live API is unavailable.
 */
function generateMockSignals(domain: string): Signal[] {
    const seed = hash(domain);
    const count = 3 + Math.floor(seededRandom(seed, 0) * 4); // 3–6 signals

    return Array.from({ length: count }, (_, i) => {
        const template = pickSeeded(SIGNAL_TEMPLATES as SignalTemplate[], seed, i + 1);
        const reliabilityVariance = seededRandom(seed, i + 50) * 0.1 - 0.05;
        return {
            id: `${domain}-signal-${i}-${seed}`,
            type: template.type,
            content: template.content,
            sourceUrl: `https://${domain}/research/${template.type.toLowerCase()}`,
            reliability: Math.min(1, Math.max(0, template.baseReliability + reliabilityVariance)),
            timestamp: Date.now() - i * 60_000,
        } satisfies Signal;
    });
}

// ── Agent ─────────────────────────────────────────────────────────────────────

/**
 * ResearchAgent — gathers intelligence signals for a domain.
 *
 * Attempts live Tavily fetch first. Falls back to seeded-mock signals
 * if the API key is missing, the network fails, or the cache has no entry.
 *
 * Results are cached for 6 hours to minimise API usage.
 *
 * @param memory - Current SharedMemory context.
 * @returns Promise<SharedMemory> with rawSignals and agentOutputs["research"] populated.
 */
export async function researchAgent(memory: SharedMemory): Promise<SharedMemory> {
    const updated = cloneMemory(memory);
    const domain = updated.domain;

    let signals: Signal[];
    let source: 'live' | 'cache' | 'mock';

    // 1. Check cache first
    const cached = getFromCache<Signal[]>(domain);
    if (cached !== null) {
        signals = cached;
        source = 'cache';
    } else {
        // 2. Try live fetch
        try {
            const results = await fetchCompanySignals(domain);
            if (results.length > 0) {
                signals = extractSignals(results);
                source = 'live';
                // Cache extracted signals
                setInCache(domain, signals);
            } else {
                // API key missing or no results — fall back to mock
                signals = generateMockSignals(domain);
                source = 'mock';
            }
        } catch {
            // Network failure — fall back to mock
            signals = generateMockSignals(domain);
            source = 'mock';
        }
    }

    updated.rawSignals = [...updated.rawSignals, ...signals];

    const byType = signals.reduce<Partial<Record<SignalType, number>>>((acc, s) => {
        acc[s.type] = (acc[s.type] ?? 0) + 1;
        return acc;
    }, {});

    updated.agentOutputs['research'] = {
        agentName: 'ResearchAgent',
        insights: [
            `Collected ${signals.length} signals for "${domain}" [source: ${source}]`,
            ...Object.entries(byType).map(([type, n]) => `${n} ${type} signal${n! > 1 ? 's' : ''} detected`),
        ],
        metadata: {
            signalCount: signals.length,
            domain,
            source,
            cachedAt: source === 'cache' ? Date.now() : undefined,
        },
    };

    return updated;
}
