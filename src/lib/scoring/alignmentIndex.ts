// src/lib/scoring/alignmentIndex.ts
//
// Phase 5: Alignment Index Engine — Statistical Disagreement Analysis
//
// Computes how much scoring agents AGREE with each other.
// This answers: "Can we trust the consensus, or are agents pulling in opposite directions?"
//
// Mathematical model:
//   stdDev      = population standard deviation of all numeric agent scores
//   alignmentIndex = clamp(1 - stdDev / THEORETICAL_MAX_STD_DEV)
//   riskIndicator = threshold classification of alignmentIndex
//
// Design properties:
//   ✅ Pure function — reads memory, produces result, no side effects
//   ✅ Deterministic — same inputs always produce same output
//   ✅ Clamp-safe — alignmentIndex is always in [0, 1]
//   ✅ Edge-safe — 0 agents → perfect alignment; 1 agent → perfect alignment
//   ✅ Score-filter — only numeric `score` fields contribute
//   ✅ No UI / orchestrator dependency
//   ✅ Composable — reuses math from confidenceEngine; scored separately

import type { SharedMemory } from '@/types/analysis';
import { clamp, average, standardDeviation } from './confidenceEngine';

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * Theoretical maximum population standard deviation for a [0, 100] scoring scale.
 *
 * Achieved when exactly half the agents score 0 and the other half score 100.
 * Example: stdDev([0, 100]) = 50, stdDev([0, 0, 100, 100]) = 50.
 *
 * All real-world score distributions produce a stdDev ≤ 50 on this scale.
 */
const THEORETICAL_MAX_STD_DEV = 50;

// ─── Public Types ──────────────────────────────────────────────────────────────

/** Risk level inferred from the alignment index. */
export type AlignmentRisk = 'LOW' | 'MODERATE' | 'HIGH';

/**
 * Full result produced by `calculateAlignmentIndex`.
 *
 * All values are deterministic for a given memory state.
 */
export interface AlignmentResult {
    /**
     * Population standard deviation of all numeric agent scores.
     * Range: [0, ∞) — typically stays within [0, 50] for well-behaved agents.
     * Rounded to 4 decimal places.
     */
    stdDeviation: number;

    /**
     * Normalized disagreement metric: 1 = perfect agreement, 0 = max disagreement.
     * Formula: 1 - clamp(stdDev / 50)
     * Rounded to 4 decimal places.
     */
    alignmentIndex: number;

    /**
     * Human-readable risk tier inferred from the alignmentIndex.
     *
     * | alignmentIndex | risk     |
     * |----------------|----------|
     * | ≥ 0.75         | LOW      |
     * | 0.45 – 0.74    | MODERATE |
     * | < 0.45         | HIGH     |
     */
    riskIndicator: AlignmentRisk;

    /**
     * Number of agents whose scores contributed to this calculation.
     * Non-scoring agents (research, signal, debate) are excluded.
     */
    scoringAgentCount: number;

    /**
     * Mean of all contributing scores, for contextual display.
     * Rounded to 4 decimal places.
     */
    meanScore: number;
}

// ─── Risk Classification ───────────────────────────────────────────────────────

/**
 * Thresholds for the alignment risk ladder.
 * Defined as a sorted constant for extensibility without magic-number spread.
 */
const RISK_THRESHOLDS: Array<{ min: number; risk: AlignmentRisk }> = [
    { min: 0.75, risk: 'LOW' },
    { min: 0.45, risk: 'MODERATE' },
    { min: 0.00, risk: 'HIGH' },
];

/**
 * Map an alignmentIndex to its risk tier.
 * Input is clamped to [0, 1] before threshold comparison.
 */
export function classifyAlignmentRisk(alignmentIndex: number): AlignmentRisk {
    const clamped = clamp(alignmentIndex);
    return (
        RISK_THRESHOLDS.find(({ min }) => clamped >= min)?.risk ?? 'HIGH'
    );
}

// ─── Interpretation Helpers ────────────────────────────────────────────────────

/**
 * Human-readable description of what the alignment risk level means.
 * Suitable for UI tooltips or report sections.
 */
export function describeAlignmentRisk(risk: AlignmentRisk): string {
    switch (risk) {
        case 'LOW': return 'Agents are in strong agreement — high confidence in the composite score.';
        case 'MODERATE': return 'Agents show moderate disagreement — some dimensions may need closer review.';
        case 'HIGH': return 'Agents significantly disagree — treat the composite score with caution.';
    }
}

/**
 * Returns the names of agents contributing the highest and lowest scores.
 * Useful for surfacing disagreement context to the UI.
 *
 * Returns null if fewer than 2 scored agents exist.
 */
export function getScoreExtremes(
    memory: SharedMemory,
): { highest: { agent: string; score: number }; lowest: { agent: string; score: number } } | null {
    const entries = Object.entries(memory.agentOutputs)
        .filter(([, o]) => typeof o.score === 'number')
        .map(([name, o]) => ({ agent: name, score: o.score as number }));

    if (entries.length < 2) return null;

    const sorted = [...entries].sort((a, b) => b.score - a.score);
    return {
        highest: sorted[0],
        lowest: sorted[sorted.length - 1],
    };
}

// ─── Core Public API ───────────────────────────────────────────────────────────

/**
 * Calculate the alignment index for a given SharedMemory state.
 *
 * Only agent outputs with a numeric `score` field are included.
 * Non-scoring agents (research, signal, debate) contribute nothing.
 *
 * @example
 * ```typescript
 * import { calculateAlignmentIndex } from '@/lib/scoring/alignmentIndex';
 *
 * const alignment = calculateAlignmentIndex(memory);
 * console.log(alignment.alignmentIndex);  // e.g. 0.8742
 * console.log(alignment.riskIndicator);   // e.g. "LOW"
 * ```
 */
export function calculateAlignmentIndex(memory: SharedMemory): AlignmentResult {
    const scores = Object.values(memory.agentOutputs)
        .map((o) => o.score)
        .filter((s): s is number => typeof s === 'number');

    // Edge case: no scored agents → trivially in perfect agreement
    if (scores.length === 0) {
        return {
            stdDeviation: 0,
            alignmentIndex: 1,
            riskIndicator: 'LOW',
            scoringAgentCount: 0,
            meanScore: 0,
        };
    }

    // Edge case: single scored agent → no disagreement possible
    if (scores.length === 1) {
        return {
            stdDeviation: 0,
            alignmentIndex: 1,
            riskIndicator: 'LOW',
            scoringAgentCount: 1,
            meanScore: Number(scores[0].toFixed(4)),
        };
    }

    const stdDev = standardDeviation(scores);
    const alignmentIndex = clamp(1 - stdDev / THEORETICAL_MAX_STD_DEV);
    const riskIndicator = classifyAlignmentRisk(alignmentIndex);
    const meanScore = average(scores);

    return {
        stdDeviation: Number(stdDev.toFixed(4)),
        alignmentIndex: Number(alignmentIndex.toFixed(4)),
        riskIndicator,
        scoringAgentCount: scores.length,
        meanScore: Number(meanScore.toFixed(4)),
    };
}

// ─── Re-export constants for testing ──────────────────────────────────────────

export { THEORETICAL_MAX_STD_DEV, RISK_THRESHOLDS };
