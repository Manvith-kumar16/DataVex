// src/lib/agents/marketAgent.ts
//
// MarketAgent — Stage 3c of the modular pipeline.
//
// Responsibility:
//   Assess market opportunity and competitive positioning by analyzing
//   MARKET and EXPANSION signals. Outputs a market opportunity score,
//   expansion readiness assessment, and strategic insights.
//
// Scoring model:
//   score = min(100, marketCount * MARKET_WEIGHT + expansionCount * EXPANSION_WEIGHT)
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.structuredSignals
//   • Writes AgentOutput to memory.agentOutputs["market"]
//   • Returns updated SharedMemory

import type { SharedMemory, StructuredSignal } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

const MARKET_WEIGHT = 25; // points per MARKET signal
const EXPANSION_WEIGHT = 30; // points per EXPANSION signal (higher — concrete action)

/**
 * MarketAgent — evaluates market opportunity and expansion signals.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with agentOutputs["market"] populated.
 */
export function marketAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const structured: StructuredSignal[] = updated.structuredSignals;

    const marketSignals = structured.filter((s) => s.category === 'MARKET');
    const expansionSignals = structured.filter((s) => s.category === 'EXPANSION');

    const score = Math.min(
        100,
        marketSignals.length * MARKET_WEIGHT +
        expansionSignals.length * EXPANSION_WEIGHT,
    );

    const expansionReadiness: 'Actively Expanding' | 'Evaluating' | 'Stable' =
        expansionSignals.length >= 2 ? 'Actively Expanding'
            : expansionSignals.length === 1 ? 'Evaluating'
                : 'Stable';

    const insights: string[] = [
        `Detected ${marketSignals.length} MARKET and ${expansionSignals.length} EXPANSION signals`,
        `Expansion readiness: ${expansionReadiness}`,
        score >= 70
            ? 'Strong market opportunity — active expansion phase creates immediate engagement window'
            : score >= 40
                ? 'Moderate market signals — strategic timing opportunity present'
                : 'Limited market signals — territory may require development before pursuit',
    ];

    if (expansionSignals.length > 0) {
        insights.push(`Expansion signals: ${expansionSignals.map((s) => `"${s.summary}"`).join('; ')}`);
    }
    if (marketSignals.length > 0) {
        insights.push(`Market signals: ${marketSignals.map((s) => `"${s.summary}"`).join('; ')}`);
    }

    const opportunities: string[] = [
        ...(expansionSignals.length >= 2 ? ['Active expansion — infrastructure investment opportunity'] : []),
        ...(expansionSignals.length === 1 ? ['Expansion evaluation — pre-commitment engagement window'] : []),
        ...(marketSignals.length > 0 ? ['Market positioning — strategic partnership opportunity'] : []),
    ];

    const risks: string[] = score < 30
        ? ['Minimal market signal density — limited strategic alignment evidence']
        : [];

    updated.agentOutputs['market'] = {
        agentName: 'MarketAgent',
        score,
        insights,
        risks,
        opportunities,
        metadata: {
            marketCount: marketSignals.length,
            expansionCount: expansionSignals.length,
            expansionReadiness,
        },
    };

    return updated;
}
