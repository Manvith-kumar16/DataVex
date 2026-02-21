// src/test/memoryStore.test.ts
//
// Unit tests for src/lib/memoryStore.ts
// Each function is tested independently to verify:
//   - Correct initialization
//   - Immutability of input references
//   - Output shape and types
//   - Guard conditions and edge cases
//   - Computed selectors

import { describe, it, expect, beforeEach } from 'vitest';
import {
    createMemory,
    cloneMemory,
    validateMemory,
    updateMemorySection,
    addRawSignals,
    addStructuredSignals,
    setAgentOutput,
    appendDebateMessages,
    updateScoreBreakdown,
    updateConfidence,
    markExecutionComplete,
    incrementRetry,
    toReadonly,
    isComplete,
    elapsedMs,
    getFinalScore,
    signalCount,
} from '@/lib/memoryStore';
import type { Signal, StructuredSignal, AgentOutput, ScoreBreakdown, MemoryConfidenceData, DebateMessage } from '@/types/analysis';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_SIGNAL: Signal = {
    id: 'sig-001',
    type: 'FUNDING',
    content: 'Series B completed',
    reliability: 0.9,
    timestamp: 1_700_000_000_000,
};

const SAMPLE_STRUCTURED: StructuredSignal = {
    id: 'sig-001',
    category: 'FUNDING',
    summary: 'Series B completed',
    weight: 0.5,
};

const SAMPLE_OUTPUT: AgentOutput = {
    agentName: 'TechnicalAgent',
    score: 75,
    insights: ['Strong tech signals detected'],
};

const SAMPLE_SCORE: ScoreBreakdown = {
    technical: 70,
    financial: 60,
    market: 50,
    finalScore: 62.5,
    weights: { technical: 0.40, financial: 0.35, market: 0.25 },
};

const SAMPLE_CONFIDENCE: MemoryConfidenceData = {
    overall: 0.78,
    breakdown: { dataCompleteness: 80, agentAgreement: 75, evidenceReliability: 0.8 },
};

const SAMPLE_DEBATE_MSG: DebateMessage = {
    agent: 'TechnicalAgent',
    message: 'Strong signals detected',
    sentiment: 'POSITIVE',
    confidence: 0.85,
};

// ── createMemory ──────────────────────────────────────────────────────────────

describe('createMemory', () => {
    it('sets the domain correctly', () => {
        const m = createMemory('stripe.com');
        expect(m.domain).toBe('stripe.com');
    });

    it('trims whitespace from domain', () => {
        const m = createMemory('  stripe.com  ');
        expect(m.domain).toBe('stripe.com');
    });

    it('initializes rawSignals as empty array', () => {
        expect(createMemory('x.com').rawSignals).toEqual([]);
    });

    it('initializes structuredSignals as empty array', () => {
        expect(createMemory('x.com').structuredSignals).toEqual([]);
    });

    it('initializes agentOutputs as empty object', () => {
        expect(createMemory('x.com').agentOutputs).toEqual({});
    });

    it('initializes debateLog as empty array', () => {
        expect(createMemory('x.com').debateLog).toEqual([]);
    });

    it('pre-populates scoreBreakdown with zero values and correct weights', () => {
        const m = createMemory('x.com');
        expect(m.scoreBreakdown?.finalScore).toBe(0);
        expect(m.scoreBreakdown?.weights.technical).toBe(0.40);
        expect(m.scoreBreakdown?.weights.financial).toBe(0.35);
        expect(m.scoreBreakdown?.weights.market).toBe(0.25);
    });

    it('pre-populates confidenceMetrics with zero values', () => {
        const m = createMemory('x.com');
        expect(m.confidenceMetrics?.overall).toBe(0);
        expect(m.confidenceMetrics?.breakdown.dataCompleteness).toBe(0);
    });

    it('initializes executionMeta with a numeric startedAt and retries: 0', () => {
        const before = Date.now();
        const m = createMemory('x.com');
        const after = Date.now();
        expect(m.executionMeta?.startedAt).toBeGreaterThanOrEqual(before);
        expect(m.executionMeta?.startedAt).toBeLessThanOrEqual(after);
        expect(m.executionMeta?.retries).toBe(0);
        expect(m.executionMeta?.completedAt).toBeUndefined();
    });

    it('throws if domain is an empty string', () => {
        expect(() => createMemory('')).toThrow();
    });

    it('throws if domain is whitespace only', () => {
        expect(() => createMemory('   ')).toThrow();
    });

    it('produces independent instances (no shared references)', () => {
        const a = createMemory('a.com');
        const b = createMemory('b.com');
        a.rawSignals.push(SAMPLE_SIGNAL);
        expect(b.rawSignals).toHaveLength(0);
    });
});

// ── cloneMemory ───────────────────────────────────────────────────────────────

describe('cloneMemory', () => {
    it('returns a structurally equal but distinct object', () => {
        const m = createMemory('stripe.com');
        const c = cloneMemory(m);
        expect(c).not.toBe(m);
        expect(c).toEqual(m);
    });

    it('nested arrays are independent', () => {
        const m = createMemory('x.com');
        const c = cloneMemory(m);
        c.rawSignals.push(SAMPLE_SIGNAL);
        expect(m.rawSignals).toHaveLength(0);
    });

    it('nested objects are independent', () => {
        const m = createMemory('x.com');
        const c = cloneMemory(m);
        c.agentOutputs['test'] = SAMPLE_OUTPUT;
        expect(m.agentOutputs['test']).toBeUndefined();
    });
});

// ── validateMemory ────────────────────────────────────────────────────────────

describe('validateMemory', () => {
    it('returns true for a valid memory object', () => {
        expect(validateMemory(createMemory('x.com'))).toBe(true);
    });

    it('returns false for null', () => {
        expect(validateMemory(null)).toBe(false);
    });

    it('returns false for a string', () => {
        expect(validateMemory('string')).toBe(false);
    });

    it('returns false if domain is missing', () => {
        const m = createMemory('x.com') as Record<string, unknown>;
        delete m['domain'];
        expect(validateMemory(m)).toBe(false);
    });

    it('returns false if rawSignals is not an array', () => {
        const m = { ...createMemory('x.com'), rawSignals: 'bad' };
        expect(validateMemory(m)).toBe(false);
    });

    it('returns false if agentOutputs is an array (not a plain object)', () => {
        const m = { ...createMemory('x.com'), agentOutputs: [] };
        expect(validateMemory(m)).toBe(false);
    });

    it('returns false if executionMeta.startedAt is missing', () => {
        const m = createMemory('x.com') as Record<string, unknown>;
        m['executionMeta'] = { retries: 0 }; // missing startedAt
        expect(validateMemory(m)).toBe(false);
    });

    it('returns false for an empty object', () => {
        expect(validateMemory({})).toBe(false);
    });
});

// ── updateMemorySection ───────────────────────────────────────────────────────

describe('updateMemorySection', () => {
    it('updates the specified key', () => {
        const m = createMemory('a.com');
        const updated = updateMemorySection(m, 'domain', 'b.com');
        expect(updated.domain).toBe('b.com');
    });

    it('does not mutate the original', () => {
        const m = createMemory('a.com');
        const frozen = JSON.stringify(m);
        updateMemorySection(m, 'domain', 'b.com');
        expect(JSON.stringify(m)).toBe(frozen);
    });

    it('all other keys are preserved', () => {
        const m = addRawSignals(createMemory('a.com'), [SAMPLE_SIGNAL]);
        const updated = updateMemorySection(m, 'domain', 'b.com');
        expect(updated.rawSignals).toHaveLength(1);
    });
});

// ── addRawSignals ─────────────────────────────────────────────────────────────

describe('addRawSignals', () => {
    it('appends signals', () => {
        const m = createMemory('x.com');
        const updated = addRawSignals(m, [SAMPLE_SIGNAL]);
        expect(updated.rawSignals).toHaveLength(1);
        expect(updated.rawSignals[0].id).toBe('sig-001');
    });

    it('appends without replacing existing signals', () => {
        let m = createMemory('x.com');
        m = addRawSignals(m, [SAMPLE_SIGNAL]);
        m = addRawSignals(m, [{ ...SAMPLE_SIGNAL, id: 'sig-002' }]);
        expect(m.rawSignals).toHaveLength(2);
    });

    it('returns the same reference on empty input (no-op)', () => {
        const m = createMemory('x.com');
        const r = addRawSignals(m, []);
        expect(r).toBe(m);
    });

    it('does not mutate the original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        addRawSignals(m, [SAMPLE_SIGNAL]);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── addStructuredSignals ──────────────────────────────────────────────────────

describe('addStructuredSignals', () => {
    it('appends structured signals', () => {
        const m = createMemory('x.com');
        const updated = addStructuredSignals(m, [SAMPLE_STRUCTURED]);
        expect(updated.structuredSignals).toHaveLength(1);
    });

    it('returns same reference on empty input (no-op)', () => {
        const m = createMemory('x.com');
        expect(addStructuredSignals(m, [])).toBe(m);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        addStructuredSignals(m, [SAMPLE_STRUCTURED]);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── setAgentOutput ────────────────────────────────────────────────────────────

describe('setAgentOutput', () => {
    it('writes the output under the given key', () => {
        const m = createMemory('x.com');
        const updated = setAgentOutput(m, 'technical', SAMPLE_OUTPUT);
        expect(updated.agentOutputs['technical']).toBeDefined();
        expect(updated.agentOutputs['technical'].agentName).toBe('TechnicalAgent');
    });

    it('overwrites an existing key', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'technical', SAMPLE_OUTPUT);
        m = setAgentOutput(m, 'technical', { agentName: 'TechnicalAgent', score: 99, insights: [] });
        expect(m.agentOutputs['technical'].score).toBe(99);
    });

    it('preserves other agent outputs', () => {
        let m = createMemory('x.com');
        m = setAgentOutput(m, 'research', { agentName: 'ResearchAgent', insights: [] });
        m = setAgentOutput(m, 'technical', SAMPLE_OUTPUT);
        expect(m.agentOutputs['research']).toBeDefined();
    });

    it('throws on empty agentKey', () => {
        expect(() => setAgentOutput(createMemory('x.com'), '', SAMPLE_OUTPUT)).toThrow();
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        setAgentOutput(m, 'technical', SAMPLE_OUTPUT);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── appendDebateMessages ──────────────────────────────────────────────────────

describe('appendDebateMessages', () => {
    it('appends messages to debateLog', () => {
        const m = createMemory('x.com');
        const updated = appendDebateMessages(m, [SAMPLE_DEBATE_MSG]);
        expect(updated.debateLog).toHaveLength(1);
        expect(updated.debateLog[0].agent).toBe('TechnicalAgent');
    });

    it('returns same reference on empty input (no-op)', () => {
        const m = createMemory('x.com');
        expect(appendDebateMessages(m, [])).toBe(m);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        appendDebateMessages(m, [SAMPLE_DEBATE_MSG]);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── updateScoreBreakdown ──────────────────────────────────────────────────────

describe('updateScoreBreakdown', () => {
    it('sets scoreBreakdown correctly', () => {
        const m = createMemory('x.com');
        const updated = updateScoreBreakdown(m, SAMPLE_SCORE);
        expect(updated.scoreBreakdown?.finalScore).toBe(62.5);
        expect(updated.scoreBreakdown?.technical).toBe(70);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        updateScoreBreakdown(m, SAMPLE_SCORE);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── updateConfidence ──────────────────────────────────────────────────────────

describe('updateConfidence', () => {
    it('sets confidenceMetrics correctly', () => {
        const m = createMemory('x.com');
        const updated = updateConfidence(m, SAMPLE_CONFIDENCE);
        expect(updated.confidenceMetrics?.overall).toBe(0.78);
        expect(updated.confidenceMetrics?.breakdown.agentAgreement).toBe(75);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        updateConfidence(m, SAMPLE_CONFIDENCE);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── Execution Meta ────────────────────────────────────────────────────────────

describe('markExecutionComplete', () => {
    it('sets completedAt to a number', () => {
        const m = createMemory('x.com');
        const before = Date.now();
        const updated = markExecutionComplete(m);
        const after = Date.now();
        expect(typeof updated.executionMeta?.completedAt).toBe('number');
        expect(updated.executionMeta!.completedAt).toBeGreaterThanOrEqual(before);
        expect(updated.executionMeta!.completedAt).toBeLessThanOrEqual(after);
    });

    it('preserves startedAt and retries', () => {
        const m = createMemory('x.com');
        const updated = markExecutionComplete(m);
        expect(updated.executionMeta?.startedAt).toBe(m.executionMeta?.startedAt);
        expect(updated.executionMeta?.retries).toBe(0);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        markExecutionComplete(m);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

describe('incrementRetry', () => {
    it('increments retries by 1', () => {
        const m = createMemory('x.com');
        const updated = incrementRetry(m);
        expect(updated.executionMeta?.retries).toBe(1);
    });

    it('incrementing multiple times accumulates', () => {
        let m = createMemory('x.com');
        m = incrementRetry(m);
        m = incrementRetry(m);
        m = incrementRetry(m);
        expect(m.executionMeta?.retries).toBe(3);
    });

    it('does not mutate original', () => {
        const m = createMemory('x.com');
        const frozen = JSON.stringify(m);
        incrementRetry(m);
        expect(JSON.stringify(m)).toBe(frozen);
    });
});

// ── Computed Selectors ────────────────────────────────────────────────────────

describe('isComplete', () => {
    it('returns false for a fresh memory', () => {
        expect(isComplete(createMemory('x.com'))).toBe(false);
    });

    it('returns true after markExecutionComplete', () => {
        expect(isComplete(markExecutionComplete(createMemory('x.com')))).toBe(true);
    });
});

describe('elapsedMs', () => {
    it('returns a non-negative number', () => {
        expect(elapsedMs(createMemory('x.com'))).toBeGreaterThanOrEqual(0);
    });

    it('returns a fixed value for completed memory', () => {
        const m = createMemory('x.com');
        const done = markExecutionComplete(m);
        const elapsed = elapsedMs(done);
        // elapsed should be very small but non-negative
        expect(elapsed).toBeGreaterThanOrEqual(0);
        expect(elapsed).toBeLessThan(5000); // sanity guard
    });
});

describe('getFinalScore', () => {
    it('returns null if no meaningful score has been set', () => {
        expect(getFinalScore(createMemory('x.com'))).toBeNull();
    });

    it('returns the finalScore once set', () => {
        const m = updateScoreBreakdown(createMemory('x.com'), SAMPLE_SCORE);
        expect(getFinalScore(m)).toBe(62.5);
    });
});

describe('signalCount', () => {
    it('returns 0 for fresh memory', () => {
        expect(signalCount(createMemory('x.com'))).toBe(0);
    });

    it('returns correct count after adding signals', () => {
        const m = addRawSignals(createMemory('x.com'), [SAMPLE_SIGNAL, { ...SAMPLE_SIGNAL, id: 'sig-002' }]);
        expect(signalCount(m)).toBe(2);
    });
});

describe('toReadonly', () => {
    it('returns the same reference (zero-cost cast)', () => {
        const m = createMemory('x.com');
        expect(toReadonly(m)).toBe(m);
    });
});
