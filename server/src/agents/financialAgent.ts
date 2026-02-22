import type { SharedMemory, StructuredSignal } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

const FUNDING_WEIGHT = 30;
const RELIABILITY_BONUS_SCALE = 20;

export function financialAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const structured: StructuredSignal[] = updated.structuredSignals;

    const fundingSignals = structured.filter((s) => s.category === 'FUNDING');

    const avgWeight = fundingSignals.length > 0
        ? fundingSignals.reduce((sum, s) => sum + s.weight, 0) / fundingSignals.length
        : 0;

    const baseScore = Math.min(100, fundingSignals.length * FUNDING_WEIGHT);
    const bonus = (avgWeight - 0.5) * RELIABILITY_BONUS_SCALE;
    const score = Math.min(100, Math.max(0, Math.round(baseScore + bonus)));

    const budgetConfidence: 'High' | 'Moderate' | 'Low' =
        score >= 70 ? 'High' : score >= 40 ? 'Moderate' : 'Low';

    const insights: string[] = [
        `${fundingSignals.length} FUNDING signals identified`,
        `Budget confidence: ${budgetConfidence} (${score}/100)`,
    ];

    if (fundingSignals.length > 0) {
        insights.push(`Funding signals: ${fundingSignals.map((s) => `"${s.summary}"`).join('; ')}`);
    }

    updated.agentOutputs['financial'] = {
        agentName: 'FinancialAgent',
        score,
        insights,
        metadata: {
            fundingCount: fundingSignals.length,
            avgSignalWeight: parseFloat(avgWeight.toFixed(4)),
            budgetConfidence,
        },
    };

    return updated;
}
