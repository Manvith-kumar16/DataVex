import type {
    SharedMemory,
    Signal,
    StructuredSignal,
    AgentOutput,
    ScoreBreakdown,
    DebateMessage,
    MemoryConfidenceData,
    ExecutionMeta,
} from '../types/analysis';

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

export function createMemory(domain: string): SharedMemory {
    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
        throw new Error(`createMemory(): invalid domain "${String(domain)}"`);
    }

    return {
        domain: domain.trim(),
        rawSignals: [],
        structuredSignals: [],
        agentOutputs: {},
        scoreBreakdown: JSON.parse(JSON.stringify(DEFAULT_SCORE_BREAKDOWN)),
        debateLog: [],
        confidenceMetrics: JSON.parse(JSON.stringify(DEFAULT_CONFIDENCE)),
        executionMeta: { startedAt: Date.now(), retries: 0 },
    };
}

export function cloneMemory(memory: SharedMemory): SharedMemory {
    return JSON.parse(JSON.stringify(memory));
}

export function updateAgentOutput(memory: SharedMemory, key: string, output: AgentOutput): SharedMemory {
    const cloned = cloneMemory(memory);
    cloned.agentOutputs[key] = output;
    return cloned;
}
