// src/lib/agents/researchAgent.ts
//
// ResearchAgent — Stage 1 of the modular pipeline.
//
// Responsibility:
//   Simulate company intelligence gathering by generating raw Signal records
//   for a given domain. In production this would call external APIs or scrapers.
//   This implementation is deterministic based on domain input.
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Appends new Signal[] to memory.rawSignals
//   • Writes AgentOutput to memory.agentOutputs["research"]
//   • Returns updated SharedMemory

import type { SharedMemory, Signal, SignalType } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

// ── Deterministic seeded pseudo-random helpers ────────────────────────────────

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

// ── Signal catalogue ──────────────────────────────────────────────────────────

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

// ── Agent factory ─────────────────────────────────────────────────────────────

/**
 * ResearchAgent — generates raw intelligence signals for a given domain.
 *
 * The number and selection of signals are deterministically derived from the
 * domain string so that repeated calls produce identical results, making the
 * agent fully testable without mocking.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with rawSignals and agentOutputs["research"] populated.
 */
export function researchAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const seed = hash(updated.domain);

    // Determine how many signals to generate (3–6, seeded)
    const count = 3 + Math.floor(seededRandom(seed, 0) * 4);

    const generated: Signal[] = Array.from({ length: count }, (_, i) => {
        const template = pickSeeded(SIGNAL_TEMPLATES as SignalTemplate[], seed, i + 1);
        // Slightly vary reliability per instance so signals aren't identical
        const reliabilityVariance = seededRandom(seed, i + 50) * 0.1 - 0.05;
        return {
            id: `${updated.domain}-signal-${i}-${seed}`,
            type: template.type,
            content: template.content,
            sourceUrl: `https://${updated.domain}/research/${template.type.toLowerCase()}`,
            reliability: Math.min(1, Math.max(0, template.baseReliability + reliabilityVariance)),
            timestamp: Date.now() - i * 60_000, // stagger timestamps slightly
        } satisfies Signal;
    });

    updated.rawSignals = [...updated.rawSignals, ...generated];

    const byType = generated.reduce<Partial<Record<SignalType, number>>>((acc, s) => {
        acc[s.type] = (acc[s.type] ?? 0) + 1;
        return acc;
    }, {});

    updated.agentOutputs['research'] = {
        agentName: 'ResearchAgent',
        insights: [
            `Collected ${generated.length} raw signals for domain "${updated.domain}"`,
            ...Object.entries(byType).map(([type, n]) => `${n} ${type} signal${n! > 1 ? 's' : ''} detected`),
        ],
        metadata: { signalCount: generated.length, domain: updated.domain, seedUsed: seed },
    };

    return updated;
}
