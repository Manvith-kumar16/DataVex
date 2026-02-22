import type { SharedMemory, ScoreBreakdown } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

const WEIGHTS = {
    technical: 0.40,
    financial: 0.35,
    market: 0.25,
} as const;

export function verdictAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);

    const technical = updated.agentOutputs['technical']?.score ?? 0;
    const financial = updated.agentOutputs['financial']?.score ?? 0;
    const market = updated.agentOutputs['market']?.score ?? 0;

    const finalScore = parseFloat(
        (
            technical * WEIGHTS.technical +
            financial * WEIGHTS.financial +
            market * WEIGHTS.market
        ).toFixed(2),
    );

    const breakdown: ScoreBreakdown = {
        technical,
        financial,
        market,
        finalScore,
        weights: { ...WEIGHTS },
    };

    updated.scoreBreakdown = breakdown;

    updated.agentOutputs['verdict'] = {
        agentName: 'VerdictAgent',
        score: finalScore,
        insights: [`Final weighted score: ${finalScore}/100`],
        metadata: { weights: WEIGHTS, rawScores: { technical, financial, market } },
    };

    return updated;
}
