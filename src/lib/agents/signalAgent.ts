// src/lib/agents/signalAgent.ts
//
// SignalAgent — Stage 2 of the modular pipeline.
//
// Responsibility:
//   Normalize raw Signal[] into StructuredSignal[], computing a normalized
//   influence weight for each signal relative to the full signal set.
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.rawSignals
//   • Writes to memory.structuredSignals (replaces, does not append)
//   • Writes AgentOutput to memory.agentOutputs["signal"]
//   • Returns updated SharedMemory

import type { SharedMemory, StructuredSignal } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

/**
 * SignalAgent — normalizes raw signals into weighted StructuredSignals.
 *
 * Weight normalization:
 *   Each signal's `reliability` is divided by the sum of all reliabilities,
 *   yielding a probability-like distribution where all weights sum to 1.
 *   If all signals have zero reliability, weights fall back to equal distribution.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with structuredSignals populated and agentOutputs["signal"] set.
 */
export function signalAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const raw = updated.rawSignals;

    if (raw.length === 0) {
        updated.agentOutputs['signal'] = {
            agentName: 'SignalAgent',
            insights: ['No raw signals available to structure.'],
            metadata: { structuredCount: 0 },
        };
        return updated;
    }

    // Compute total reliability for normalization
    const totalReliability = raw.reduce((sum, s) => sum + s.reliability, 0);
    const fallbackWeight = 1 / raw.length;

    const structured: StructuredSignal[] = raw.map((signal) => ({
        id: signal.id,
        category: signal.type,
        summary: signal.content,
        weight: totalReliability > 0
            ? parseFloat((signal.reliability / totalReliability).toFixed(4))
            : fallbackWeight,
    } satisfies StructuredSignal));

    updated.structuredSignals = structured;

    // Compute per-category breakdown for the insight log
    const categoryBreakdown = structured.reduce<Record<string, number>>((acc, s) => {
        acc[s.category] = (acc[s.category] ?? 0) + 1;
        return acc;
    }, {});

    const topSignal = [...structured].sort((a, b) => b.weight - a.weight)[0];

    updated.agentOutputs['signal'] = {
        agentName: 'SignalAgent',
        insights: [
            `Structured ${structured.length} signal${structured.length !== 1 ? 's' : ''} from raw data`,
            `Category distribution: ${Object.entries(categoryBreakdown).map(([k, v]) => `${k}(${v})`).join(', ')}`,
            ...(topSignal ? [`Highest-weight signal (${(topSignal.weight * 100).toFixed(1)}%): "${topSignal.summary}"`] : []),
        ],
        metadata: { structuredCount: structured.length, categoryBreakdown },
    };

    return updated;
}
