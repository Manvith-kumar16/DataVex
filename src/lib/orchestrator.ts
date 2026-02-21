// src/lib/orchestrator.ts
//
// Phase 3: AgentExecutionEngine — Enterprise-Grade Orchestrator
//
// This is the brain controller of the entire intelligence pipeline.
// Responsibilities:
//   • Dependency-aware stage execution (sequential stages, parallel within stage)
//   • Retry-safe agent wrapping (configurable max retries, per-agent isolation)
//   • Failure isolation — one agent failure does NOT crash the pipeline
//   • Real-time progress emission via callback
//   • Execution timing metadata via MemoryStore lifecycle functions
//   • Pure memory-in / memory-out design (no global state, no UI coupling)
//
// Dependency graph (read top → bottom):
//
//   Stage 0: [research]
//   Stage 1: [signal]           ← depends on research
//   Stage 2: [technical, financial, market]  ← parallel, depend on signal
//   Stage 3: [debate]           ← depends on all Stage 2
//   Stage 4: [verdict]          ← depends on debate
//
// Each stage runs sequentially. Agents within a stage run in parallel.

import type { SharedMemory } from '@/types/analysis';
import {
    createMemory,
    cloneMemory,
    incrementRetry,
    markExecutionComplete,
    updateConfidence,
} from './memoryStore';

import { researchAgent } from './agents/researchAgent';
import { signalAgent } from './agents/signalAgent';
import { technicalAgent } from './agents/technicalAgent';
import { financialAgent } from './agents/financialAgent';
import { marketAgent } from './agents/marketAgent';
import { debateAgent } from './agents/debateAgent';
import { verdictAgent } from './agents/verdictAgent';
import { computeConfidence } from './scoring/confidenceEngine';
import { calculateAlignmentIndex } from './scoring/alignmentIndex';

// ─── Public Types ──────────────────────────────────────────────────────────────

export type AgentName =
    | 'research'
    | 'signal'
    | 'technical'
    | 'financial'
    | 'market'
    | 'verdict'
    | 'debate'
    | 'alignment'
    | 'confidence';

export type ExecutionStatus = 'STARTED' | 'SUCCESS' | 'FAILED' | 'RETRYING';

/**
 * Emitted by the orchestrator at each agent lifecycle event.
 * Designed to be consumed by UI progress bars, logging, or telemetry.
 */
export interface ExecutionProgress {
    /** Name of the agent this event relates to. */
    agent: AgentName;
    /** Lifecycle status of this emission. */
    status: ExecutionStatus;
    /** Unix epoch (ms) of this event. */
    timestamp: number;
    /** Attempt number (1-indexed). Present on RETRYING events. */
    attempt?: number;
    /** Error message if status is FAILED. */
    errorMsg?: string;
}

/**
 * Callback type for receiving real-time pipeline progress updates.
 * Must be synchronous (or fire-and-forget async) — orchestrator will not await it.
 */
export type ProgressCallback = (progress: ExecutionProgress) => void;

/**
 * Result envelope wrapping the completed SharedMemory with pipeline metadata.
 */
export interface OrchestratorResult {
    /** Final memory object after all agents have run. */
    memory: SharedMemory;
    /** Whether all agents succeeded without hitting their retry limit. */
    success: boolean;
    /** Agents that exhausted retries and returned fallback memory. */
    failedAgents: AgentName[];
    /** Total elapsed wall-clock time in milliseconds. */
    elapsedMs: number;
}

/**
 * Options to customize the AgentExecutionEngine behavior.
 */
export interface OrchestratorOptions {
    /**
     * Maximum number of additional retry attempts per agent after initial failure.
     * Default: 2 (so up to 3 total attempts).
     */
    maxRetries?: number;
    /**
     * Milliseconds to wait before each retry attempt.
     * Default: 0 (immediate).
     */
    retryDelayMs?: number;
    /**
     * Max milliseconds to wait for a single agent invocation before aborting.
     * Default: 5000 (5 s). Set to 0 to disable.
     */
    agentTimeoutMs?: number;
}

// ─── Pipeline Stage Definition ─────────────────────────────────────────────────

type AgentFn = (memory: SharedMemory) => SharedMemory;

interface PipelineStage {
    /** Human label for this stage (for logging). */
    label: string;
    /** Agents in this stage run in PARALLEL. */
    agents: Array<{ name: AgentName; fn: AgentFn }>;
}

/**
 * The canonical pipeline definition.
 * Stages execute in array order. Agents within a stage run concurrently.
 *
 * When a stage has multiple parallel agents and one fails, the others
 * still run and their results are merged back into memory.
 */
const PIPELINE_STAGES: readonly PipelineStage[] = [
    {
        label: 'Stage 0 — Research',
        agents: [{ name: 'research', fn: researchAgent }],
    },
    {
        label: 'Stage 1 — Signal Extraction',
        agents: [{ name: 'signal', fn: signalAgent }],
    },
    {
        label: 'Stage 2 — Specialist Analysis (parallel)',
        agents: [
            { name: 'technical', fn: technicalAgent },
            { name: 'financial', fn: financialAgent },
            { name: 'market', fn: marketAgent },
        ],
    },
    {
        // Verdict runs first: it computes the final weighted score
        // so the debate can reference the authoritative scoring outcome.
        label: 'Stage 3 — Verdict (scoring)',
        agents: [{ name: 'verdict', fn: verdictAgent }],
    },
    {
        // Debate runs second: agents discuss the already-computed verdict.
        label: 'Stage 4 — Multi-Agent Debate',
        agents: [{ name: 'debate', fn: debateAgent }],
    },
] as const;

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<OrchestratorOptions> = {
    maxRetries: 2,
    retryDelayMs: 0,
    agentTimeoutMs: 5_000,
};

// ─── AgentExecutionEngine ──────────────────────────────────────────────────────

/**
 * Enterprise-grade orchestrator for the DataVex agent pipeline.
 *
 * @example
 * ```typescript
 * const engine = new AgentExecutionEngine((progress) => {
 *   console.log(`[${progress.agent}] ${progress.status}`);
 * });
 *
 * const { memory, success, failedAgents, elapsedMs } = await engine.runAnalysis('stripe.com');
 * console.log(memory.scoreBreakdown?.finalScore);
 * ```
 */
export class AgentExecutionEngine {
    private readonly opts: Required<OrchestratorOptions>;
    private readonly onProgress?: ProgressCallback;

    constructor(onProgress?: ProgressCallback, options: OrchestratorOptions = {}) {
        this.onProgress = onProgress;
        this.opts = { ...DEFAULT_OPTIONS, ...options };
    }

    // ── Public API ───────────────────────────────────────────────────────────────

    /**
     * Execute the full agent pipeline for a given domain.
     *
     * @param domain - The company domain to analyse, e.g. "stripe.com"
     * @returns An OrchestratorResult containing memory + pipeline metadata
     */
    async runAnalysis(domain: string): Promise<OrchestratorResult> {
        const wallStart = Date.now();
        const failedAgents: AgentName[] = [];

        let memory = createMemory(domain);

        for (const stage of PIPELINE_STAGES) {
            const { memory: nextMemory, failed } = await this.runStage(stage, memory);
            memory = nextMemory;
            failedAgents.push(...failed);
        }

        // ── Post-pipeline: Alignment Index ───────────────────────────────────
        this.emit({ agent: 'alignment', status: 'STARTED' });

        const alignment = calculateAlignmentIndex(memory);
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
                        `Mean Score: ${alignment.meanScore}`,
                    ],
                    metadata: alignment as unknown as Record<string, unknown>,
                },
            },
        };

        this.emit({ agent: 'alignment', status: 'SUCCESS' });

        // ── Post-pipeline: Confidence ─────────────────────────────────────────
        this.emit({ agent: 'confidence', status: 'STARTED' });

        const confidence = computeConfidence(memory);
        memory = updateConfidence(memory, {
            ...confidence,
            alignmentIndex: alignment.alignmentIndex,
            alignmentRisk: alignment.riskIndicator,
        });

        this.emit({ agent: 'confidence', status: 'SUCCESS' });

        memory = markExecutionComplete(memory);

        return {
            memory,
            success: failedAgents.length === 0,
            failedAgents,
            elapsedMs: Date.now() - wallStart,
        };
    }

    // ── Stage Execution ──────────────────────────────────────────────────────────

    /**
     * Execute all agents in a stage concurrently, then merge their outputs.
     *
     * Parallel merge strategy for multi-agent stages:
     *   Each agent receives the SAME input memory (the current stage input).
     *   After all agents complete, their agentOutputs are merged into a
     *   single memory. This prevents agents from accidentally depending on
     *   each other within the same stage.
     */
    private async runStage(
        stage: PipelineStage,
        inputMemory: SharedMemory,
    ): Promise<{ memory: SharedMemory; failed: AgentName[] }> {

        const failed: AgentName[] = [];

        if (stage.agents.length === 1) {
            // Fast path: single-agent stage — no merging needed
            const { name, fn } = stage.agents[0];
            const result = await this.executeWithRetry(name, fn, inputMemory);
            if (result.failed) failed.push(name);
            return { memory: result.memory, failed };
        }

        // Parallel path: run all agents concurrently on same input
        const results = await Promise.all(
            stage.agents.map(({ name, fn }) =>
                this.executeWithRetry(name, fn, cloneMemory(inputMemory)),
            ),
        );

        // Merge: start from inputMemory, apply each agent's agentOutputs
        let merged = cloneMemory(inputMemory);

        for (let i = 0; i < results.length; i++) {
            const { memory: agentMemory, failed: agentFailed } = results[i];
            const { name } = stage.agents[i];

            if (agentFailed) {
                failed.push(name);
                continue; // skip merging failed agent's output
            }

            // Only merge the agentOutputs key — other fields untouched
            const agentKey = name as string;
            if (agentMemory.agentOutputs[agentKey]) {
                merged = {
                    ...merged,
                    agentOutputs: {
                        ...merged.agentOutputs,
                        [agentKey]: agentMemory.agentOutputs[agentKey],
                    },
                    // Also carry forward structuredSignals if the agent modified them
                    structuredSignals: agentMemory.structuredSignals.length > merged.structuredSignals.length
                        ? agentMemory.structuredSignals
                        : merged.structuredSignals,
                };
            }
        }

        return { memory: merged, failed };
    }

    // ── Retry Wrapper ────────────────────────────────────────────────────────────

    /**
     * Execute a single agent function with retry logic and failure isolation.
     *
     * Behaviour:
     *   1. Attempt 0: run agent
     *   2. On failure: wait `retryDelayMs`, increment retry counter, attempt again
     *   3. After `maxRetries` exhausted: emit FAILED, return current memory (isolation)
     *   4. On any success: emit SUCCESS, return updated memory
     */
    private async executeWithRetry(
        name: AgentName,
        agentFn: AgentFn,
        memory: SharedMemory,
    ): Promise<{ memory: SharedMemory; failed: boolean }> {

        let currentMemory = cloneMemory(memory);
        const totalAttempts = this.opts.maxRetries + 1;

        for (let attempt = 1; attempt <= totalAttempts; attempt++) {
            const isRetry = attempt > 1;

            if (isRetry) {
                this.emit({ agent: name, status: 'RETRYING', attempt });
                currentMemory = incrementRetry(currentMemory);
                if (this.opts.retryDelayMs > 0) {
                    await this.delay(this.opts.retryDelayMs);
                }
            } else {
                this.emit({ agent: name, status: 'STARTED' });
            }

            try {
                const result = await this.timedExecute(agentFn, currentMemory);
                this.emit({ agent: name, status: 'SUCCESS' });
                return { memory: result, failed: false };
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);

                if (attempt === totalAttempts) {
                    // All attempts exhausted — isolate failure
                    this.emit({ agent: name, status: 'FAILED', errorMsg });
                    console.error(
                        `[Orchestrator] Agent "${name}" failed after ${totalAttempts} attempt(s): ${errorMsg}`,
                    );
                    return { memory: currentMemory, failed: true };
                }
                // Otherwise continue to next retry
            }
        }

        // Unreachable — TypeScript requires a return
        return { memory: currentMemory, failed: true };
    }

    // ── Timed Execution ──────────────────────────────────────────────────────────

    /**
     * Execute `agentFn(memory)` in a Promise, with an optional timeout.
     *
     * The async boundary is intentional:
     *   - Enables future integration with real async data sources
     *   - Allows timeout via Promise.race
     *   - Ensures each agent invocation is a distinct microtask
     */
    private timedExecute(
        agentFn: AgentFn,
        memory: SharedMemory,
    ): Promise<SharedMemory> {
        const executionPromise = new Promise<SharedMemory>((resolve, reject) => {
            try {
                const result = agentFn(memory);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });

        if (!this.opts.agentTimeoutMs) return executionPromise;

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error(`Agent execution timed out after ${this.opts.agentTimeoutMs}ms`)),
                this.opts.agentTimeoutMs,
            ),
        );

        return Promise.race([executionPromise, timeoutPromise]);
    }

    // ── Progress Emitter ─────────────────────────────────────────────────────────

    private emit(partial: Omit<ExecutionProgress, 'timestamp'>): void {
        if (!this.onProgress) return;
        try {
            this.onProgress({ ...partial, timestamp: Date.now() });
        } catch {
            // Never let a progress callback crash the pipeline
        }
    }

    // ── Utilities ────────────────────────────────────────────────────────────────

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ─── Convenience Factory ───────────────────────────────────────────────────────

/**
 * Convenience wrapper to run a one-shot analysis without instantiating the class.
 *
 * @example
 * const result = await runAnalysis('stripe.com', (p) => console.log(p));
 */
export async function runAnalysis(
    domain: string,
    onProgress?: ProgressCallback,
    options?: OrchestratorOptions,
): Promise<OrchestratorResult> {
    const engine = new AgentExecutionEngine(onProgress, options);
    return engine.runAnalysis(domain);
}
