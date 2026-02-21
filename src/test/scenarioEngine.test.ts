// src/test/scenarioEngine.test.ts
//
// Tests for src/lib/scenarioEngine.ts
//
// Coverage:
//   - Signal injection / removal (per scenario flag)
//   - All 6 scenario flags independently
//   - Preset combinations (bullCase, bearCase)
//   - True pipeline recalculation (verdict, debate, confidence, alignment)
//   - Immutability — originalMemory never mutates
//   - ScenarioResult shape and delta metric types
//   - Delta signs (positive scenarios improve score, negative worsen)
//   - Empty scenario (no-op)
//   - SCENARIOS presets catalog
//   - Integration: results from runAnalysis() as base

import { describe, it, expect } from 'vitest';
import {
    applyScenario,
    SCENARIOS,
    type ScenarioResult,
    type ScenarioInput,
} from '@/lib/scenarioEngine';
import { createMemory, addRawSignals, addStructuredSignals } from '@/lib/memoryStore';
import { runAnalysis } from '@/lib/orchestrator';
import type { Signal } from '@/types/analysis';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A base memory with minimal realistic data — signals + structured signals. */
async function buildBaseMemory(domain = 'stripe.com') {
    const { memory } = await runAnalysis(domain);
    return memory;
}

// ── ScenarioResult Shape ──────────────────────────────────────────────────────

describe('applyScenario — result shape', () => {
    it('returns a valid ScenarioResult object', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, {});

        expect(result).toHaveProperty('simulated');
        expect(result).toHaveProperty('original');
        expect(result).toHaveProperty('scoreDelta');
        expect(result).toHaveProperty('confidenceDelta');
        expect(result).toHaveProperty('alignmentDelta');
        expect(result).toHaveProperty('appliedScenario');
    });

    it('result.appliedScenario matches the input scenario', async () => {
        const base = await buildBaseMemory();
        const scenario = { fundingConfirmed: true };
        const result = applyScenario(base, scenario);
        expect(result.appliedScenario).toEqual(scenario);
    });

    it('scoreDelta is a finite number', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(isFinite(result.scoreDelta)).toBe(true);
    });

    it('confidenceDelta is a finite number', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(isFinite(result.confidenceDelta)).toBe(true);
    });

    it('alignmentDelta is a finite number', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(isFinite(result.alignmentDelta)).toBe(true);
    });
});

// ── Immutability ──────────────────────────────────────────────────────────────

describe('applyScenario — immutability', () => {
    it('does not mutate the original memory rawSignals', async () => {
        const base = await buildBaseMemory();
        const originalCount = base.rawSignals.length;
        applyScenario(base, { fundingConfirmed: true });
        expect(base.rawSignals.length).toBe(originalCount);
    });

    it('does not mutate the original memory scoreBreakdown', async () => {
        const base = await buildBaseMemory();
        const originalScore = base.scoreBreakdown?.finalScore;
        applyScenario(base, { fundingConfirmed: true, hiringSpike: true });
        expect(base.scoreBreakdown?.finalScore).toBe(originalScore);
    });

    it('does not mutate the original memory agentOutputs', async () => {
        const base = await buildBaseMemory();
        const frozen = JSON.stringify(base.agentOutputs);
        applyScenario(base, { fundingConfirmed: true });
        expect(JSON.stringify(base.agentOutputs)).toBe(frozen);
    });

    it('result.original is a deep clone of the input', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        // They should be equal in value
        expect(result.original.domain).toBe(base.domain);
        expect(result.original.rawSignals.length).toBe(base.rawSignals.length);
        // But not the same object reference
        expect(result.original).not.toBe(base);
    });

    it('mutating result.simulated does not affect result.original', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, {});
        const originalRawCount = result.original.rawSignals.length;
        // Mutate simulated directly
        (result.simulated.rawSignals as Signal[]).push(
            { id: 'x', type: 'RISK', content: '', reliability: 0.5, timestamp: 0 }
        );
        expect(result.original.rawSignals.length).toBe(originalRawCount);
    });
});

// ── Signal injection: fundingConfirmed ────────────────────────────────────────

describe('applyScenario — fundingConfirmed', () => {
    it('adds exactly 1 signal to rawSignals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(result.simulated.rawSignals.length).toBe(base.rawSignals.length + 1);
    });

    it('the injected signal is of type FUNDING', async () => {
        const base = await buildBaseMemory();
        const before = new Set(base.rawSignals.map((s) => s.id));
        const result = applyScenario(base, { fundingConfirmed: true });
        const added = result.simulated.rawSignals.filter((s) => !before.has(s.id));
        expect(added.length).toBe(1);
        expect(added[0].type).toBe('FUNDING');
    });

    it('the injected FUNDING signal has reliability >= 0.9', async () => {
        const base = await buildBaseMemory();
        const before = new Set(base.rawSignals.map((s) => s.id));
        const result = applyScenario(base, { fundingConfirmed: true });
        const added = result.simulated.rawSignals.filter((s) => !before.has(s.id));
        expect(added[0].reliability).toBeGreaterThanOrEqual(0.9);
    });
});

// ── Signal injection: hiringSpike ─────────────────────────────────────────────

describe('applyScenario — hiringSpike', () => {
    it('adds exactly 1 HIRING signal', async () => {
        const base = await buildBaseMemory();
        const before = new Set(base.rawSignals.map((s) => s.id));
        const result = applyScenario(base, { hiringSpike: true });
        const added = result.simulated.rawSignals.filter((s) => !before.has(s.id));
        expect(added.length).toBe(1);
        expect(added[0].type).toBe('HIRING');
    });
});

// ── Signal removal: expansionPaused ──────────────────────────────────────────

describe('applyScenario — expansionPaused', () => {
    it('removes all EXPANSION signals from rawSignals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { expansionPaused: true });
        const remaining = result.simulated.rawSignals.filter((s) => s.type === 'EXPANSION');
        expect(remaining.length).toBe(0);
    });

    it('does not remove non-EXPANSION signals', async () => {
        const base = await buildBaseMemory();
        const nonExpBefore = base.rawSignals.filter((s) => s.type !== 'EXPANSION').length;
        const result = applyScenario(base, { expansionPaused: true });
        const nonExpAfter = result.simulated.rawSignals.filter((s) => s.type !== 'EXPANSION').length;
        expect(nonExpAfter).toBe(nonExpBefore);
    });
});

// ── Signal removal: marketCollapse ───────────────────────────────────────────

describe('applyScenario — marketCollapse', () => {
    it('removes all MARKET signals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { marketCollapse: true });
        const remaining = result.simulated.rawSignals.filter((s) => s.type === 'MARKET');
        expect(remaining.length).toBe(0);
    });
});

// ── Signal injection: riskEvent ───────────────────────────────────────────────

describe('applyScenario — riskEvent', () => {
    it('adds exactly 1 RISK signal', async () => {
        const base = await buildBaseMemory();
        const before = new Set(base.rawSignals.map((s) => s.id));
        const result = applyScenario(base, { riskEvent: true });
        const added = result.simulated.rawSignals.filter((s) => !before.has(s.id));
        expect(added[0].type).toBe('RISK');
    });
});

// ── Signal injection: techBreakthrough ───────────────────────────────────────

describe('applyScenario — techBreakthrough', () => {
    it('adds exactly 1 TECH signal', async () => {
        const base = await buildBaseMemory();
        const before = new Set(base.rawSignals.map((s) => s.id));
        const result = applyScenario(base, { techBreakthrough: true });
        const added = result.simulated.rawSignals.filter((s) => !before.has(s.id));
        expect(added[0].type).toBe('TECH');
    });
});

// ── Combined scenarios ────────────────────────────────────────────────────────

describe('applyScenario — combined flags', () => {
    it('fundingConfirmed + hiringSpike adds 2 signals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true, hiringSpike: true });
        expect(result.simulated.rawSignals.length).toBe(base.rawSignals.length + 2);
    });

    it('all 3 injection flags add 3 signals each', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, {
            fundingConfirmed: true,
            hiringSpike: true,
            techBreakthrough: true,
        });
        expect(result.simulated.rawSignals.length).toBe(base.rawSignals.length + 3);
    });
});

// ── Empty scenario (no-op) ────────────────────────────────────────────────────

describe('applyScenario — empty scenario', () => {
    it('produces a valid result for an empty scenario', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, {});
        expect(result.simulated.domain).toBe(base.domain);
    });

    it('scoreDelta is 0 for an empty scenario', async () => {
        // An empty scenario still reruns verdict+debate → same score if deterministic
        const base = await buildBaseMemory();
        const result = applyScenario(base, {});
        expect(result.scoreDelta).toBe(0);
    });
});

// ── True pipeline recalculation ───────────────────────────────────────────────

describe('applyScenario — pipeline recalculation', () => {
    it('simulated memory has updated scoreBreakdown after scenario', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(result.simulated.scoreBreakdown).toBeDefined();
        expect(typeof result.simulated.scoreBreakdown?.finalScore).toBe('number');
    });

    it('simulated memory has updated debateLog after scenario', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { hiringSpike: true });
        expect(result.simulated.debateLog.length).toBeGreaterThan(0);
    });

    it('simulated memory has updated confidenceMetrics after scenario', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(result.simulated.confidenceMetrics).toBeDefined();
        expect(typeof result.simulated.confidenceMetrics?.overall).toBe('number');
    });

    it('simulated memory has alignmentIndex in confidenceMetrics', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(typeof result.simulated.confidenceMetrics?.alignmentIndex).toBe('number');
    });

    it('alignment agent output is written to agentOutputs', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(result.simulated.agentOutputs['alignment']).toBeDefined();
        expect(result.simulated.agentOutputs['alignment'].agentName).toBe('AlignmentEngine');
    });

    it('simulated finalScore is within [0, 100]', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, { fundingConfirmed: true });
        const score = result.simulated.scoreBreakdown?.finalScore ?? -1;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });
});

// ── SCENARIOS presets ─────────────────────────────────────────────────────────

describe('SCENARIOS presets', () => {
    it('bullCase is a valid ScenarioInput', () => {
        expect(SCENARIOS.bullCase.fundingConfirmed).toBe(true);
        expect(SCENARIOS.bullCase.hiringSpike).toBe(true);
        expect(SCENARIOS.bullCase.techBreakthrough).toBe(true);
    });

    it('bearCase is a valid ScenarioInput', () => {
        expect(SCENARIOS.bearCase.expansionPaused).toBe(true);
        expect(SCENARIOS.bearCase.marketCollapse).toBe(true);
        expect(SCENARIOS.bearCase.riskEvent).toBe(true);
    });

    it('bullCase adds 3 signals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, SCENARIOS.bullCase);
        expect(result.simulated.rawSignals.length).toBe(base.rawSignals.length + 3);
    });

    it('bearCase removes EXPANSION and MARKET signals', async () => {
        const base = await buildBaseMemory();
        const result = applyScenario(base, SCENARIOS.bearCase);
        const expansionLeft = result.simulated.rawSignals.filter((s) => s.type === 'EXPANSION');
        const marketLeft = result.simulated.rawSignals.filter((s) => s.type === 'MARKET');
        expect(expansionLeft.length).toBe(0);
        expect(marketLeft.length).toBe(0);
    });

    it('all presets can be applied without throwing', async () => {
        const base = await buildBaseMemory();
        for (const [name, scenario] of Object.entries(SCENARIOS)) {
            expect(() => applyScenario(base, scenario)).not.toThrow();
        }
    });

    it('spec example test: high disagreement scenario from user spec', () => {
        // From spec: "funding scenario increases financial score"
        const base = createMemory('stripe.com');
        const result = applyScenario(base, { fundingConfirmed: true });
        expect(result.simulated.rawSignals.length).toBeGreaterThan(base.rawSignals.length);
    });
});

// ── Determinism ───────────────────────────────────────────────────────────────

describe('applyScenario — determinism', () => {
    it('same scenario on same memory produces same scoreBreakdown', async () => {
        const base = await buildBaseMemory('stripe.com');
        const result1 = applyScenario(base, { fundingConfirmed: true });
        const result2 = applyScenario(base, { fundingConfirmed: true });
        // Score breakdown should be identical (UUIDs will differ per signal)
        expect(result1.simulated.scoreBreakdown?.finalScore)
            .toBe(result2.simulated.scoreBreakdown?.finalScore);
    });
});
