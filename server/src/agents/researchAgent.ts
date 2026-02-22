import type { SharedMemory, Signal } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';
import { fetchCompanySignals } from '../services/searchProvider';
import { extractSignals } from '../services/signalExtractor';
import { getFromCache, setInCache } from '../lib/analysisCache';

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

const SIGNAL_TEMPLATES = [
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
];

function generateMockSignals(domain: string): Signal[] {
    const seed = hash(domain);
    const count = 3 + Math.floor(seededRandom(seed, 0) * 4);

    return Array.from({ length: count }, (_, i) => {
        const template = pickSeeded(SIGNAL_TEMPLATES, seed, i + 1);
        const reliabilityVariance = seededRandom(seed, i + 50) * 0.1 - 0.05;
        return {
            id: `${domain}-signal-${i}-${seed}`,
            type: template.type,
            content: template.content,
            source: `https://${domain}/research/${template.type.toLowerCase()}`,
            reliability: Math.min(1, Math.max(0, template.baseReliability + reliabilityVariance)),
            timestamp: new Date(Date.now() - i * 60_000).toISOString(),
        } satisfies Signal;
    });
}

export async function researchAgent(memory: SharedMemory): Promise<SharedMemory> {
    const updated = cloneMemory(memory);
    const domain = updated.domain;

    let signals: Signal[];
    let source: 'live' | 'cache' | 'mock';

    const cached = getFromCache<Signal[]>(domain);
    if (cached !== null) {
        signals = cached;
        source = 'cache';
    } else {
        try {
            const results = await fetchCompanySignals(domain);
            if (results.length > 0) {
                const extracted = extractSignals(results, domain);
                signals = [
                    ...extracted.fundingSignals.map(s => ({ id: crypto.randomUUID(), type: 'FUNDING', content: s, source: domain, reliability: 0.9, timestamp: new Date().toISOString() })),
                    ...extracted.hiringSignals.map(s => ({ id: crypto.randomUUID(), type: 'HIRING', content: s, source: domain, reliability: 0.8, timestamp: new Date().toISOString() })),
                    ...extracted.techClues.map(s => ({ id: crypto.randomUUID(), type: 'TECH', content: s, source: domain, reliability: 0.7, timestamp: new Date().toISOString() })),
                    ...extracted.expansionSignals.map(s => ({ id: crypto.randomUUID(), type: 'EXPANSION', content: s, source: domain, reliability: 0.8, timestamp: new Date().toISOString() }))
                ];
                source = 'live';
                setInCache(domain, signals);
            } else {
                signals = generateMockSignals(domain);
                source = 'mock';
            }
        } catch {
            signals = generateMockSignals(domain);
            source = 'mock';
        }
    }

    updated.rawSignals = [...updated.rawSignals, ...signals];

    updated.agentOutputs['research'] = {
        agentName: 'ResearchAgent',
        insights: [
            `Collected ${signals.length} signals for "${domain}" [source: ${source}]`,
        ],
        score: 100,
        metadata: { signalCount: signals.length, domain, source },
    };

    return updated;
}
