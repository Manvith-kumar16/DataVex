// src/lib/agents/index.ts
//
// Barrel export for all modular agents.
// Import from here in orchestration layers and tests:
//
//   import { researchAgent, signalAgent, verdictAgent } from '@/lib/agents';
//   import type { SharedMemory } from '@/lib/agents';

import type { SharedMemory } from '@/types/analysis';

export { researchAgent } from './researchAgent';
export { signalAgent } from './signalAgent';
export { technicalAgent } from './technicalAgent';
export { financialAgent } from './financialAgent';
export { marketAgent } from './marketAgent';
export { debateAgent } from './debateAgent';
export { verdictAgent } from './verdictAgent';

// Re-export the SharedMemory type and utilities for consumer convenience
export type {
    SharedMemory,
    Signal,
    SignalType,
    EvidenceType,
    StructuredSignal,
    AgentOutput,
    ScoreBreakdown,
    DebateMessage,
    MemoryConfidenceData,
    ExecutionMeta,
    ConfidenceData,
} from '@/types/analysis';

export { cloneMemory } from '@/types/analysis';

/**
 * Factory to create a fresh, empty SharedMemory for a given domain.
 * Use this as the starting point for any agent pipeline run.
 *
 * @example
 * const memory = createEmptyMemory('stripe.com');
 * const afterResearch = researchAgent(memory);
 */
export function createEmptyMemory(domain: string): SharedMemory {
    return {
        domain,
        rawSignals: [],
        structuredSignals: [],
        agentOutputs: {},
        debateLog: [],
    };
}
