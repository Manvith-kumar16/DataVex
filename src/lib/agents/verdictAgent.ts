// src/lib/agents/verdictAgent.ts
//
// VerdictAgent — Stage 5 (final) of the modular pipeline.
//
// Responsibility:
//   Aggregate specialist-agent scores into a weighted composite ScoreBreakdown.
//   Classify the lead as "Strong Lead", "Moderate Lead", or "Weak Lead".
//   Write the final verdict to memory.scoreBreakdown and memory.agentOutputs["verdict"].
//
// Weight model:
//   Technical : 40%  (strongest signal of implementation need)
//   Financial  : 35%  (budget and funding readiness)
//   Market     : 25%  (strategic timing and market position)
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.agentOutputs["technical"], ["financial"], ["market"]
//   • Writes ScoreBreakdown to memory.scoreBreakdown
//   • Writes AgentOutput to memory.agentOutputs["verdict"]
//   • Returns updated SharedMemory

import type { SharedMemory, ScoreBreakdown } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

/** Weights must sum to exactly 1.0. */
const WEIGHTS = {
    technical: 0.40,
    financial: 0.35,
    market: 0.25,
} as const satisfies Record<string, number>;

type LeadCategory = 'Strong Lead' | 'Moderate Lead' | 'Weak Lead';

function classifyLead(finalScore: number): LeadCategory {
    if (finalScore >= 70) return 'Strong Lead';
    if (finalScore >= 45) return 'Moderate Lead';
    return 'Weak Lead';
}

/**
 * VerdictAgent — produces the final weighted score and lead classification.
 *
 * Missing specialist scores default to 0 (no signal = no contribution).
 * All sub-scores and the finalScore are rounded to two decimal places.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with scoreBreakdown and agentOutputs["verdict"] populated.
 */
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

    const category = classifyLead(finalScore);

    const breakdown: ScoreBreakdown = {
        technical,
        financial,
        market,
        finalScore,
        weights: { ...WEIGHTS },
    };

    updated.scoreBreakdown = breakdown;

    // Derive debate-context insights if available
    const agreementPct = (updated.agentOutputs['debate']?.metadata?.['agreementPercent'] as number | undefined) ?? null;

    const insights: string[] = [
        `Final weighted score: ${finalScore}/100 — ${category}`,
        `Breakdown → Technical: ${technical} (×${WEIGHTS.technical}) | Financial: ${financial} (×${WEIGHTS.financial}) | Market: ${market} (×${WEIGHTS.market})`,
        ...(agreementPct !== null ? [`Agent debate agreement: ${agreementPct}%`] : []),
    ];

    const risks: string[] = [
        ...(technical === 0 ? ['No technical signals — technical score defaulted to 0'] : []),
        ...(financial === 0 ? ['No financial signals — financial score defaulted to 0'] : []),
        ...(market === 0 ? ['No market signals — market score defaulted to 0'] : []),
    ];

    updated.agentOutputs['verdict'] = {
        agentName: 'VerdictAgent',
        score: finalScore,
        insights,
        risks: risks.length > 0 ? risks : undefined,
        metadata: { category, weights: WEIGHTS, rawScores: { technical, financial, market } },
    };

    return updated;
}
