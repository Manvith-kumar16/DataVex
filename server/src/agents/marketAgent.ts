import type { SharedMemory, StructuredSignal } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

const MARKET_WEIGHT = 25;
const EXPANSION_WEIGHT = 30;

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
    ];

    updated.agentOutputs['market'] = {
        agentName: 'MarketAgent',
        score,
        insights,
        metadata: {
            marketCount: marketSignals.length,
            expansionCount: expansionSignals.length,
            expansionReadiness,
        },
    };

    return updated;
}
