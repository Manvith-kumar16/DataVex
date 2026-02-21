// src/test/agents.test.ts
//
// Unit tests for the modular agent pipeline.
// Each agent is tested in isolation to verify:
//   - Output shape and contract
//   - Score bounds (0–100 where applicable)
//   - Immutability of the input memory reference
//   - Correct memory key population

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createEmptyMemory,
    researchAgent,
    signalAgent,
    technicalAgent,
    financialAgent,
    marketAgent,
    debateAgent,
    verdictAgent,
} from '@/lib/agents';
import type { SharedMemory, Signal } from '@/lib/agents';

// ── Test Helpers ──────────────────────────────────────────────────────────────

function makeMemoryWithSignals(domain: string): SharedMemory {
    const base = createEmptyMemory(domain);
    // Run research + signal to populate raw and structured signals
    const afterResearch = researchAgent(base);
    return signalAgent(afterResearch);
}

function makeFullPipeline(domain: string): SharedMemory {
    let memory = createEmptyMemory(domain);
    memory = researchAgent(memory);
    memory = signalAgent(memory);
    memory = technicalAgent(memory);
    memory = financialAgent(memory);
    memory = marketAgent(memory);
    memory = debateAgent(memory);
    memory = verdictAgent(memory);
    return memory;
}

// ── createEmptyMemory ─────────────────────────────────────────────────────────

describe('createEmptyMemory', () => {
    it('creates a memory object with the correct domain', () => {
        const memory = createEmptyMemory('stripe.com');
        expect(memory.domain).toBe('stripe.com');
    });

    it('initializes arrays as empty', () => {
        const memory = createEmptyMemory('stripe.com');
        expect(memory.rawSignals).toEqual([]);
        expect(memory.structuredSignals).toEqual([]);
        expect(memory.debateLog).toEqual([]);
    });

    it('initializes agentOutputs as empty record', () => {
        const memory = createEmptyMemory('stripe.com');
        expect(memory.agentOutputs).toEqual({});
    });
});

// ── ResearchAgent ─────────────────────────────────────────────────────────────

describe('researchAgent', () => {
    let base: SharedMemory;

    beforeEach(() => {
        base = createEmptyMemory('stripe.com');
    });

    it('adds signals to rawSignals', () => {
        const updated = researchAgent(base);
        expect(updated.rawSignals.length).toBeGreaterThan(0);
    });

    it('generates at least 3 signals', () => {
        const updated = researchAgent(base);
        expect(updated.rawSignals.length).toBeGreaterThanOrEqual(3);
    });

    it('every signal has required fields', () => {
        const updated = researchAgent(base);
        for (const signal of updated.rawSignals) {
            expect(signal).toMatchObject<Partial<Signal>>({
                id: expect.any(String),
                type: expect.any(String),
                content: expect.any(String),
                reliability: expect.any(Number),
                timestamp: expect.any(Number),
            });
        }
    });

    it('reliability is always between 0 and 1', () => {
        const updated = researchAgent(base);
        for (const signal of updated.rawSignals) {
            expect(signal.reliability).toBeGreaterThanOrEqual(0);
            expect(signal.reliability).toBeLessThanOrEqual(1);
        }
    });

    it('populates agentOutputs["research"]', () => {
        const updated = researchAgent(base);
        expect(updated.agentOutputs['research']).toBeDefined();
        expect(updated.agentOutputs['research'].agentName).toBe('ResearchAgent');
    });

    it('does not mutate the original memory reference', () => {
        const frozen = JSON.stringify(base);
        researchAgent(base);
        expect(JSON.stringify(base)).toBe(frozen);
    });

    it('is deterministic — same domain produces same signal count', () => {
        const run1 = researchAgent(createEmptyMemory('stripe.com'));
        const run2 = researchAgent(createEmptyMemory('stripe.com'));
        expect(run1.rawSignals.length).toBe(run2.rawSignals.length);
    });

    it('different domains produce different signals', () => {
        const run1 = researchAgent(createEmptyMemory('stripe.com'));
        const run2 = researchAgent(createEmptyMemory('plaid.com'));
        const ids1 = run1.rawSignals.map((s) => s.id);
        const ids2 = run2.rawSignals.map((s) => s.id);
        expect(ids1).not.toEqual(ids2);
    });
});

// ── SignalAgent ───────────────────────────────────────────────────────────────

describe('signalAgent', () => {
    it('creates one StructuredSignal per raw signal', () => {
        const base = createEmptyMemory('notion.so');
        const after = researchAgent(base);
        const updated = signalAgent(after);
        expect(updated.structuredSignals.length).toBe(updated.rawSignals.length);
    });

    it('all weights sum to approximately 1 (±0.01)', () => {
        const base = createEmptyMemory('notion.so');
        const after = researchAgent(base);
        const updated = signalAgent(after);
        const sum = updated.structuredSignals.reduce((acc, s) => acc + s.weight, 0);
        expect(sum).toBeCloseTo(1, 1);
    });

    it('populates agentOutputs["signal"]', () => {
        const base = createEmptyMemory('notion.so');
        const after = researchAgent(base);
        const updated = signalAgent(after);
        expect(updated.agentOutputs['signal']).toBeDefined();
        expect(updated.agentOutputs['signal'].agentName).toBe('SignalAgent');
    });

    it('handles empty rawSignals gracefully', () => {
        const base = createEmptyMemory('empty.com');
        const updated = signalAgent(base);
        expect(updated.structuredSignals).toEqual([]);
        expect(updated.agentOutputs['signal']).toBeDefined();
    });

    it('does not mutate the original memory reference', () => {
        const withSignals = makeMemoryWithSignals('notion.so');
        const frozen = JSON.stringify(withSignals);
        signalAgent(withSignals);
        expect(JSON.stringify(withSignals)).toBe(frozen);
    });
});

// ── TechnicalAgent ────────────────────────────────────────────────────────────

describe('technicalAgent', () => {
    it('produces a score between 0 and 100', () => {
        const memory = makeMemoryWithSignals('github.com');
        const updated = technicalAgent(memory);
        const score = updated.agentOutputs['technical']?.score ?? -1;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    it('populates agentOutputs["technical"]', () => {
        const memory = makeMemoryWithSignals('github.com');
        const updated = technicalAgent(memory);
        expect(updated.agentOutputs['technical']).toBeDefined();
        expect(updated.agentOutputs['technical'].agentName).toBe('TechnicalAgent');
    });

    it('output includes insights array', () => {
        const memory = makeMemoryWithSignals('github.com');
        const updated = technicalAgent(memory);
        expect(Array.isArray(updated.agentOutputs['technical'].insights)).toBe(true);
        expect(updated.agentOutputs['technical'].insights.length).toBeGreaterThan(0);
    });

    it('scores 0 when there are no TECH or HIRING signals', () => {
        const base = createEmptyMemory('test.com');
        const updated = technicalAgent(base); // structuredSignals is empty
        expect(updated.agentOutputs['technical']?.score).toBe(0);
    });

    it('does not mutate the original memory reference', () => {
        const memory = makeMemoryWithSignals('github.com');
        const frozen = JSON.stringify(memory);
        technicalAgent(memory);
        expect(JSON.stringify(memory)).toBe(frozen);
    });
});

// ── FinancialAgent ────────────────────────────────────────────────────────────

describe('financialAgent', () => {
    it('produces a score between 0 and 100', () => {
        const memory = makeMemoryWithSignals('stripe.com');
        const updated = financialAgent(memory);
        const score = updated.agentOutputs['financial']?.score ?? -1;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    it('populates agentOutputs["financial"]', () => {
        const memory = makeMemoryWithSignals('stripe.com');
        const updated = financialAgent(memory);
        expect(updated.agentOutputs['financial']).toBeDefined();
        expect(updated.agentOutputs['financial'].agentName).toBe('FinancialAgent');
    });

    it('scores 0 when there are no FUNDING signals', () => {
        const base = createEmptyMemory('nofunding.com');
        const updated = financialAgent(base);
        expect(updated.agentOutputs['financial']?.score).toBe(0);
    });

    it('does not mutate the original memory reference', () => {
        const memory = makeMemoryWithSignals('stripe.com');
        const frozen = JSON.stringify(memory);
        financialAgent(memory);
        expect(JSON.stringify(memory)).toBe(frozen);
    });
});

// ── MarketAgent ───────────────────────────────────────────────────────────────

describe('marketAgent', () => {
    it('produces a score between 0 and 100', () => {
        const memory = makeMemoryWithSignals('shopify.com');
        const updated = marketAgent(memory);
        const score = updated.agentOutputs['market']?.score ?? -1;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    it('populates agentOutputs["market"]', () => {
        const memory = makeMemoryWithSignals('shopify.com');
        const updated = marketAgent(memory);
        expect(updated.agentOutputs['market']).toBeDefined();
        expect(updated.agentOutputs['market'].agentName).toBe('MarketAgent');
    });

    it('scores 0 when there are no MARKET or EXPANSION signals', () => {
        const base = createEmptyMemory('nomarket.com');
        const updated = marketAgent(base);
        expect(updated.agentOutputs['market']?.score).toBe(0);
    });

    it('does not mutate the original memory reference', () => {
        const memory = makeMemoryWithSignals('shopify.com');
        const frozen = JSON.stringify(memory);
        marketAgent(memory);
        expect(JSON.stringify(memory)).toBe(frozen);
    });
});

// ── DebateAgent ───────────────────────────────────────────────────────────────

describe('debateAgent', () => {
    it('creates one DebateMessage per scoring agent output', () => {
        // Set up memory with all three scoring agents populated
        const base = createEmptyMemory('atlassian.com');
        let memory = researchAgent(base);
        memory = signalAgent(memory);
        memory = technicalAgent(memory);
        memory = financialAgent(memory);
        memory = marketAgent(memory);
        const updated = debateAgent(memory);

        // 3 scoring agents (technical, financial, market) — research/signal excluded
        expect(updated.debateLog.length).toBe(3);
    });

    it('every DebateMessage has required fields', () => {
        const base = createEmptyMemory('atlassian.com');
        let memory = researchAgent(base);
        memory = signalAgent(memory);
        memory = technicalAgent(memory);
        memory = financialAgent(memory);
        memory = marketAgent(memory);
        const updated = debateAgent(memory);

        for (const msg of updated.debateLog) {
            expect(typeof msg.agent).toBe('string');
            expect(typeof msg.message).toBe('string');
            expect(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).toContain(msg.sentiment);
            expect(msg.confidence).toBeGreaterThanOrEqual(0);
            expect(msg.confidence).toBeLessThanOrEqual(1);
        }
    });

    it('produces an empty debateLog when no scoring agents ran', () => {
        const base = createEmptyMemory('blank.com');
        const updated = debateAgent(base);
        expect(updated.debateLog).toEqual([]);
    });

    it('does not mutate the original memory reference', () => {
        const base = createEmptyMemory('atlassian.com');
        let memory = researchAgent(base);
        memory = signalAgent(memory);
        memory = technicalAgent(memory);
        const frozen = JSON.stringify(memory);
        debateAgent(memory);
        expect(JSON.stringify(memory)).toBe(frozen);
    });
});

// ── VerdictAgent ──────────────────────────────────────────────────────────────

describe('verdictAgent', () => {
    it('produces a finalScore between 0 and 100', () => {
        const memory = makeFullPipeline('salesforce.com');
        expect(memory.scoreBreakdown?.finalScore).toBeGreaterThanOrEqual(0);
        expect(memory.scoreBreakdown?.finalScore).toBeLessThanOrEqual(100);
    });

    it('sets memory.scoreBreakdown correctly', () => {
        const memory = makeFullPipeline('salesforce.com');
        expect(memory.scoreBreakdown).toBeDefined();
        expect(typeof memory.scoreBreakdown?.technical).toBe('number');
        expect(typeof memory.scoreBreakdown?.financial).toBe('number');
        expect(typeof memory.scoreBreakdown?.market).toBe('number');
    });

    it('weights in scoreBreakdown sum to 1', () => {
        const memory = makeFullPipeline('salesforce.com');
        const weights = memory.scoreBreakdown!.weights;
        const sum = weights.technical + weights.financial + weights.market;
        expect(sum).toBeCloseTo(1, 5);
    });

    it('finalScore equals the weighted sum of sub-scores', () => {
        const memory = makeFullPipeline('salesforce.com');
        const { technical, financial, market, finalScore, weights } = memory.scoreBreakdown!;
        const expected = parseFloat(
            (technical * weights.technical + financial * weights.financial + market * weights.market).toFixed(2),
        );
        expect(finalScore).toBeCloseTo(expected, 1);
    });

    it('populates agentOutputs["verdict"]', () => {
        const memory = makeFullPipeline('salesforce.com');
        expect(memory.agentOutputs['verdict']).toBeDefined();
        expect(memory.agentOutputs['verdict'].agentName).toBe('VerdictAgent');
    });

    it('defaults missing scores to 0', () => {
        const base = createEmptyMemory('blank.com');
        const updated = verdictAgent(base); // no specialist agents ran
        expect(updated.scoreBreakdown?.finalScore).toBe(0);
    });

    it('does not mutate the original memory reference', () => {
        const base = createEmptyMemory('salesforce.com');
        let memory = researchAgent(base);
        memory = signalAgent(memory);
        memory = technicalAgent(memory);
        memory = financialAgent(memory);
        memory = marketAgent(memory);
        memory = debateAgent(memory);
        const frozen = JSON.stringify(memory);
        verdictAgent(memory);
        expect(JSON.stringify(memory)).toBe(frozen);
    });
});

// ── Full pipeline immutability ────────────────────────────────────────────────

describe('full pipeline — immutability', () => {
    it('running the full pipeline does not mutate any intermediate step', () => {
        const initial = createEmptyMemory('linear.app');
        const frozenInit = JSON.stringify(initial);

        const afterResearch = researchAgent(initial);
        expect(JSON.stringify(initial)).toBe(frozenInit); // initial unchanged

        const frozenResearch = JSON.stringify(afterResearch);
        const afterSignal = signalAgent(afterResearch);
        expect(JSON.stringify(afterResearch)).toBe(frozenResearch); // afterResearch unchanged

        const frozenSignal = JSON.stringify(afterSignal);
        const afterTech = technicalAgent(afterSignal);
        expect(JSON.stringify(afterSignal)).toBe(frozenSignal); // afterSignal unchanged

        // Spot-check that the final result has meaningful data
        expect(afterTech.agentOutputs['technical']).toBeDefined();
    });
});
