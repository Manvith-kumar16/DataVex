// src/lib/agents/technicalAgent.ts
//
// TechnicalAgent — Stage 3a of the modular pipeline.
//
// Responsibility:
//   Assess technical fit by evaluating TECH and HIRING signals.
//   High TECH signals indicate modernization needs (fit opportunity).
//   High HIRING signals indicate scaling initiatives (service opportunity).
//
// Scoring model:
//   score = min(100, (techCount * TECH_WEIGHT + hiringCount * HIRING_WEIGHT) * 100)
//
// Contract:
//   • Accepts SharedMemory
//   • Never mutates the original reference (uses cloneMemory)
//   • Reads memory.structuredSignals
//   • Writes AgentOutput to memory.agentOutputs["technical"]
//   • Returns updated SharedMemory

import type { SharedMemory, StructuredSignal } from '@/types/analysis';
import { cloneMemory } from '@/types/analysis';

// Weight of each matched signal category toward the 0–100 score
const TECH_SIGNAL_WEIGHT = 22; // points per TECH signal
const HIRING_SIGNAL_WEIGHT = 18; // points per HIRING signal

/**
 * TechnicalAgent — evaluates technical and hiring signals to produce a fit score.
 *
 * @param memory - Current SharedMemory context.
 * @returns New SharedMemory with agentOutputs["technical"] populated.
 */
export function technicalAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const structured: StructuredSignal[] = updated.structuredSignals;

    const techSignals = structured.filter((s) => s.category === 'TECH');
    const hiringSignals = structured.filter((s) => s.category === 'HIRING');
    const riskSignals = structured.filter((s) => s.category === 'RISK');

    const score = Math.min(
        100,
        techSignals.length * TECH_SIGNAL_WEIGHT +
        hiringSignals.length * HIRING_SIGNAL_WEIGHT,
    );

    const insights: string[] = [
        `Detected ${techSignals.length} TECH signal${techSignals.length !== 1 ? 's' : ''} and ${hiringSignals.length} HIRING signal${hiringSignals.length !== 1 ? 's' : ''}`,
        score >= 70
            ? 'Strong modernization indicators — high technical fit with DataVex capabilities'
            : score >= 40
                ? 'Moderate technical alignment — some service overlap identified'
                : 'Weak technical signals — limited immediate fit detected',
    ];

    if (techSignals.length > 0) {
        insights.push(`Tech signals: ${techSignals.map((s) => `"${s.summary}"`).join('; ')}`);
    }

    const risks: string[] = riskSignals.length > 0
        ? [
            `${riskSignals.length} RISK signal${riskSignals.length !== 1 ? 's' : ''} detected — potential technical debt`,
            ...riskSignals.map((s) => s.summary),
        ]
        : [];

    const opportunities: string[] = [
        ...(techSignals.length > 0 ? ['Tech modernization engagement opportunity'] : []),
        ...(hiringSignals.length > 0 ? ['Technical staffing augmentation opportunity'] : []),
    ];

    updated.agentOutputs['technical'] = {
        agentName: 'TechnicalAgent',
        score,
        insights,
        risks,
        opportunities,
        metadata: {
            techCount: techSignals.length,
            hiringCount: hiringSignals.length,
            riskCount: riskSignals.length,
        },
    };

    return updated;
}
