import type { SharedMemory, StructuredSignal, AgentOutput } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

export function signalAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const raw = updated.rawSignals;

    if (raw.length === 0) {
        updated.agentOutputs['signal'] = {
            agentName: 'SignalAgent',
            insights: ['No raw signals available to structure.'],
            score: 0,
            metadata: { structuredCount: 0 },
        };
        return updated;
    }

    const totalReliability = raw.reduce((sum, s) => sum + s.reliability, 0);
    const fallbackWeight = 1 / raw.length;

    const structured: StructuredSignal[] = raw.map((signal) => ({
        id: signal.id,
        category: signal.type,
        summary: signal.content,
        weight: totalReliability > 0
            ? parseFloat((signal.reliability / totalReliability).toFixed(4))
            : fallbackWeight,
    }));

    updated.structuredSignals = structured;

    const categoryBreakdown = structured.reduce<Record<string, number>>((acc, s) => {
        acc[s.category] = (acc[s.category] ?? 0) + 1;
        return acc;
    }, {});

    const topSignal = [...structured].sort((a, b) => b.weight - a.weight)[0];

    updated.agentOutputs['signal'] = {
        agentName: 'SignalAgent',
        score: 100,
        insights: [
            `Structured ${structured.length} signals`,
            `Top signal: "${topSignal.summary}"`
        ],
        metadata: { structuredCount: structured.length, categoryBreakdown },
    };

    return updated;
}
