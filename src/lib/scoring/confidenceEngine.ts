// src/lib/scoring/confidenceEngine.ts
//
// Phase 4: Confidence Engine — Statistical Backbone of Trust
//
// Computes a multi-dimensional confidence score for any SharedMemory state.
// The score answers: "How much should we trust this analysis?"
//
// Mathematical model:
//   Confidence = (DataCompleteness × 0.40)
//              + (AgentAgreement   × 0.30)
//              + (EvidenceRel.     × 0.30)
//
// All sub-scores are normalized to [0, 1] and clamped before weighting.
// The final score is also clamped to [0, 1] and rounded to 4 d.p.
//
// Design properties:
//   ✅ Pure function (no side effects)
//   ✅ Deterministic — same memory always produces same output
//   ✅ Clamp-safe — no value can exceed [0, 1]
//   ✅ Edge-safe — handles empty signals, missing scores, zero agents
//   ✅ Immutable — never mutates the input memory
//   ✅ No UI / orchestrator dependency
//   ✅ Fully testable in isolation

import type { SharedMemory } from '@/types/analysis';
import type { MemoryConfidenceData } from '@/types/analysis';

// ─── Constants ─────────────────────────────────────────────────────────────────

/**
 * The six signal categories we expect a complete analysis to cover.
 * Used as the denominator for data-completeness scoring.
 */
const EXPECTED_SIGNAL_CATEGORIES = [
    'FUNDING',
    'HIRING',
    'TECH',
    'EXPANSION',
    'MARKET',
    'RISK',
] as const;

const EXPECTED_CATEGORY_COUNT = EXPECTED_SIGNAL_CATEGORIES.length; // 6

/**
 * The theoretically maximum standard deviation for scores on a 0–100 scale.
 * Achievable when half the agents score 0 and half score 100.
 * Used to normalize agent agreement into [0, 1].
 */
const THEORETICAL_MAX_STD_DEV = 50;

/**
 * Weights for each dimension — must sum to 1.
 */
const WEIGHTS = {
    dataCompleteness: 0.40,
    agentAgreement: 0.30,
    evidenceReliability: 0.30,
} as const;

// ─── Internal Math Utilities ────────────────────────────────────────────────────

/**
 * Clamp `value` to [min, max]. Defaults to [0, 1].
 */
export function clamp(value: number, min = 0, max = 1): number {
    if (isNaN(value)) return min; // NaN is not comparable; default to min
    return Math.min(Math.max(value, min), max); // Infinity/-Infinity handled correctly by Math.min/max
}

/**
 * Arithmetic mean of an array of numbers.
 * Returns 0 for empty input (safe default).
 */
export function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
}

/**
 * Population standard deviation of an array of numbers.
 * Uses population (not sample) formula — we have the full data set.
 * Returns 0 for arrays of length 0 or 1.
 */
export function standardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = average(values);
    const variance = average(values.map((v) => (v - mean) ** 2));
    return Math.sqrt(variance);
}

/**
 * Round to a fixed number of decimal places without floating-point drift.
 */
function round4(value: number): number {
    return Number(value.toFixed(4));
}

// ─── Sub-Score Calculations ────────────────────────────────────────────────────

/**
 * DATA COMPLETENESS — 0 to 1
 *
 * Measures how many of the 6 expected signal categories are represented
 * in the structured signals. Full coverage = 1.0.
 *
 * Formula:  unique_categories_in_structuredSignals / 6
 *
 * Edge cases:
 *   - No structured signals → 0
 *   - More unique categories than expected → clamped to 1
 */
export function calculateDataCompleteness(memory: SharedMemory): number {
    const uniqueCategories = new Set(
        memory.structuredSignals.map((s) => s.category),
    );
    return clamp(uniqueCategories.size / EXPECTED_CATEGORY_COUNT);
}

/**
 * EVIDENCE RELIABILITY — 0 to 1
 *
 * Mean reliability of all raw signals. Each signal's reliability is
 * already in [0, 1], so the average is too.
 *
 * Formula:  mean(signal.reliability for signal in rawSignals)
 *
 * Edge cases:
 *   - No raw signals → 0
 *   - Any reliability value outside [0, 1] is clamped first
 */
export function calculateEvidenceReliability(memory: SharedMemory): number {
    if (memory.rawSignals.length === 0) return 0;
    const reliabilities = memory.rawSignals.map((s) => clamp(s.reliability));
    return clamp(average(reliabilities));
}

/**
 * AGENT AGREEMENT — 0 to 1
 *
 * Measures how much scoring agents agree on the analysis by comparing
 * their score spread. Low standard deviation = high agreement.
 *
 * Formula:  1 - clamp(stdDev(agentScores) / 50)
 *
 * Where 50 is the theoretical maximum stdDev on a [0, 100] score scale.
 *
 * Edge cases:
 *   - 0 agents with a score → 1.0  (no disagreement possible)
 *   - 1 agent with a score  → 1.0  (trivially in agreement)
 *   - Scores wildly outside [0, 100] → agreement approaches 0 after clamp
 *
 * @note Only agents that provide a numeric `score` field contribute.
 *       Non-scoring agents (research, signal, debate) are excluded.
 */
export function calculateAgentAgreement(memory: SharedMemory): number {
    const scores = Object.values(memory.agentOutputs)
        .map((o) => o.score)
        .filter((s): s is number => typeof s === 'number');

    if (scores.length <= 1) return 1; // trivially in agreement

    const stdDev = standardDeviation(scores);
    const agreement = 1 - clamp(stdDev / THEORETICAL_MAX_STD_DEV);
    return clamp(agreement);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute the full confidence breakdown for a given SharedMemory state.
 *
 * This is a **pure function** — it reads memory but never modifies it.
 * Pair with `updateConfidence()` from memoryStore to write back:
 *
 * @example
 * ```typescript
 * import { computeConfidence } from '@/lib/scoring/confidenceEngine';
 * import { updateConfidence }  from '@/lib/memoryStore';
 *
 * memory = updateConfidence(memory, computeConfidence(memory));
 * ```
 *
 * @returns MemoryConfidenceData with `overall` and `breakdown` — all values in [0, 1]
 */
export function computeConfidence(memory: SharedMemory): MemoryConfidenceData {
    const dataCompleteness = round4(calculateDataCompleteness(memory));
    const agentAgreement = round4(calculateAgentAgreement(memory));
    const evidenceReliability = round4(calculateEvidenceReliability(memory));

    const overall = round4(
        clamp(
            dataCompleteness * WEIGHTS.dataCompleteness +
            agentAgreement * WEIGHTS.agentAgreement +
            evidenceReliability * WEIGHTS.evidenceReliability,
        ),
    );

    return {
        overall,
        breakdown: {
            dataCompleteness: clamp(dataCompleteness),
            agentAgreement: clamp(agentAgreement),
            evidenceReliability: clamp(evidenceReliability),
        },
    };
}

// ─── Interpretation Helpers ────────────────────────────────────────────────────

/**
 * Categorize a confidence score into a human-readable tier.
 *
 * | Range      | Tier         | Meaning                              |
 * |------------|--------------|--------------------------------------|
 * | 0.00–0.39  | LOW          | Insufficient data, treat with caution |
 * | 0.40–0.59  | MODERATE     | Partial coverage, some gaps           |
 * | 0.60–0.79  | HIGH         | Good coverage, reliable signals       |
 * | 0.80–1.00  | VERY_HIGH    | Comprehensive, agents agree           |
 */
export type ConfidenceTier = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export function classifyConfidence(overall: number): ConfidenceTier {
    const v = clamp(overall);
    if (v >= 0.80) return 'VERY_HIGH';
    if (v >= 0.60) return 'HIGH';
    if (v >= 0.40) return 'MODERATE';
    return 'LOW';
}

/**
 * Return the weakest dimension name and its score for surfacing to the UI.
 * Useful for tooltips like "Low confidence due to sparse evidence."
 */
export function getWeakestDimension(
    breakdown: MemoryConfidenceData['breakdown'],
): { dimension: keyof MemoryConfidenceData['breakdown']; score: number } {
    const entries = Object.entries(breakdown) as Array<
        [keyof MemoryConfidenceData['breakdown'], number]
    >;
    const [dimension, score] = entries.reduce(
        (min, cur) => (cur[1] < min[1] ? cur : min),
        entries[0],
    );
    return { dimension, score };
}

// ─── Re-exports for convenience ────────────────────────────────────────────────

export { EXPECTED_SIGNAL_CATEGORIES, EXPECTED_CATEGORY_COUNT, WEIGHTS };
