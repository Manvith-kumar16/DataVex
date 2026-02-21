// src/lib/scenarioEngine.ts
//
// Phase 6: Scenario Simulation Engine — Strategic Decision Modeling
//
// When a scenario is applied, the engine:
//   1. Clones the original memory (never mutates it)
//   2. Modifies the signal layer per the scenario definition
//   3. Re-runs scoring (verdictAgent)
//   4. Re-runs debate (debateAgent)
//   5. Recomputes confidence (computeConfidence)
//   6. Recomputes alignment index (calculateAlignmentIndex)
//   7. Returns a ScenarioResult containing both the new memory and a snapshot delta
//
// Design Properties:
//   ✅ Fully immutable — originalMemory is never touched
//   ✅ True recalculation — not cosmetic score patching
//   ✅ Deterministic — same scenario + memory → same result
//   ✅ Extensible — add new ScenarioInput fields without changing core logic
//   ✅ No UI coupling — returns data, never renders
//   ✅ Snapshot delta — returns original for before/after comparison
//   ✅ Named scenario catalog — built-in presets for common strategic events

import type { SharedMemory, Signal } from '@/types/analysis';
import {
    cloneMemory,
    updateConfidence,
} from './memoryStore';
import { verdictAgent } from './agents/verdictAgent';
import { debateAgent } from './agents/debateAgent';
import { computeConfidence } from './scoring/confidenceEngine';
import { calculateAlignmentIndex } from './scoring/alignmentIndex';

// ─── Scenario Input ────────────────────────────────────────────────────────────

/**
 * Declarative scenario specification.
 * Each field represents a strategic event that may alter signal data.
 * Fields can be combined — all applicable modifications are applied in order.
 *
 * Extensible: add new fields here and handle them in `buildScenarioModifiers`.
 */
export interface ScenarioInput {
    /** Inject a high-reliability FUNDING signal (new round confirmed). */
    fundingConfirmed?: boolean;
    /** Inject a high-reliability HIRING signal (job posting surge). */
    hiringSpike?: boolean;
    /** Remove all EXPANSION signals (expansion plans paused/cancelled). */
    expansionPaused?: boolean;
    /** Inject a RISK signal (negative market or regulatory risk surfaced). */
    riskEvent?: boolean;
    /** Remove all MARKET signals (market data invalid or withdrawn). */
    marketCollapse?: boolean;
    /** Inject a TECH signal (major product launch or patent filed). */
    techBreakthrough?: boolean;
}

// ─── Scenario Result Envelope ─────────────────────────────────────────────────

/**
 * The full result of running a scenario simulation.
 * Provides both the simulated state and the original for delta comparison.
 */
export interface ScenarioResult {
    /** The new memory state after scenario signals were applied and pipeline re-ran. */
    simulated: SharedMemory;
    /**
     * Deep clone of the original memory at the time `applyScenario` was called.
     * Use this for before/after comparison — it is guaranteed not to change.
     */
    original: SharedMemory;
    /**
     * Computed delta between original and simulated final scores.
     * Positive = scenario improved the score; negative = worsened.
     */
    scoreDelta: number;
    /**
     * Computed delta between original and simulated confidence.
     * Positive = confidence improved; negative = worsened.
     */
    confidenceDelta: number;
    /**
     * Computed delta between original and simulated alignment index.
     */
    alignmentDelta: number;
    /**
     * Which scenario was applied. For logging / UI display.
     */
    appliedScenario: ScenarioInput;
}

// ─── Signal Factories ─────────────────────────────────────────────────────────

/**
 * Pure helpers for building scenario-specific Signal objects.
 * Each factory returns a new Signal without touching any memory.
 */
const SignalFactory = {
    funding(): Signal {
        return {
            id: crypto.randomUUID(),
            type: 'FUNDING',
            content: 'Scenario: Confirmed new funding round.',
            reliability: 0.95,
            timestamp: Date.now(),
        };
    },
    hiring(): Signal {
        return {
            id: crypto.randomUUID(),
            type: 'HIRING',
            content: 'Scenario: Significant hiring velocity spike detected.',
            reliability: 0.90,
            timestamp: Date.now(),
        };
    },
    riskEvent(): Signal {
        return {
            id: crypto.randomUUID(),
            type: 'RISK',
            content: 'Scenario: Risk event surfaced — regulatory or market threat.',
            reliability: 0.85,
            timestamp: Date.now(),
        };
    },
    techBreakthrough(): Signal {
        return {
            id: crypto.randomUUID(),
            type: 'TECH',
            content: 'Scenario: Major tech breakthrough — product launch or patent filed.',
            reliability: 0.90,
            timestamp: Date.now(),
        };
    },
};

// ─── Pure Signal Modifiers ────────────────────────────────────────────────────

/**
 * Inject one or more new signals into memory without mutating it.
 * Returns a new SharedMemory with the signals appended to rawSignals.
 */
function injectSignals(
    memory: SharedMemory,
    ...signals: Signal[]
): SharedMemory {
    return {
        ...cloneMemory(memory),
        rawSignals: [...memory.rawSignals, ...signals],
    };
}

/**
 * Remove all signals of a given type from memory without mutating it.
 * Returns a new SharedMemory with the filtered rawSignals.
 */
function removeSignalsByType(
    memory: SharedMemory,
    type: Signal['type'],
): SharedMemory {
    return {
        ...cloneMemory(memory),
        rawSignals: memory.rawSignals.filter((s) => s.type !== type),
    };
}

// ─── Scenario Modifier Registry ───────────────────────────────────────────────

type MemoryModifier = (memory: SharedMemory) => SharedMemory;

/**
 * Build an ordered list of signal-layer modifiers from a ScenarioInput.
 * This is the only place where ScenarioInput fields are interpreted.
 * Adding a new scenario = add one entry here + one field to ScenarioInput.
 */
function buildModifiers(scenario: ScenarioInput): MemoryModifier[] {
    const modifiers: MemoryModifier[] = [];

    if (scenario.fundingConfirmed) {
        modifiers.push((m) => injectSignals(m, SignalFactory.funding()));
    }
    if (scenario.hiringSpike) {
        modifiers.push((m) => injectSignals(m, SignalFactory.hiring()));
    }
    if (scenario.riskEvent) {
        modifiers.push((m) => injectSignals(m, SignalFactory.riskEvent()));
    }
    if (scenario.techBreakthrough) {
        modifiers.push((m) => injectSignals(m, SignalFactory.techBreakthrough()));
    }
    if (scenario.expansionPaused) {
        modifiers.push((m) => removeSignalsByType(m, 'EXPANSION'));
    }
    if (scenario.marketCollapse) {
        modifiers.push((m) => removeSignalsByType(m, 'MARKET'));
    }

    return modifiers;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFinalScore(memory: SharedMemory): number {
    return memory.scoreBreakdown?.finalScore ?? 0;
}

function getOverallConfidence(memory: SharedMemory): number {
    return memory.confidenceMetrics?.overall ?? 0;
}

function getAlignmentIndex(memory: SharedMemory): number {
    return memory.confidenceMetrics?.alignmentIndex ?? 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Apply a scenario to a SharedMemory and return a full ScenarioResult.
 *
 * Pipeline:
 *   1. Clone original memory (snapshot)
 *   2. Apply signal-layer modifiers in order
 *   3. Re-run verdict scoring
 *   4. Re-run debate
 *   5. Recompute confidence + alignment
 *   6. Return ScenarioResult with delta metrics
 *
 * @param originalMemory - The post-pipeline memory to simulate against
 * @param scenario       - The scenario to apply
 * @returns ScenarioResult containing both states and delta metrics
 *
 * @example
 * ```typescript
 * const result = applyScenario(memory, { fundingConfirmed: true, hiringSpike: true });
 * console.log(result.scoreDelta);        // e.g. +12.5
 * console.log(result.confidenceDelta);   // e.g. +0.04
 * ```
 */
export function applyScenario(
    originalMemory: SharedMemory,
    scenario: ScenarioInput,
): ScenarioResult {
    // ── Step 1: Preserve original (deep clone for delta comparison) ──
    const original = cloneMemory(originalMemory);

    // ── Step 2: Apply signal-layer modifiers ──
    let memory = cloneMemory(originalMemory);
    for (const modifier of buildModifiers(scenario)) {
        memory = modifier(memory);
    }

    // ── Step 3: Re-run verdict scoring ──
    memory = verdictAgent(memory);

    // ── Step 4: Re-run debate ──
    memory = debateAgent(memory);

    // ── Step 5: Recompute confidence + alignment ──
    const confidence = computeConfidence(memory);
    const alignment = calculateAlignmentIndex(memory);

    memory = updateConfidence(memory, {
        ...confidence,
        alignmentIndex: alignment.alignmentIndex,
        alignmentRisk: alignment.riskIndicator,
    });

    // Attach alignment metadata to agentOutputs for introspection
    memory = {
        ...memory,
        agentOutputs: {
            ...memory.agentOutputs,
            alignment: {
                agentName: 'AlignmentEngine',
                score: Number((alignment.alignmentIndex * 100).toFixed(2)),
                insights: [
                    `Alignment Index: ${alignment.alignmentIndex}`,
                    `Risk Level: ${alignment.riskIndicator}`,
                    `Scoring Agent Count: ${alignment.scoringAgentCount}`,
                ],
                metadata: alignment as Record<string, unknown>,
            },
        },
    };

    // ── Step 6: Build result with delta metrics ──
    const scoreDelta = getFinalScore(memory) - getFinalScore(original);
    const confidenceDelta = getOverallConfidence(memory) - getOverallConfidence(original);
    const alignmentDelta = getAlignmentIndex(memory) - getAlignmentIndex(original);

    return {
        simulated: memory,
        original,
        scoreDelta: Number(scoreDelta.toFixed(4)),
        confidenceDelta: Number(confidenceDelta.toFixed(4)),
        alignmentDelta: Number(alignmentDelta.toFixed(4)),
        appliedScenario: scenario,
    };
}

// ─── Named Scenario Presets ───────────────────────────────────────────────────

/**
 * Built-in scenario presets for common strategic events.
 * These are just pre-defined ScenarioInput objects — no special logic.
 *
 * @example
 * ```typescript
 * const result = applyScenario(memory, SCENARIOS.bullCase);
 * ```
 */
export const SCENARIOS = {
    /** Maximum positive signals — use for bull-case projection. */
    bullCase: {
        fundingConfirmed: true,
        hiringSpike: true,
        techBreakthrough: true,
    } satisfies ScenarioInput,

    /** Maximum negative signals — use for bear-case / stress test. */
    bearCase: {
        expansionPaused: true,
        marketCollapse: true,
        riskEvent: true,
    } satisfies ScenarioInput,

    /** Funding round closes — isolated financial upside. */
    fundingRound: {
        fundingConfirmed: true,
    } satisfies ScenarioInput,

    /** Hiring freeze or layoffs indirectly mapped to expansion pause. */
    hiringFreeze: {
        expansionPaused: true,
    } satisfies ScenarioInput,
} as const;
