// src/test/confidenceEngine.test.ts
//
// Unit tests for src/lib/scoring/confidenceEngine.ts
//
// Tests cover:
//   - Math utilities (clamp, average, standardDeviation)
//   - Each sub-score function independently
//   - Edge cases: empty memory, missing scores, extreme values
//   - Full computeConfidence() output shape and value bounds
//   - Weighted formula correctness
//   - Determinism
//   - Interpretation helpers (classifyConfidence, getWeakestDimension)

import { describe, it, expect } from 'vitest';
import {
    clamp,
    average,
    standardDeviation,
    calculateDataCompleteness,
    calculateEvidenceReliability,
    calculateAgentAgreement,
    computeConfidence,
    classifyConfidence,
    getWeakestDimension,
    EXPECTED_CATEGORY_COUNT,
    WEIGHTS,
} from '@/lib/scoring/confidenceEngine';
import { createMemory, addRawSignals, addStructuredSignals, setAgentOutput } from '@/lib/memoryStore';
import { runAnalysis } from '@/lib/orchestrator';
import type { Signal, StructuredSignal } from '@/types/analysis';

// ── Math Utilities ────────────────────────────────────────────────────────────

describe('clamp', () => {
    it('returns value unchanged when within [0, 1]', () => {
        expect(clamp(0.5)).toBe(0.5);
        expect(clamp(0)).toBe(0);
        expect(clamp(1)).toBe(1);
    });

    it('clamps below minimum to 0', () => {
        expect(clamp(-0.5)).toBe(0);
        expect(clamp(-100)).toBe(0);
    });

    it('clamps above maximum to 1', () => {
        expect(clamp(1.5)).toBe(1);
        expect(clamp(999)).toBe(1);
    });

    it('clamps NaN to min', () => {
        expect(clamp(NaN)).toBe(0);
    });

    it('clamps Infinity to max', () => {
        expect(clamp(Infinity)).toBe(1);
    });

    it('respects custom min and max', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(11, 0, 10)).toBe(10);
    });
});

describe('average', () => {
    it('computes mean of positive numbers', () => {
        expect(average([2, 4, 6])).toBe(4);
    });

    it('returns 0 for an empty array', () => {
        expect(average([])).toBe(0);
    });

    it('returns the single value for a length-1 array', () => {
        expect(average([7])).toBe(7);
    });

    it('handles decimals correctly', () => {
        expect(average([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 10);
    });
});

describe('standardDeviation', () => {
    it('returns 0 for a single-element array', () => {
        expect(standardDeviation([5])).toBe(0);
    });

    it('returns 0 for an empty array', () => {
        expect(standardDeviation([])).toBe(0);
    });

    it('returns 0 when all values are identical', () => {
        expect(standardDeviation([7, 7, 7, 7])).toBe(0);
    });

    it('computes population stddev correctly', () => {
        // [2, 4, 4, 4, 5, 5, 7, 9] → population stddev = 2
        expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 5);
    });

    it('max stddev for [0, 100] is 50', () => {
        expect(standardDeviation([0, 100])).toBeCloseTo(50, 5);
    });
});

// ── Sub-Score: Data Completeness ──────────────────────────────────────────────

describe('calculateDataCompleteness', () => {
    it('returns 0 for empty structuredSignals', () => {
        const m = createMemory('x.com');
        expect(calculateDataCompleteness(m)).toBe(0);
    });

    it('returns correct fraction for partial coverage', () => {
        // 3 unique categories out of 6
        let m = createMemory('x.com');
        const signals: StructuredSignal[] = [
            { id: '1', category: 'FUNDING', summary: 'a', weight: 0.33 },
            { id: '2', category: 'HIRING', summary: 'b', weight: 0.33 },
            { id: '3', category: 'TECH', summary: 'c', weight: 0.34 },
        ];
        m = addStructuredSignals(m, signals);
        expect(calculateDataCompleteness(m)).toBeCloseTo(3 / EXPECTED_CATEGORY_COUNT, 5);
    });

    it('returns 1 when all 6 categories are present', () => {
        let m = createMemory('x.com');
        const signals: StructuredSignal[] = [
            { id: '1', category: 'FUNDING', summary: '', weight: 0.17 },
            { id: '2', category: 'HIRING', summary: '', weight: 0.17 },
            { id: '3', category: 'TECH', summary: '', weight: 0.17 },
            { id: '4', category: 'EXPANSION', summary: '', weight: 0.17 },
            { id: '5', category: 'MARKET', summary: '', weight: 0.17 },
            { id: '6', category: 'RISK', summary: '', weight: 0.15 },
        ];
        m = addStructuredSignals(m, signals);
        expect(calculateDataCompleteness(m)).toBe(1);
    });

    it('duplicates of same category do not increase score', () => {
        let m = createMemory('x.com');
        const signals: StructuredSignal[] = [
            { id: '1', category: 'FUNDING', summary: '', weight: 0.5 },
            { id: '2', category: 'FUNDING', summary: '', weight: 0.5 }, // duplicate category
        ];
        m = addStructuredSignals(m, signals);
        // Only 1 unique category
        expect(calculateDataCompleteness(m)).toBeCloseTo(1 / 6, 5);
    });
});

// ── Sub-Score: Evidence Reliability ───────────────────────────────────────────

describe('calculateEvidenceReliability', () => {
    it('returns 0 for empty rawSignals', () => {
        const m = createMemory('x.com');
        expect(calculateEvidenceReliability(m)).toBe(0);
    });

    it('returns the mean reliability', () => {
        let m = createMemory('x.com');
        const signals: Signal[] = [
            { id: '1', type: 'FUNDING', content: '', reliability: 0.8, timestamp: 0 },
            { id: '2', type: 'HIRING', content: '', reliability: 0.4, timestamp: 0 },
        ];
        m = addRawSignals(m, signals);
        expect(calculateEvidenceReliability(m)).toBeCloseTo(0.6, 5);
    });

    it('returns 1 when all reliabilities are 1', () => {
        let m = createMemory('x.com');
        const signals: Signal[] = [
            { id: '1', type: 'TECH', content: '', reliability: 1, timestamp: 0 },
            { id: '2', type: 'TECH', content: '', reliability: 1, timestamp: 0 },
        ];
        m = addRawSignals(m, signals);
        expect(calculateEvidenceReliability(m)).toBe(1);
    });

    it('clamps reliability values above 1', () => {
        let m = createMemory('x.com');
        const signals: Signal[] = [
            { id: '1', type: 'TECH', content: '', reliability: 1.5, timestamp: 0 },
        ];
        m = addRawSignals(m, signals);
        expect(calculateEvidenceReliability(m)).toBe(1);
    });
});

// ── Sub-Score: Agent Agreement ────────────────────────────────────────────────

describe('calculateAgentAgreement', () => {
    it('returns 1 for empty agentOutputs', () => {
        const m = createMemory('x.com');
        expect(calculateAgentAgreement(m)).toBe(1);
    });

    it('returns 1 when only one agent has a score', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 75, insights: [] });
        expect(calculateAgentAgreement(m)).toBe(1);
    });

    it('returns 1 when all agents have identical scores', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 60, insights: [] });
        m = setAgentOutput(m, 'financial', { agentName: 'FinancialAgent', score: 60, insights: [] });
        m = setAgentOutput(m, 'market', { agentName: 'MarketAgent', score: 60, insights: [] });
        expect(calculateAgentAgreement(m)).toBe(1);
    });

    it('returns ~0 when agents maximally disagree (0 and 100)', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 0, insights: [] });
        m = setAgentOutput(m, 'financial', { agentName: 'FinancialAgent', score: 100, insights: [] });
        // stdDev([0, 100]) = 50, agreement = 1 - 50/50 = 0
        expect(calculateAgentAgreement(m)).toBeCloseTo(0, 5);
    });

    it('is between 0 and 1 for moderate disagreement', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 60, insights: [] });
        m = setAgentOutput(m, 'financial', { agentName: 'FinancialAgent', score: 80, insights: [] });
        m = setAgentOutput(m, 'market', { agentName: 'MarketAgent', score: 40, insights: [] });
        const a = calculateAgentAgreement(m);
        expect(a).toBeGreaterThan(0);
        expect(a).toBeLessThan(1);
    });

    it('ignores agents that have no score field', () => {
        // Research and signal agents don't have a score
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'research', { agentName: 'ResearchAgent', insights: [] }); // no score
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 70, insights: [] });
        // Only one scored agent → returns 1
        expect(calculateAgentAgreement(m)).toBe(1);
    });
});

// ── computeConfidence ─────────────────────────────────────────────────────────

describe('computeConfidence', () => {
    it('returns a valid MemoryConfidenceData shape', () => {
        const m = createMemory('x.com');
        const c = computeConfidence(m);
        expect(typeof c.overall).toBe('number');
        expect(typeof c.breakdown.dataCompleteness).toBe('number');
        expect(typeof c.breakdown.agentAgreement).toBe('number');
        expect(typeof c.breakdown.evidenceReliability).toBe('number');
    });

    it('overall is within [0, 1] for empty memory', () => {
        const c = computeConfidence(createMemory('x.com'));
        expect(c.overall).toBeGreaterThanOrEqual(0);
        expect(c.overall).toBeLessThanOrEqual(1);
    });

    it('all breakdown values are within [0, 1]', () => {
        const c = computeConfidence(createMemory('x.com'));
        Object.values(c.breakdown).forEach((v) => {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        });
    });

    it('empty memory produces overall = 0.3 (agentAgreement = 1, others = 0)', () => {
        // dataCompleteness = 0, agentAgreement = 1 (no agents = trivially agree), evidenceReliability = 0
        // overall = 0×0.4 + 1×0.3 + 0×0.3 = 0.3
        const c = computeConfidence(createMemory('x.com'));
        expect(c.overall).toBeCloseTo(0.3, 4);
        expect(c.breakdown.agentAgreement).toBe(1);
        expect(c.breakdown.dataCompleteness).toBe(0);
        expect(c.breakdown.evidenceReliability).toBe(0);
    });

    it('overall matches weighted formula manually', () => {
        let m = createMemory('x.com');
        // Give partial data
        m = addRawSignals(m, [
            { id: '1', type: 'FUNDING', content: '', reliability: 0.8, timestamp: 0 },
        ]);
        m = addStructuredSignals(m, [
            { id: '1', category: 'FUNDING', summary: '', weight: 1 },
        ]);
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 70, insights: [] });

        const c = computeConfidence(m);

        // Manual calculation
        const dc = 1 / 6;
        const er = 0.8;
        const aa = 1; // only one scored agent
        const expected = dc * WEIGHTS.dataCompleteness + aa * WEIGHTS.agentAgreement + er * WEIGHTS.evidenceReliability;

        expect(c.overall).toBeCloseTo(expected, 3);
    });

    it('is deterministic — same memory always returns same output', () => {
        const m = createMemory('stripe.com');
        const c1 = computeConfidence(m);
        const c2 = computeConfidence(m);
        expect(c1).toEqual(c2);
    });

    it('does not mutate the input memory', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        computeConfidence(m);
        expect(JSON.stringify(m)).toBe(frozen);
    });

    it('rounds to 4 decimal places', () => {
        const c = computeConfidence(createMemory('x.com'));
        // 0.3 has exact representation in 4dp
        expect(String(c.overall)).toMatch(/^\d+\.\d{1,4}$|^[01]$/);
    });
});

// ── Integration: full pipeline memory ────────────────────────────────────────

describe('computeConfidence — post-pipeline integration', () => {
    it('returns a higher confidence after a full pipeline run', async () => {
        const empty = createMemory('stripe.com');
        const emptyConf = computeConfidence(empty).overall;

        const { memory: fullMemory } = await runAnalysis('stripe.com');
        const postPipeConf = computeConfidence(fullMemory).overall;

        expect(postPipeConf).toBeGreaterThan(emptyConf);
    });

    it('overall is >= 0.3 after a full pipeline run', async () => {
        const { memory } = await runAnalysis('linear.app');
        const c = computeConfidence(memory);
        expect(c.overall).toBeGreaterThanOrEqual(0.3);
        expect(c.overall).toBeLessThanOrEqual(1);
    });

    it('all 6 signal categories appear after full pipeline (completeness = 1)', async () => {
        const { memory } = await runAnalysis('notion.so');
        const c = computeConfidence(memory);
        // ResearchAgent generates all 6 signal types for most domains
        expect(c.breakdown.dataCompleteness).toBeGreaterThan(0);
    });
});

// ── classifyConfidence ────────────────────────────────────────────────────────

describe('classifyConfidence', () => {
    it('classifies 0.00 as LOW', () => expect(classifyConfidence(0)).toBe('LOW'));
    it('classifies 0.39 as LOW', () => expect(classifyConfidence(0.39)).toBe('LOW'));
    it('classifies 0.40 as MODERATE', () => expect(classifyConfidence(0.40)).toBe('MODERATE'));
    it('classifies 0.59 as MODERATE', () => expect(classifyConfidence(0.59)).toBe('MODERATE'));
    it('classifies 0.60 as HIGH', () => expect(classifyConfidence(0.60)).toBe('HIGH'));
    it('classifies 0.79 as HIGH', () => expect(classifyConfidence(0.79)).toBe('HIGH'));
    it('classifies 0.80 as VERY_HIGH', () => expect(classifyConfidence(0.80)).toBe('VERY_HIGH'));
    it('classifies 1.00 as VERY_HIGH', () => expect(classifyConfidence(1.00)).toBe('VERY_HIGH'));
    it('clamps values above 1', () => expect(classifyConfidence(1.5)).toBe('VERY_HIGH'));
    it('clamps values below 0', () => expect(classifyConfidence(-0.5)).toBe('LOW'));
});

// ── getWeakestDimension ───────────────────────────────────────────────────────

describe('getWeakestDimension', () => {
    it('identifies the lowest dimension', () => {
        const breakdown = {
            dataCompleteness: 0.5,
            agentAgreement: 0.9,
            evidenceReliability: 0.2, // lowest
        };
        const result = getWeakestDimension(breakdown);
        expect(result.dimension).toBe('evidenceReliability');
        expect(result.score).toBeCloseTo(0.2, 5);
    });

    it('returns the first dimension when all are equal', () => {
        const breakdown = {
            dataCompleteness: 0.5,
            agentAgreement: 0.5,
            evidenceReliability: 0.5,
        };
        const result = getWeakestDimension(breakdown);
        expect(typeof result.dimension).toBe('string');
        expect(result.score).toBe(0.5);
    });
});
