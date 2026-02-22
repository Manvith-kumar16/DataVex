import type { SharedMemory, DebateMessage } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

const DEBATE_EXCLUDED_AGENTS = new Set(['research', 'signal', 'debate', 'verdict']);
const POSITIVE_THRESHOLD = 60;
const NEUTRAL_THRESHOLD = 35;

function scoreToSentiment(score: number): { sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'; confidence: number } {
    if (score >= POSITIVE_THRESHOLD) return { sentiment: 'POSITIVE', confidence: score / 100 };
    if (score >= NEUTRAL_THRESHOLD) return { sentiment: 'NEUTRAL', confidence: score / 100 };
    return { sentiment: 'NEGATIVE', confidence: score / 100 };
}

export function debateAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);

    const participatingAgents = Object.entries(updated.agentOutputs).filter(
        ([key, output]) => !DEBATE_EXCLUDED_AGENTS.has(key) && output.score !== undefined,
    );

    const messages: DebateMessage[] = participatingAgents.map(([, output]) => {
        const score = output.score!;
        const { sentiment, confidence } = scoreToSentiment(score);
        return {
            agent: output.agentName,
            content: `${output.agentName} reports ${sentiment.toLowerCase()} signals with ${Math.round(confidence * 100)}% confidence.`,
            timestamp: new Date().toISOString()
        };
    });

    updated.debateLog = messages;

    updated.agentOutputs['debate'] = {
        agentName: 'DebateAgent',
        score: 100,
        insights: [`Debate completed with ${messages.length} participants`],
        metadata: { participantCount: messages.length },
    };

    return updated;
}
