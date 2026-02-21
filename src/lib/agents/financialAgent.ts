// src/lib/agents/financialAgent.ts
//
// FinancialAgent — Stage 3b of the modular pipeline.
//
// Responsibility:
//   Evaluate financial readiness and budget confidence by analyzing FUNDING signals.
//   More funding signals with higher reliability → higher financial confidence score.
//
// Scoring model:
//   Base score = min(100, fundingCount * FUNDING_WEIGHT)
//   Reliability bonus = (avgReliability - 0.5) * RELIABILITY_BONUS_SCALE
//   Final score = clamp(base + bonus, 0, 100)
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.structuredSignals
//   • Writes AgentOutput to memory.agentOutputs["financial"]
//   • Returns updated SharedMemory

import type { SharedMemory, StructuredSignal } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

const FUNDING_WEIGHT = 30; // points per FUNDING signal
const RELIABILITY_BONUS_SCALE = 20; // max bonus/penalty from avg reliability

/**
 * FinancialAgent — assesses financial health and budget confidence.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with agentOutputs["financial"] populated.
 */
export function financialAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const structured: StructuredSignal[] = updated.structuredSignals;

    const fundingSignals = structured.filter((s) => s.category === 'FUNDING');

    // Average weight acts as a proxy for reliability proxy within StructuredSignals
    const avgWeight = fundingSignals.length > 0
        ? fundingSignals.reduce((sum, s) => sum + s.weight, 0) / fundingSignals.length
        : 0;

    const baseScore = Math.min(100, fundingSignals.length * FUNDING_WEIGHT);
    // avgWeight here is already normalized (0–1); center at 0.5 for bonus/penalty
    const bonus = (avgWeight - 0.5) * RELIABILITY_BONUS_SCALE;
    const score = Math.min(100, Math.max(0, Math.round(baseScore + bonus)));

    const budgetConfidence: 'High' | 'Moderate' | 'Low' =
        score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';

    const insights: string[] = [
        `${fundingSignals.length} FUNDING signal${fundingSignals.length !== 1 ? 's' : ''} identified`,
        `Budget confidence: ${budgetConfidence} (score: ${score}/100)`,
        score >= 70
            ? 'Strong funding momentum — budget availability likely'
            : score >= 40
                ? 'Moderate budget evidence — may require nurturing before commitment'
                : 'Weak financial signals — limited immediate budget confidence',
    ];

    if (fundingSignals.length > 0) {
        insights.push(`Funding signals: ${fundingSignals.map((s) => `"${s.summary}"`).join('; ')}`);
    }

    const risks: string[] = score < 40
        ? ['Low financial signal density — budget availability uncertain']
        : [];

    const opportunities: string[] = fundingSignals.length >= 2
        ? ['Post-funding procurement window — ideal time to engage']
        : fundingSignals.length === 1
            ? ['Single funding signal detected — monitor for follow-on rounds']
            : [];

    updated.agentOutputs['financial'] = {
        agentName: 'FinancialAgent',
        score,
        insights,
        risks,
        opportunities,
        metadata: {
            fundingCount: fundingSignals.length,
            avgSignalWeight: parseFloat(avgWeight.toFixed(4)),
            budgetConfidence,
        },
    };

    return updated;
}
