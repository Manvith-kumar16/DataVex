import type { SharedMemory, StructuredSignal } from '../types/analysis';
import { cloneMemory } from '../lib/memoryStore';

const TECH_SIGNAL_WEIGHT = 22;
const HIRING_SIGNAL_WEIGHT = 18;

const SERVICE_MAP = [
    {
        name: 'Application Development',
        keywords: ['legacy', 'modernization', 'react', 'frontend', '.net', 'microservices', 'monolith'],
        baseReason: 'Modernization of legacy systems and frontend acceleration.',
    },
    {
        name: 'AI & Data Analytics',
        keywords: ['data', 'python', 'ai', 'ml', 'analytics', 'pipeline', 'machine learning', 'predictive'],
        baseReason: 'Integration of intelligent data pipelines and predictive modeling.',
    },
    {
        name: 'Cloud & DevOps',
        keywords: ['aws', 'cloud', 'kubernetes', 'devops', 'ci/cd', 'infrastructure', 'azure', 'gcp', 'terrafom', 'ansible'],
        baseReason: 'Cloud infrastructure optimization and CI/CD automation.',
    },
    {
        name: 'Digital Transformation',
        keywords: ['digital', 'modernization', 'legacy', 'migration', 'api', 'transformation', 'omnichannel'],
        baseReason: 'Strategic digital shift and platform modernization.',
    },
];

export function technicalAgent(memory: SharedMemory): SharedMemory {
    const updated = cloneMemory(memory);
    const structured: StructuredSignal[] = updated.structuredSignals;

    const techSignals = structured.filter((s) => s.category === 'TECH');
    const hiringSignals = structured.filter((s) => s.category === 'HIRING');
    const riskSignals = structured.filter((s) => s.category === 'RISK');

    // Calculate technical score
    const score = Math.min(
        100,
        techSignals.length * TECH_SIGNAL_WEIGHT +
        hiringSignals.length * HIRING_SIGNAL_WEIGHT,
    );

    // Dynamic Service Matching
    const allSignalText = structured.map(s => s.summary.toLowerCase()).join(' ');

    const matchedServices = SERVICE_MAP.map(svc => {
        const matches = svc.keywords.filter(k => allSignalText.includes(k));
        const isMatch = matches.length > 0;
        const relevance = isMatch ? Math.min(10, matches.length * 3 + 4) : 0;

        // Dynamic Reasoning: Cite the specific keywords/signals found
        const reason = isMatch
            ? `Detected ${matches.length} key signal${matches.length > 1 ? 's' : ''} for ${svc.name}.`
            : `General industry alignment for ${svc.name}.`;

        const detailedExplanation = isMatch
            ? `Our analysis identified specific indicators including ${matches.map(m => `"${m}"`).join(', ')}. These signals suggest a high-impact opportunity for ${svc.name} within the ${memory.research?.industry || 'tech'} landscape.`
            : `While no direct secondary signals were captured for ${svc.name}, preliminary research suggest baseline requirements for ${svc.name} based on ${updated.domain}'s current growth phase.`;

        return {
            service: svc.name,
            relevance,
            reason,
            isMatch,
            detailedExplanation
        };
    }).sort((a, b) => b.relevance - a.relevance);

    const insights: string[] = [
        `Detected ${techSignals.length} TECH signals and ${hiringSignals.length} HIRING signals`,
        score >= 70
            ? 'Strong modernization indicators'
            : score >= 40
                ? 'Moderate technical alignment'
                : 'Weak technical signals',
    ];

    if (techSignals.length > 0) {
        insights.push(`Key technical drivers: ${techSignals.slice(0, 3).map((s) => `"${s.summary}"`).join('; ')}`);
    }

    const risks: string[] = riskSignals.map((s) => s.summary);

    updated.agentOutputs['technical'] = {
        agentName: 'TechnicalAgent',
        score,
        insights,
        risks,
        metadata: {
            techCount: techSignals.length,
            hiringCount: hiringSignals.length,
            riskCount: riskSignals.length,
            matchedServices, // Dynamic service mappings
            riskSummary: risks.length > 0
                ? `Identified ${risks.length} potential technical risk factors including ${risks[0].toLowerCase()}.`
                : 'No immediate technical blockers identified; standard integration window observed.'
        },
    };

    return updated;
}
