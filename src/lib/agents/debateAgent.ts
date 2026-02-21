// src/lib/agents/debateAgent.ts
//
// DebateAgent — Stage 4 of the modular pipeline.
//
// Responsibility:
//   Synthesize specialist-agent outputs into a structured debate log.
//   Each agent with a score gets one DebateMessage. The sentiment (POSITIVE /
//   NEUTRAL / NEGATIVE) is derived from thresholds on its score. Only agents
//   that produced a numeric score participate in the debate.
//
// Sentiment thresholds:
//   score >= 60  → POSITIVE
//   score >= 35  → NEUTRAL
//   score <  35  → NEGATIVE
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.agentOutputs
//   • Writes DebateMessage[] to memory.debateLog
//   • Returns updated SharedMemory

import type { SharedMemory, DebateMessage } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

// Agents excluded from debate (meta-agents, not scoring agents)
const DEBATE_EXCLUDED_AGENTS = new Set(['research', 'signal', 'debate', 'verdict']);

/** Thresholds for classifying an agent's score into a debate sentiment. */
const POSITIVE_THRESHOLD = 60;
const NEUTRAL_THRESHOLD = 35;

/**
 * Maps a numeric 0–100 score to a debate sentiment string.
 * Confidence is normalized to 0–1.
 */
function scoreToSentiment(score: number): { sentiment: DebateMessage['sentiment']; confidence: number } {
    if (score >= POSITIVE_THRESHOLD) {
        return { sentiment: 'POSITIVE', confidence: parseFloat((score / 100).toFixed(2)) };
    }
    if (score >= NEUTRAL_THRESHOLD) {
        return { sentiment: 'NEUTRAL', confidence: parseFloat((score / 100).toFixed(2)) };
    }
    return { sentiment: 'NEGATIVE', confidence: parseFloat((score / 100).toFixed(2)) };
}

/**
 * Builds a human-readable debate message based on score and agent name.
 */
function buildDebateMessage(agentName: string, score: number, sentiment: DebateMessage['sentiment']): string {
    switch (sentiment) {
        case 'POSITIVE':
            return `${agentName} reports strong signals (score ${score}/100) — recommend engagement.`;
        case 'NEUTRAL':
            return `${agentName} observes moderate signals (score ${score}/100) — conditional pursuit recommended.`;
        case 'NEGATIVE':
            return `${agentName} finds insufficient signals (score ${score}/100) — further data required.`;
    }
}

/**
 * DebateAgent — synthesizes scoring-agent outputs into a structured debate log.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with debateLog populated.
 */
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
            message: buildDebateMessage(output.agentName, score, sentiment),
            sentiment,
            confidence,
        } satisfies DebateMessage;
    });

    updated.debateLog = messages;

    // Summary insights for the debate agent's own output
    const positiveCount = messages.filter((m) => m.sentiment === 'POSITIVE').length;
    const negativeCount = messages.filter((m) => m.sentiment === 'NEGATIVE').length;
    const neutralCount = messages.filter((m) => m.sentiment === 'NEUTRAL').length;

    const resolution =
        positiveCount === messages.length && messages.length > 0
            ? 'All agents in consensus — strong pursuit signal across all dimensions.'
            : negativeCount === messages.length && messages.length > 0
                ? 'All agents in consensus — insufficient signals for immediate pursuit.'
                : `Split decision: ${positiveCount} positive, ${neutralCount} neutral, ${negativeCount} negative.`;

    updated.agentOutputs['debate'] = {
        agentName: 'DebateAgent',
        insights: [
            `Debate completed with ${messages.length} participant${messages.length !== 1 ? 's' : ''}`,
            resolution,
        ],
        metadata: {
            participantCount: messages.length,
            positiveCount,
            neutralCount,
            negativeCount,
            agreementPercent: messages.length > 0
                ? Math.round((positiveCount / messages.length) * 100)
                : 0,
        },
    };

    return updated;
}
