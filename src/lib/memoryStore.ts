// src/lib/memoryStore.ts
//
// Phase 2: Shared Memory Store — Production-Grade Implementation
//
// This module is the authoritative layer for creating, validating, cloning,
// and atomically updating SharedMemory objects. No agent or orchestrator
// should ever mutate a SharedMemory reference directly — all mutations must
// go through the functions here.
//
// Design principles enforced by this module:
//   ✅ Immutable-safe: every function clones before mutating
//   ✅ Runtime validations: validateMemory() acts as a type-guard
//   ✅ Strongly typed: all parameters and return types are explicit
//   ✅ Side-effect free: no I/O, no global state
//   ✅ Serializable: all state is structuredClone-compatible
//   ✅ Orchestrator-ready: memory = fn(memory) functional update pattern

import type {
    SharedMemory,
    Signal,
    StructuredSignal,
    AgentOutput,
    ScoreBreakdown,
    DebateMessage,
    MemoryConfidenceData,
    ExecutionMeta,
} from '@/types/analysis';

// ─── Internal Utility Types ────────────────────────────────────────────────────

/**
 * Recursively marks every property as readonly.
 * Used internally to signal read-only memory views (not enforced at runtime).
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/** Read-only view of SharedMemory — safe to pass to inspection utilities. */
export type ReadonlyMemory = DeepReadonly<SharedMemory>;

// ─── Default Initialization Values ────────────────────────────────────────────

const DEFAULT_SCORE_BREAKDOWN: ScoreBreakdown = {
    technical: 0,
    financial: 0,
    market: 0,
    finalScore: 0,
    weights: {
        technical: 0.40,
        financial: 0.35,
        market: 0.25,
    },
};

const DEFAULT_CONFIDENCE: MemoryConfidenceData = {
    overall: 0,
    breakdown: {
        dataCompleteness: 0,
        agentAgreement: 0,
        evidenceReliability: 0,
    },
};

// ─── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a fully initialized, empty SharedMemory for a given domain.
 *
 * This is the ONLY sanctioned way to create a SharedMemory from scratch.
 * All fields are pre-initialized so downstream code never has to null-check
 * optional fields that should logically always be present.
 *
 * @throws {Error} if domain is empty or not a string
 *
 * @example
 * const memory = createMemory('stripe.com');
 * // → { domain: 'stripe.com', rawSignals: [], ..., executionMeta: { startedAt: ..., retries: 0 } }
 */
export function createMemory(domain: string): SharedMemory {
    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
        throw new Error(
            `createMemory(): invalid domain "${String(domain)}" — must be a non-empty string`,
        );
    }

    const executionMeta: ExecutionMeta = {
        startedAt: Date.now(),
        retries: 0,
    };

    return {
        domain: domain.trim(),
        rawSignals: [],
        structuredSignals: [],
        agentOutputs: {},
        scoreBreakdown: structuredClone(DEFAULT_SCORE_BREAKDOWN),
        debateLog: [],
        confidenceMetrics: structuredClone(DEFAULT_CONFIDENCE),
        executionMeta,
    };
}

// ─── Clone ─────────────────────────────────────────────────────────────────────

/**
 * Produce a deep, independent clone of a SharedMemory object.
 *
 * Uses the platform-native `structuredClone` which handles nested objects,
 * arrays, and primitives correctly without any library dependency.
 *
 * @example
 * const snapshot = cloneMemory(memory);  // safe to diverge from here
 */
export function cloneMemory(memory: SharedMemory): SharedMemory {
    return structuredClone(memory);
}

// ─── Runtime Validation ────────────────────────────────────────────────────────

/**
 * Type-guard that validates the shape of a deserialized SharedMemory object.
 *
 * Use this when loading memory from storage, network, or any untrusted source.
 * Intentionally does NOT validate nested array element shapes for performance —
 * use field-level validators for stricter checks.
 *
 * @returns `true` if `memory` satisfies the SharedMemory contract
 */
export function validateMemory(memory: unknown): memory is SharedMemory {
    if (!memory || typeof memory !== 'object') return false;

    const m = memory as Record<string, unknown>;

    if (typeof m['domain'] !== 'string' || m['domain'].trim().length === 0) return false;
    if (!Array.isArray(m['rawSignals'])) return false;
    if (!Array.isArray(m['structuredSignals'])) return false;
    if (typeof m['agentOutputs'] !== 'object' || m['agentOutputs'] === null || Array.isArray(m['agentOutputs'])) return false;
    if (!Array.isArray(m['debateLog'])) return false;
    // executionMeta is optional but if present must have required fields
    if (m['executionMeta'] !== undefined) {
        const meta = m['executionMeta'] as Record<string, unknown>;
        if (typeof meta['startedAt'] !== 'number') return false;
        if (typeof meta['retries'] !== 'number') return false;
    }

    return true;
}

// ─── Generic Section Updater ───────────────────────────────────────────────────

/**
 * Atomically update a single top-level key in SharedMemory.
 *
 * The entire memory is cloned first, then only the target key is overwritten
 * with a deep clone of `value`. No other fields are touched.
 *
 * @example
 * memory = updateMemorySection(memory, 'domain', 'stripe.io');
 */
export function updateMemorySection<K extends keyof SharedMemory>(
    memory: SharedMemory,
    key: K,
    value: SharedMemory[K],
): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned[key] = structuredClone(value) as SharedMemory[K];
    return cloned;
}

// ─── Signal Writers ────────────────────────────────────────────────────────────

/**
 * Append raw signals to memory, returning a new memory object.
 * Existing signals are preserved (append-only, no deduplication).
 *
 * @example
 * memory = addRawSignals(memory, [{ id: '...', type: 'FUNDING', ... }]);
 */
export function addRawSignals(
    memory: SharedMemory,
    signals: Signal[],
): SharedMemory {
    if (signals.length === 0) return memory; // no-op fast path
    const cloned = cloneMemory(memory);
    cloned.rawSignals = [...cloned.rawSignals, ...structuredClone(signals)];
    return cloned;
}

/**
 * Append structured (normalized) signals to memory.
 * Existing structured signals are preserved.
 *
 * @example
 * memory = addStructuredSignals(memory, normalized);
 */
export function addStructuredSignals(
    memory: SharedMemory,
    signals: StructuredSignal[],
): SharedMemory {
    if (signals.length === 0) return memory; // no-op fast path
    const cloned = cloneMemory(memory);
    cloned.structuredSignals = [...cloned.structuredSignals, ...structuredClone(signals)];
    return cloned;
}

// ─── Agent Output Writer ───────────────────────────────────────────────────────

/**
 * Write (or overwrite) an agent's output into the agentOutputs registry.
 *
 * Each agent should call this once per run with its own key (e.g. "technical").
 * If an output with the same key already exists it will be replaced.
 *
 * @param agentKey - Lowercase identifier key, e.g. "technical"
 * @param output   - The AgentOutput produced by the agent
 *
 * @example
 * memory = setAgentOutput(memory, 'technical', { agentName: 'TechnicalAgent', score: 75, insights: [...] });
 */
export function setAgentOutput(
    memory: SharedMemory,
    agentKey: string,
    output: AgentOutput,
): SharedMemory {
    if (!agentKey || typeof agentKey !== 'string') {
        throw new Error(`setAgentOutput(): agentKey must be a non-empty string, got "${String(agentKey)}"`);
    }
    const cloned = cloneMemory(memory);
    cloned.agentOutputs = {
        ...cloned.agentOutputs,
        [agentKey]: structuredClone(output),
    };
    return cloned;
}

// ─── Debate Log Writer ─────────────────────────────────────────────────────────

/**
 * Append one or more DebateMessages to the debate log.
 *
 * Messages are appended in order; existing messages are never replaced.
 *
 * @example
 * memory = appendDebateMessages(memory, [{ agent: 'TechnicalAgent', ... }]);
 */
export function appendDebateMessages(
    memory: SharedMemory,
    messages: DebateMessage[],
): SharedMemory {
    if (messages.length === 0) return memory; // no-op fast path
    const cloned = cloneMemory(memory);
    cloned.debateLog = [...cloned.debateLog, ...structuredClone(messages)];
    return cloned;
}

// ─── Score Breakdown Writer ────────────────────────────────────────────────────

/**
 * Replace the full ScoreBreakdown in memory.
 *
 * @example
 * memory = updateScoreBreakdown(memory, verdictAgent.scoreBreakdown);
 */
export function updateScoreBreakdown(
    memory: SharedMemory,
    score: ScoreBreakdown,
): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned.scoreBreakdown = structuredClone(score);
    return cloned;
}

// ─── Confidence Writer ─────────────────────────────────────────────────────────

/**
 * Replace the confidenceMetrics in memory.
 *
 * @example
 * memory = updateConfidence(memory, { overall: 0.82, breakdown: { ... } });
 */
export function updateConfidence(
    memory: SharedMemory,
    confidence: MemoryConfidenceData,
): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned.confidenceMetrics = structuredClone(confidence);
    return cloned;
}

// ─── Execution Meta Writers ────────────────────────────────────────────────────

/**
 * Stamp the memory with a `completedAt` timestamp, marking the pipeline as done.
 * Idempotent — calling multiple times only updates the timestamp.
 *
 * @example
 * memory = markExecutionComplete(memory);
 */
export function markExecutionComplete(memory: SharedMemory): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned.executionMeta = {
        ...(cloned.executionMeta ?? { startedAt: Date.now(), retries: 0 }),
        completedAt: Date.now(),
    };
    return cloned;
}

/**
 * Increment the retry counter on executionMeta.
 * Initializes executionMeta if it was not previously set.
 *
 * @example
 * memory = incrementRetry(memory); // on agent failure / retry
 */
export function incrementRetry(memory: SharedMemory): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned.executionMeta = {
        ...(cloned.executionMeta ?? { startedAt: Date.now(), retries: 0 }),
        retries: (cloned.executionMeta?.retries ?? 0) + 1,
    };
    return cloned;
}

// ─── Read-Only View ────────────────────────────────────────────────────────────

/**
 * Produce a deep-readonly view of memory for inspection or logging.
 * This is a zero-cost cast at runtime — no cloning occurs.
 * Use when passing memory to read-only consumers (e.g. loggers, dashboards).
 *
 * @example
 * const view = toReadonly(memory);
 * view.rawSignals[0].id = 'x'; // ❌ TypeScript compile error
 */
export function toReadonly(memory: SharedMemory): ReadonlyMemory {
    return memory as ReadonlyMemory;
}

// ─── Computed Selectors (pure, no cloning) ─────────────────────────────────────

/**
 * Returns true if the pipeline has run to completion.
 * Checks for the presence of `executionMeta.completedAt`.
 */
export function isComplete(memory: SharedMemory): boolean {
    return typeof memory.executionMeta?.completedAt === 'number';
}

/**
 * Returns the elapsed pipeline time in milliseconds.
 * If not yet complete, returns elapsed time from startedAt to now.
 */
export function elapsedMs(memory: SharedMemory): number {
    const start = memory.executionMeta?.startedAt ?? 0;
    const end = memory.executionMeta?.completedAt ?? Date.now();
    return Math.max(0, end - start);
}

/**
 * Returns the final score from the VerdictAgent (via scoreBreakdown),
 * or `null` if the verdict has not yet been produced.
 */
export function getFinalScore(memory: SharedMemory): number | null {
    const s = memory.scoreBreakdown;
    if (!s || s.finalScore === 0 && s.technical === 0 && s.financial === 0 && s.market === 0) {
        return null;
    }
    return s.finalScore;
}

/**
 * Returns the number of raw signals currently in memory.
 */
export function signalCount(memory: SharedMemory): number {
    return memory.rawSignals.length;
}
