import { createMemory, cloneMemory } from './memoryStore';
import { checkEnterpriseIsolation } from '../services/enterpriseIsolation';
import { researchAgent } from '../agents/researchAgent';
import { signalAgent } from '../agents/signalAgent';
import { technicalAgent } from '../agents/technicalAgent';
import { financialAgent } from '../agents/financialAgent';
import { marketAgent } from '../agents/marketAgent';
import { debateAgent } from '../agents/debateAgent';
import { verdictAgent } from '../agents/verdictAgent';
import { extractName, hash, sr, clamp } from './utils';
import type { AnalysisResult, ResearchData, ConfidenceData, SignalWithEvidence } from '../types/analysis';

export async function runServerAnalysis(domain: string): Promise<AnalysisResult> {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

    // 1. Enterprise Isolation
    const enterpriseCheck = await checkEnterpriseIsolation(cleanDomain);
    if (enterpriseCheck.isEnterprise) {
        const research: ResearchData = {
            industry: enterpriseCheck.category || 'Enterprise',
            companyName: extractName(cleanDomain),
            domain: cleanDomain,
            description: enterpriseCheck.explanation || '',
            employeeCount: 'Enterprise Scale',
            fundingSignals: [], hiringSignals: [], techClues: [], expansionSignals: [], rawSources: []
        };

        return {
            id: crypto.randomUUID(), domain: cleanDomain, timestamp: new Date().toISOString(),
            research,
            signals: { fundingStage: 'Enterprise', hiringVelocity: 0, growthPhase: 'Mature', digitalTransformationSignals: [], technicalDebtSignals: [] },
            technicalFit: { score: 0, matchedServices: [], riskSummary: 'Enterprise Internal Capabilities Policy' },
            timing: { timingScore: 0, budgetStrength: 0, urgencyIndex: 0, budgetConfidence: 'N/A', fundingMomentum: 'N/A', expansionReadiness: 'N/A' },
            market: { marketPositionScore: 0, industryPressure: 0, innovationUrgency: 0, competitiveRisk: 0, strategicAlignment: 0 },
            score: { leadScore: 0, category: 'Cold', confidence: 100, breakdown: { technicalFit: 0, timing: 0, budget: 0, urgency: 0, marketPosition: 0 } },
            debate: { entries: [], resolution: 'Pipeline terminated: Strategic Enterprise Isolation.', agreementPercent: 100 },
            verdict: {
                action: 'Isolate',
                whyNow: enterpriseCheck.explanation || 'Strategically self-sufficient organization.',
                riskFactors: ['Large Enterprise Exclusion Policy Triggered'],
                confidence: 100,
                isIsolated: true,
                isolationCategory: enterpriseCheck.category,
                isolationExplanation: enterpriseCheck.explanation
            },
            outreach: { decisionMakerPersona: 'N/A', email: '', linkedin: '', coldCall: '', valueProposition: 'Outreach suspended due to Enterprise Isolation Policy.' },
            confidence: { overall: 100, dataCompleteness: 100, agentAgreement: 100, evidenceStrength: 100 },
            evidenceSignals: [], riskIndex: 95, opportunityIndex: 5
        } as any;
    }

    // 2. Full Pipeline
    let memory = createMemory(cleanDomain);

    memory = await researchAgent(memory);
    memory = await signalAgent(memory);
    memory = await technicalAgent(memory);
    memory = await financialAgent(memory);
    memory = await marketAgent(memory);
    memory = await debateAgent(memory);
    memory = await verdictAgent(memory);

    // 3. Post-processing (Confidence, Risk/Opportunity)
    const researchData = memory.agentOutputs['research']?.metadata;
    const outreach = {
        decisionMakerPersona: `Stakeholder at ${extractName(cleanDomain)}`,
        email: 'Sample email body generated on server.',
        linkedin: 'Sample LinkedIn message.',
        coldCall: 'Sample cold call script.',
        valueProposition: 'Modernization through DataVex AI.'
    };

    const seed = hash(cleanDomain);
    const evidenceSignals: SignalWithEvidence[] = memory.rawSignals.map((s, i) => ({
        signal: s.content,
        evidence: {
            level: 'verified',
            source: s.source,
            timestamp: s.timestamp,
            reliability: s.reliability
        }
    }));

    const categoryBreakdown = memory.agentOutputs['signal']?.metadata?.categoryBreakdown || {};

    const result: AnalysisResult = {
        id: crypto.randomUUID(),
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        research: {
            industry: researchData?.industry || 'Tech',
            companyName: extractName(cleanDomain),
            domain: cleanDomain,
            description: `Analysis for ${cleanDomain}`,
            employeeCount: 'N/A',
            fundingSignals: memory.rawSignals.filter(s => s.type === 'FUNDING').map(s => s.content),
            hiringSignals: memory.rawSignals.filter(s => s.type === 'HIRING').map(s => s.content),
            techClues: memory.rawSignals.filter(s => s.type === 'TECH').map(s => s.content),
            expansionSignals: memory.rawSignals.filter(s => s.type === 'EXPANSION').map(s => s.content),
            rawSources: Array.from(new Set(memory.rawSignals.map(s => s.source)))
        },
        signals: {
            fundingStage: 'N/A',
            hiringVelocity: categoryBreakdown['HIRING'] || 0,
            growthPhase: 'N/A',
            digitalTransformationSignals: [],
            technicalDebtSignals: []
        },
        technicalFit: {
            score: memory.agentOutputs['technical']?.score || 0,
            matchedServices: memory.agentOutputs['technical']?.metadata?.matchedServices || [],
            riskSummary: memory.agentOutputs['technical']?.metadata?.riskSummary || 'N/A'
        },
        timing: {
            timingScore: 50,
            budgetStrength: memory.agentOutputs['financial']?.score || 0,
            urgencyIndex: 50,
            budgetConfidence: 'N/A',
            fundingMomentum: 'N/A',
            expansionReadiness: 'N/A'
        },
        market: {
            marketPositionScore: memory.agentOutputs['market']?.score || 0,
            industryPressure: 50,
            innovationUrgency: 50,
            competitiveRisk: 50,
            strategicAlignment: 50
        },
        score: {
            leadScore: memory.scoreBreakdown.finalScore,
            category: memory.scoreBreakdown.finalScore >= 70 ? 'Hot' : memory.scoreBreakdown.finalScore >= 40 ? 'Warm' : 'Cold',
            confidence: 85,
            breakdown: {
                technicalFit: memory.agentOutputs['technical']?.score || 0,
                timing: 50,
                budget: memory.agentOutputs['financial']?.score || 0,
                urgency: 50,
                marketPosition: memory.agentOutputs['market']?.score || 0
            }
        },
        debate: {
            entries: memory.debateLog.map(m => ({ agent: m.agent, position: m.content, sentiment: 'neutral' as const, confidence: 1 })),
            resolution: memory.agentOutputs['debate']?.insights?.[1] || 'Analysis complete.',
            agreementPercent: memory.agentOutputs['debate']?.metadata?.agreementPercent || 0
        },
        verdict: {
            action: memory.scoreBreakdown.finalScore >= 70 ? 'Pursue' : memory.scoreBreakdown.finalScore >= 40 ? 'Nurture' : 'Skip',
            whyNow: 'Strategic indicators suggest an optimal window for engagement.',
            riskFactors: [],
            confidence: 85
        },
        outreach,
        confidence: {
            overall: 85,
            dataCompleteness: 80,
            agentAgreement: 90,
            evidenceStrength: 85
        },
        evidenceSignals,
        riskIndex: 30,
        opportunityIndex: 70
    };

    return result;
}
