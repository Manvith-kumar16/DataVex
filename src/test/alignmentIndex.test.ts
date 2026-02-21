// src/test/alignmentIndex.test.ts
//
// Unit tests for src/lib/scoring/alignmentIndex.ts
// Tests cover:
//   - Edge cases: no agents, single agent, identical scores, max disagreement
//   - Mathematical correctness of stdDev and alignmentIndex
//   - Risk classification thresholds (all 3 tiers)
//   - AlignmentResult shape and value bounds
//   - Interpretation helpers
//   - Immutability
//   - Integration: post-pipeline memory

import { describe, it, expect } from 'vitest';
import {
    calculateAlignmentIndex,
    classifyAlignmentRisk,
    describeAlignmentRisk,
    getScoreExtremes,
    THEORETICAL_MAX_STD_DEV,
    RISK_THRESHOLDS,
    type AlignmentResult,
    type AlignmentRisk,
} from '@/lib/scoring/alignmentIndex';
import { createMemory, setAgentOutput } from '@/lib/memoryStore';
import { runAnalysis } from '@/lib/orchestrator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function memoryWithScores(scores: Record<string, number>) {
    let m = createMemory('test.com');
    for (const [key, score] of Object.entries(scores)) {
        m = setAgentOutput(m, key, { agentName: key, score, insights: [] });
    }
    return m;
}

// ── calculateAlignmentIndex — edge cases ──────────────────────────────────────

describe('calculateAlignmentIndex — edge cases', () => {
    it('returns perfect alignment for empty agentOutputs', () => {
        const m = createMemory('x.com');
        const result = calculateAlignmentIndex(m);
        expect(result.alignmentIndex).toBe(1);
        expect(result.stdDeviation).toBe(0);
        expect(result.riskIndicator).toBe('LOW');
        expect(result.scoringAgentCount).toBe(0);
        expect(result.meanScore).toBe(0);
    });

    it('returns perfect alignment for a single scoring agent', () => {
        const m = memoryWithScores({ technical: 70 });
        const result = calculateAlignmentIndex(m);
        expect(result.alignmentIndex).toBe(1);
        expect(result.stdDeviation).toBe(0);
        expect(result.riskIndicator).toBe('LOW');
        expect(result.scoringAgentCount).toBe(1);
        expect(result.meanScore).toBe(70);
    });

    it('returns alignmentIndex = 1 for identical scores', () => {
        const m = memoryWithScores({ technical: 60, financial: 60, market: 60 });
        const result = calculateAlignmentIndex(m);
        expect(result.alignmentIndex).toBe(1);
        expect(result.stdDeviation).toBe(0);
        expect(result.scoringAgentCount).toBe(3);
    });

    it('returns alignmentIndex = 0 for max disagreement [0, 100]', () => {
        const m = memoryWithScores({ technical: 0, financial: 100 });
        const result = calculateAlignmentIndex(m);
        // stdDev([0, 100]) = 50; alignment = 1 - 50/50 = 0
        expect(result.stdDeviation).toBeCloseTo(50, 4);
        expect(result.alignmentIndex).toBeCloseTo(0, 4);
        expect(result.riskIndicator).toBe('HIGH');
    });

    it('excludes agents without a score field', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'research', { agentName: 'research', insights: [] }); // no score
        m = setAgentOutput(m, 'technical', { agentName: 'technical', score: 75, insights: [] });
        const result = calculateAlignmentIndex(m);
        expect(result.scoringAgentCount).toBe(1);
        expect(result.alignmentIndex).toBe(1); // single scored agent
    });
});

// ── calculateAlignmentIndex — math correctness ────────────────────────────────

describe('calculateAlignmentIndex — math', () => {
    it('alignmentIndex is in [0, 1] for any input', () => {
        const cases = [
            { technical: 0, financial: 0, market: 0 },
            { technical: 50, financial: 50, market: 50 },
            { technical: 100, financial: 100, market: 100 },
            { technical: 10, financial: 90, market: 50 },
        ];
        for (const scores of cases) {
            const result = calculateAlignmentIndex(memoryWithScores(scores));
            expect(result.alignmentIndex).toBeGreaterThanOrEqual(0);
            expect(result.alignmentIndex).toBeLessThanOrEqual(1);
        }
    });

    it('stdDeviation is 0 for identical scores', () => {
        const result = calculateAlignmentIndex(memoryWithScores({ a: 55, b: 55, c: 55 }));
        expect(result.stdDeviation).toBe(0);
    });

    it('higher disagreement → lower alignmentIndex', () => {
        const lowDisagreement = calculateAlignmentIndex(memoryWithScores({ t: 60, f: 65, m: 62 }));
        const highDisagreement = calculateAlignmentIndex(memoryWithScores({ t: 10, f: 90, m: 50 }));
        expect(highDisagreement.alignmentIndex).toBeLessThan(lowDisagreement.alignmentIndex);
    });

    it('alignmentIndex formula: 1 - stdDev/50', () => {
        const scores = { t: 40, f: 80 };
        const result = calculateAlignmentIndex(memoryWithScores(scores));
        // stdDev([40, 80]) = 20; alignment = 1 - 20/50 = 0.6
        expect(result.alignmentIndex).toBeCloseTo(1 - result.stdDeviation / THEORETICAL_MAX_STD_DEV, 4);
    });

    it('meanScore is the arithmetic mean of scored agents', () => {
        const result = calculateAlignmentIndex(memoryWithScores({ t: 60, f: 80, m: 70 }));
        expect(result.meanScore).toBeCloseTo(70, 4);
    });

    it('stdDeviation is rounded to 4 decimal places', () => {
        const result = calculateAlignmentIndex(memoryWithScores({ a: 33, b: 67 }));
        expect(String(result.stdDeviation)).toMatch(/^\d+(\.\d{1,4})?$/);
    });

    it('alignmentIndex is rounded to 4 decimal places', () => {
        const result = calculateAlignmentIndex(memoryWithScores({ a: 33, b: 67 }));
        expect(String(result.alignmentIndex)).toMatch(/^\d+(\.\d{1,4})?$|^[01]$/);
    });

    it('is deterministic', () => {
        const m = memoryWithScores({ t: 55, f: 82, m: 41 });
        const r1 = calculateAlignmentIndex(m);
        const r2 = calculateAlignmentIndex(m);
        expect(r1).toEqual(r2);
    });

    it('does not mutate the input memory', () => {
        const m = memoryWithScores({ t: 55, f: 80 });
        const frozen = JSON.stringify(m);
        calculateAlignmentIndex(m);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── Risk classification thresholds ────────────────────────────────────────────

describe('calculateAlignmentIndex — risk classification', () => {
    it('returns LOW for alignment >= 0.75', () => {
        const result = calculateAlignmentIndex(memoryWithScores({ t: 70, f: 75, m: 72 }));
        expect(result.riskIndicator).toBe('LOW');
    });

    it('returns MODERATE for alignment in [0.45, 0.75)', () => {
        // stdDev needs to be high enough to push alignment to ~0.6
        // stdDev ≈ 20 → alignment ≈ 0.6 (MODERATE)
        const result = calculateAlignmentIndex(memoryWithScores({ t: 40, f: 80 }));
        expect(result.alignmentIndex).toBeCloseTo(0.6, 1);
        expect(result.riskIndicator).toBe('MODERATE');
    });

    it('returns HIGH for alignment < 0.45', () => {
        // stdDev([0, 100]) = 50 → alignment = 0 (HIGH)
        const result = calculateAlignmentIndex(memoryWithScores({ t: 0, f: 100 }));
        expect(result.riskIndicator).toBe('HIGH');
    });

    it('returns LOW exactly at 0.75 boundary', () => {
        expect(classifyAlignmentRisk(0.75)).toBe('LOW');
    });

    it('returns MODERATE exactly at 0.45 boundary', () => {
        expect(classifyAlignmentRisk(0.45)).toBe('MODERATE');
    });

    it('returns HIGH just below 0.45', () => {
        expect(classifyAlignmentRisk(0.449)).toBe('HIGH');
    });

    it('returns LOW for 1.0 (perfect agreement)', () => {
        expect(classifyAlignmentRisk(1.0)).toBe('LOW');
    });

    it('returns HIGH for 0.0 (max disagreement)', () => {
        expect(classifyAlignmentRisk(0.0)).toBe('HIGH');
    });

    it('clamps values > 1 to VERY_HIGH range', () => {
        expect(classifyAlignmentRisk(1.5)).toBe('LOW');
    });

    it('clamps values < 0 to HIGH', () => {
        expect(classifyAlignmentRisk(-0.5)).toBe('HIGH');
    });
});

// ── RISK_THRESHOLDS constant ──────────────────────────────────────────────────

describe('RISK_THRESHOLDS', () => {
    it('has exactly 3 entries', () => {
        expect(RISK_THRESHOLDS).toHaveLength(3);
    });

    it('is sorted in descending order by min', () => {
        for (let i = 0; i < RISK_THRESHOLDS.length - 1; i++) {
            expect(RISK_THRESHOLDS[i].min).toBeGreaterThan(RISK_THRESHOLDS[i + 1].min);
        }
    });

    it('covers all three risk tiers', () => {
        const risks = RISK_THRESHOLDS.map((t) => t.risk);
        expect(risks).toContain('LOW');
        expect(risks).toContain('MODERATE');
        expect(risks).toContain('HIGH');
    });
});

// ── describeAlignmentRisk ─────────────────────────────────────────────────────

describe('describeAlignmentRisk', () => {
    const tiers: AlignmentRisk[] = ['LOW', 'MODERATE', 'HIGH'];

    it.each(tiers)('returns a non-empty string for %s', (risk) => {
        const desc = describeAlignmentRisk(risk);
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
    });

    it('mentions agreement for LOW', () => {
        expect(describeAlignmentRisk('LOW').toLowerCase()).toMatch(/agree/);
    });

    it('mentions disagreement for HIGH', () => {
        expect(describeAlignmentRisk('HIGH').toLowerCase()).toMatch(/disagree/);
    });
});

// ── getScoreExtremes ──────────────────────────────────────────────────────────

describe('getScoreExtremes', () => {
    it('returns null for 0 scoring agents', () => {
        expect(getScoreExtremes(createMemory('x.com'))).toBeNull();
    });

    it('returns null for 1 scoring agent', () => {
        const m = memoryWithScores({ technical: 70 });
        expect(getScoreExtremes(m)).toBeNull();
    });

    it('identifies highest and lowest agents correctly', () => {
        const m = memoryWithScores({ technical: 90, financial: 30, market: 60 });
        const result = getScoreExtremes(m);
        expect(result).not.toBeNull();
        expect(result!.highest.agent).toBe('technical');
        expect(result!.highest.score).toBe(90);
        expect(result!.lowest.agent).toBe('financial');
        expect(result!.lowest.score).toBe(30);
    });

    it('handles all equal scores (returns any two valid entries)', () => {
        const m = memoryWithScores({ technical: 50, financial: 50 });
        const result = getScoreExtremes(m);
        expect(result).not.toBeNull();
        expect(result!.highest.score).toBe(50);
        expect(result!.lowest.score).toBe(50);
    });
});

// ── Integration: post-pipeline memory ────────────────────────────────────────

describe('calculateAlignmentIndex — post-pipeline integration', () => {
    it('produces a valid AlignmentResult after a full pipeline run', async () => {
        const { memory } = await runAnalysis('stripe.com');
        const result = calculateAlignmentIndex(memory);

        expect(result.alignmentIndex).toBeGreaterThanOrEqual(0);
        expect(result.alignmentIndex).toBeLessThanOrEqual(1);
        expect(['LOW', 'MODERATE', 'HIGH']).toContain(result.riskIndicator);
        expect(result.scoringAgentCount).toBeGreaterThan(0);
    });

    it('has at least 3 scoring agents (technical, financial, market) after full pipeline', async () => {
        const { memory } = await runAnalysis('linear.app');
        const result = calculateAlignmentIndex(memory);
        // technical + financial + market + verdict all produce a score field
        expect(result.scoringAgentCount).toBeGreaterThanOrEqual(3);
    });

    it('meanScore is within [0, 100] after pipeline', async () => {
        const { memory } = await runAnalysis('notion.so');
        const result = calculateAlignmentIndex(memory);
        expect(result.meanScore).toBeGreaterThanOrEqual(0);
        expect(result.meanScore).toBeLessThanOrEqual(100);
    });

    it('extreme disagreement test from spec passes', () => {
        // Replicates the spec's example test verbatim (mutating approach adapted):
        const m = memoryWithScores({ technical: 95, financial: 10, market: 85 });
        const result = calculateAlignmentIndex(m);
        expect(result.alignmentIndex).toBeLessThan(0.75);
    });
});
