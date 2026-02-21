/**
 * @deprecated This monolithic agent file is preserved for backward compatibility.
 *
 * The agent logic has been refactored into a modular, pure-function architecture:
 *
 *   src/lib/agents/
 *     ├── researchAgent.ts   — raw signal collection
 *     ├── signalAgent.ts     — signal normalization
 *     ├── technicalAgent.ts  — technical fit scoring
 *     ├── financialAgent.ts  — financial readiness scoring
 *     ├── marketAgent.ts     — market opportunity scoring
 *     ├── debateAgent.ts     — multi-agent debate synthesis
 *     └── verdictAgent.ts    — weighted verdict and ScoreBreakdown
 *
 * The exports below (runAnalysis, saveAnalysis, getRecentAnalyses, etc.) remain
 * fully functional and are NOT replaced by this refactor.
 */
import { checkEnterpriseIsolation } from '@/lib/enterpriseIsolation';
import type {
  AnalysisResult, AgentStep, ResearchData, SignalData,
  TechnicalFitData, TimingData, MarketData, ScoreData,
  DebateData, VerdictData, OutreachData,
  EvidenceLevel, SignalWithEvidence, ConfidenceData, Scenario
} from '@/types/analysis';


function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function sr(seed: number, i: number): number {
  const x = Math.sin(seed + i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number, idx: number): T {
  return arr[Math.floor(sr(seed, idx) * arr.length)];
}

function pickN<T>(arr: T[], n: number, seed: number, offset: number): T[] {
  const shuffled = [...arr].sort((a, b) => sr(seed, offset + arr.indexOf(a)) - sr(seed, offset + arr.indexOf(b)));
  return shuffled.slice(0, n);
}

function extractName(domain: string): string {
  const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\.(com|io|co|net|org|dev|ai|tech|xyz).*$/, '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const industries = ['SaaS', 'FinTech', 'HealthTech', 'E-Commerce', 'EdTech', 'LogTech', 'InsurTech', 'PropTech', 'AgTech', 'CleanTech', 'MarTech', 'HRTech', 'LegalTech', 'RegTech'];
const fundingSignalsList = ['Series B round completed Q3', 'Strategic investment from major VC', 'Revenue growth exceeding 40% YoY', 'IPO preparation signals detected', 'Bridge funding secured', 'Government grant recipient'];
const hiringSignalsList = ['VP of Engineering posting active', 'Data Science team expansion (5+ roles)', 'DevOps engineer urgently hiring', 'CTO recently appointed', 'Cloud architect role posted', 'AI/ML team building', 'Product Manager senior hire'];
const techCluesList = ['React frontend detected', 'AWS infrastructure', 'Legacy .NET backend', 'Microservices migration in progress', 'Kubernetes adoption signals', 'Python data pipeline', 'GraphQL API layer', 'Salesforce CRM integration'];
const expansionSignalsList = ['New office in EU market', 'APAC expansion announcement', 'Partner program launch', 'Enterprise tier added', 'International domain registrations', 'Multi-language support added'];
const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Pre-IPO'];
const phases = ['Early Growth', 'Rapid Scale', 'Market Expansion', 'Maturity Transition', 'Acceleration Phase'];
const dtSignals = ['Cloud migration initiative detected', 'Digital-first strategy announced', 'Legacy system replacement project', 'API modernization effort', 'Data platform consolidation'];
const tdSignals = ['Monolithic architecture detected', 'Outdated frontend framework', 'Manual deployment processes', 'Limited CI/CD pipeline', 'Security compliance gaps'];

const datavexServices = [
  { name: 'Application Development', keywords: ['legacy', 'modernization', 'React', 'frontend', '.NET', 'microservices'] },
  { name: 'AI & Data Analytics', keywords: ['data', 'Python', 'AI', 'ML', 'analytics', 'pipeline'] },
  { name: 'Cloud & DevOps', keywords: ['AWS', 'cloud', 'Kubernetes', 'DevOps', 'CI/CD', 'infrastructure'] },
  { name: 'Digital Transformation', keywords: ['digital', 'modernization', 'legacy', 'migration', 'API'] },
];

// === EVIDENCE TAGGING ===
function tagSignals(signals: string[], domain: string, seed: number, offset: number): SignalWithEvidence[] {
  return signals.map((signal, i) => {
    const r = sr(seed, offset + i * 7);
    const level: EvidenceLevel = r > 0.55 ? 'verified' : r > 0.25 ? 'inferred' : 'assumed';
    return {
      signal,
      evidence: {
        level,
        source: level !== 'assumed' ? `https://${domain}/${r > 0.5 ? 'blog' : 'careers'}` : undefined,
        snippet: level === 'verified' ? `"...${signal.toLowerCase().slice(0, 40)}..."` : undefined,
        timestamp: new Date().toISOString(),
        reliability: level === 'verified' ? 0.82 + r * 0.18 : level === 'inferred' ? 0.45 + r * 0.3 : 0.12 + r * 0.25,
      },
    };
  });
}

// === CONFIDENCE ENGINE ===
function calculateConfidence(research: ResearchData, debate: DebateData, evidenceSignals: SignalWithEvidence[]): ConfidenceData {
  const totalSignals = research.fundingSignals.length + research.hiringSignals.length + research.techClues.length + research.expansionSignals.length;
  const dataCompleteness = Math.min(100, totalSignals * 8);
  const agentAgreement = debate.agreementPercent;
  const evidenceStrength = evidenceSignals.length > 0
    ? Math.round(evidenceSignals.reduce((sum, s) => sum + s.evidence.reliability, 0) / evidenceSignals.length * 100)
    : 40;
  const overall = Math.round(dataCompleteness * 0.4 + agentAgreement * 0.3 + evidenceStrength * 0.3);
  return { overall, dataCompleteness, agentAgreement, evidenceStrength };
}

// === RISK / OPPORTUNITY ===
function calculateRiskOpportunity(tech: TechnicalFitData, timing: TimingData, market: MarketData, signals: SignalData) {
  const riskIndex = clamp(Math.round(
    (10 - timing.budgetStrength) * 4 +
    market.competitiveRisk * 4 +
    signals.technicalDebtSignals.length * 8
  ), 5, 95);
  const opportunityIndex = clamp(Math.round(
    tech.score * 5 +
    timing.timingScore * 3 +
    signals.hiringVelocity * 2.5 +
    market.innovationUrgency * 3
  ), 5, 95);
  return { riskIndex, opportunityIndex };
}

// === SCENARIOS ===
export const SCENARIOS: Scenario[] = [
  { id: 'funding_confirmed', name: 'Funding Confirmed', description: 'New funding round confirmed', modifiers: { budget: 20, timing: 12 } },
  { id: 'hiring_slowed', name: 'Hiring Slowed', description: 'Technical hiring frozen', modifiers: { urgency: -15, timing: -8 } },
  { id: 'expansion_paused', name: 'Expansion Paused', description: 'Market expansion on hold', modifiers: { marketPosition: -12, timing: -5 } },
  { id: 'competitor_engaged', name: 'Competitor Engaged', description: 'Active competitor engagement', modifiers: { urgency: 15, marketPosition: -8 } },
  { id: 'tech_modernized', name: 'Tech Modernized', description: 'Recent tech stack upgrade', modifiers: { technicalFit: -18, urgency: -10 } },
];

export function applyScenarios(score: ScoreData, activeIds: string[]): ScoreData {
  const active = SCENARIOS.filter(s => activeIds.includes(s.id));
  if (active.length === 0) return score;
  const b = { ...score.breakdown };
  for (const s of active) {
    if (s.modifiers.technicalFit) b.technicalFit = clamp(b.technicalFit + s.modifiers.technicalFit, 0, 100);
    if (s.modifiers.timing) b.timing = clamp(b.timing + s.modifiers.timing, 0, 100);
    if (s.modifiers.budget) b.budget = clamp(b.budget + s.modifiers.budget, 0, 100);
    if (s.modifiers.urgency) b.urgency = clamp(b.urgency + s.modifiers.urgency, 0, 100);
    if (s.modifiers.marketPosition) b.marketPosition = clamp(b.marketPosition + s.modifiers.marketPosition, 0, 100);
  }
  const leadScore = clamp(Math.round(b.technicalFit * 0.30 + b.timing * 0.25 + b.budget * 0.20 + b.urgency * 0.15 + b.marketPosition * 0.10), 0, 100);
  return { leadScore, category: leadScore >= 70 ? 'Hot' : leadScore >= 40 ? 'Warm' : 'Cold', confidence: score.confidence, breakdown: b };
}

// === MIGRATION FOR OLD DATA ===
function migrateAnalysis(a: any): AnalysisResult {
  return {
    ...a,
    confidence: a.confidence || { overall: 50, dataCompleteness: 50, agentAgreement: 50, evidenceStrength: 50 },
    evidenceSignals: a.evidenceSignals || [],
    riskIndex: a.riskIndex ?? 50,
    opportunityIndex: a.opportunityIndex ?? 50,
  };
}

// === AGENTS ===

function researchAgent(domain: string, seed: number): ResearchData {
  const name = extractName(domain);
  const industry = pick(industries, seed, 0);
  const empCount = Math.floor(sr(seed, 10) * 4000 + 50);
  return {
    industry, companyName: name, domain,
    description: `${name} is a ${industry} company focused on delivering innovative solutions in their vertical.`,
    employeeCount: `${empCount} - ${empCount + Math.floor(sr(seed, 11) * 500)}`,
    fundingSignals: pickN(fundingSignalsList, 2 + Math.floor(sr(seed, 20) * 2), seed, 20),
    hiringSignals: pickN(hiringSignalsList, 2 + Math.floor(sr(seed, 30) * 3), seed, 30),
    techClues: pickN(techCluesList, 3 + Math.floor(sr(seed, 40) * 3), seed, 40),
    expansionSignals: pickN(expansionSignalsList, 1 + Math.floor(sr(seed, 50) * 2), seed, 50),
    rawSources: [`${domain}`, `${domain}/careers`, `${domain}/blog`, `crunchbase.com/organization/${extractName(domain).toLowerCase()}`, `linkedin.com/company/${extractName(domain).toLowerCase()}`],
  };
}

function signalAgent(research: ResearchData, seed: number): SignalData {
  return {
    fundingStage: pick(stages, seed, 100),
    hiringVelocity: Math.round(sr(seed, 101) * 8 + 2),
    growthPhase: pick(phases, seed, 102),
    digitalTransformationSignals: pickN(dtSignals, 2 + Math.floor(sr(seed, 103) * 2), seed, 103),
    technicalDebtSignals: pickN(tdSignals, 1 + Math.floor(sr(seed, 110) * 2), seed, 110),
  };
}

function technicalFitAgent(research: ResearchData, signals: SignalData, seed: number): TechnicalFitData {
  const allClues = [...research.techClues, ...signals.digitalTransformationSignals, ...signals.technicalDebtSignals].join(' ').toLowerCase();
  const matched = datavexServices
    .map(svc => {
      const matchCount = svc.keywords.filter(k => allClues.includes(k.toLowerCase())).length;
      const relevance = Math.min(10, matchCount * 3 + Math.floor(sr(seed, 200 + datavexServices.indexOf(svc)) * 3));
      return { service: svc.name, relevance, reason: matchCount > 0 ? `Detected ${matchCount} signal${matchCount > 1 ? 's' : ''} indicating need for ${svc.name.toLowerCase()}` : `Industry-standard need for ${svc.name.toLowerCase()} in ${research.industry} vertical` };
    }).sort((a, b) => b.relevance - a.relevance);
  const score = Math.round(matched.reduce((sum, m) => sum + m.relevance, 0) / matched.length);
  return { score: Math.min(10, score), matchedServices: matched, riskSummary: signals.technicalDebtSignals.length > 1 ? 'Significant technical debt detected — potential for longer engagement cycles but higher deal value.' : 'Moderate technical landscape — standard integration complexity expected.' };
}

function timingAgent(research: ResearchData, signals: SignalData, seed: number): TimingData {
  const ts = Math.round(sr(seed, 300) * 4 + 5);
  const bs = Math.round(sr(seed, 301) * 5 + 4);
  const ui = Math.round(sr(seed, 302) * 5 + 3);
  return { timingScore: ts, budgetStrength: bs, urgencyIndex: ui, budgetConfidence: bs >= 7 ? 'High' : bs >= 4 ? 'Moderate' : 'Low', fundingMomentum: research.fundingSignals.length >= 2 ? 'Strong upward trajectory' : 'Stable with potential growth', expansionReadiness: research.expansionSignals.length >= 2 ? 'Actively expanding' : 'Evaluating new markets' };
}

function marketAgent(research: ResearchData, seed: number): MarketData {
  return { marketPositionScore: Math.round(sr(seed, 400) * 4 + 5), industryPressure: Math.round(sr(seed, 401) * 5 + 4), innovationUrgency: Math.round(sr(seed, 402) * 4 + 5), competitiveRisk: Math.round(sr(seed, 403) * 5 + 3), strategicAlignment: Math.round(sr(seed, 404) * 3 + 6) };
}

function scoringEngine(tech: TechnicalFitData, timing: TimingData, market: MarketData, research: ResearchData): ScoreData {
  const breakdown = { technicalFit: tech.score * 10, timing: timing.timingScore * 10, budget: timing.budgetStrength * 10, urgency: timing.urgencyIndex * 10, marketPosition: market.marketPositionScore * 10 };
  const leadScore = Math.round(breakdown.technicalFit * 0.30 + breakdown.timing * 0.25 + breakdown.budget * 0.20 + breakdown.urgency * 0.15 + breakdown.marketPosition * 0.10);
  return { leadScore, category: leadScore >= 70 ? 'Hot' : leadScore >= 40 ? 'Warm' : 'Cold', confidence: Math.round(60 + Math.random() * 30), breakdown };
}

function debateAgent(tech: TechnicalFitData, timing: TimingData, market: MarketData, research: ResearchData): DebateData {
  const entries = [
    { agent: 'Technical Fit Agent', position: tech.score >= 7 ? `Strong AI modernization gap detected. ${research.companyName} has clear technical needs that align with DataVex capabilities.` : `Moderate technical alignment. Some service overlap but not a perfect fit.`, sentiment: (tech.score >= 7 ? 'positive' : tech.score >= 4 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral', confidence: tech.score * 10 },
    { agent: 'Financial & Timing Agent', position: timing.budgetStrength >= 7 ? `Strong budget signals with ${timing.budgetConfidence.toLowerCase()} confidence. Funding momentum suggests readiness to invest.` : `${timing.budgetConfidence} budget evidence found. Timing may require nurturing.`, sentiment: (timing.budgetStrength >= 7 ? 'positive' : timing.budgetStrength >= 4 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral', confidence: timing.budgetStrength * 10 },
    { agent: 'Market Strategy Agent', position: market.marketPositionScore >= 7 ? `Industry under significant digital acceleration pressure. ${research.industry} vertical is prime for DataVex engagement.` : `Market position is stable but not under immediate disruption pressure.`, sentiment: (market.marketPositionScore >= 7 ? 'positive' : market.marketPositionScore >= 4 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral', confidence: market.marketPositionScore * 10 },
  ];
  const positiveCount = entries.filter(e => e.sentiment === 'positive').length;
  const agreementPercent = Math.round((positiveCount / entries.length) * 100);
  const allPositive = positiveCount === entries.length;
  const allNegative = entries.every(e => e.sentiment === 'negative');
  return { entries, resolution: allPositive ? 'All agents in consensus — strong pursuit signal across all dimensions.' : allNegative ? 'Agents in consensus — insufficient signals for immediate pursuit.' : `Split decision resolved by Orchestrator. ${positiveCount} of ${entries.length} agents favor pursuit.`, agreementPercent };
}

function verdictAgent(score: ScoreData, debate: DebateData, research: ResearchData): VerdictData {
  const action = score.leadScore >= 65 ? 'Pursue' : score.leadScore >= 35 ? 'Nurture' : 'Skip';
  const whyNowReasons: string[] = [];
  if (research.fundingSignals.length >= 2) whyNowReasons.push('Recent funding activity creates budget availability');
  if (research.hiringSignals.length >= 2) whyNowReasons.push('Active technical hiring suggests modernization initiative');
  if (research.expansionSignals.length >= 1) whyNowReasons.push('Expansion signals indicate infrastructure investment phase');
  whyNowReasons.push(`${research.industry} sector facing digital transformation pressure`);
  return { action, whyNow: whyNowReasons.join('. ') + '.', riskFactors: [debate.agreementPercent < 70 ? 'Agent disagreement on strength of signals' : '', score.confidence < 75 ? 'Moderate confidence level — some data points missing' : '', 'Competitor may already be engaged', 'Budget cycle timing unknown'].filter(Boolean), confidence: score.confidence };
}

function outreachAgent(research: ResearchData, verdict: VerdictData, tech: TechnicalFitData): OutreachData {
  const name = research.companyName;
  const topService = tech.matchedServices[0]?.service || 'Digital Transformation';
  return {
    decisionMakerPersona: `VP of Technology / CTO at ${name}`,
    email: `Subject: ${name}'s ${research.industry} Innovation — A Strategic Conversation\n\nHi [First Name],\n\nI noticed ${name} has been making significant moves recently — ${research.fundingSignals[0]?.toLowerCase() || 'expanding your technical capabilities'}. That caught my attention.\n\nAt DataVex, we've helped similar ${research.industry} companies accelerate their ${topService.toLowerCase()} initiatives, often cutting implementation timelines by 40%.\n\n${verdict.whyNow.split('.')[0]}.\n\nWould you be open to a 15-minute conversation this week?\n\nBest,\n[Your Name]\nDataVex — Enterprise Intelligence Solutions`,
    linkedin: `Hi [First Name], I came across ${name}'s recent growth in the ${research.industry} space — particularly ${research.hiringSignals[0]?.toLowerCase() || 'your technical expansion'}. We work with companies at similar inflection points on ${topService.toLowerCase()}. Would love to connect and share a relevant case study.`,
    coldCall: `Opening: "Hi [First Name], this is [Your Name] from DataVex. I'll be brief — I noticed ${name} is ${research.expansionSignals[0]?.toLowerCase() || 'scaling rapidly'}, and I work with ${research.industry} companies navigating similar growth challenges."\n\nValue Hook: "We recently helped a similar-stage company cut their ${topService.toLowerCase()} timeline by 40% while reducing technical risk."\n\nAsk: "Would it make sense to schedule 15 minutes to see if there's alignment?"`,
    valueProposition: `DataVex brings deep expertise in ${topService} specifically tailored for ${research.industry} companies at ${name}'s growth stage. Our technical fit score of ${tech.score}/10 indicates strong alignment between your detected technology landscape and our solution capabilities.`,
  };
}

// === ORCHESTRATOR ===

const AGENT_STEPS: string[] = [
  'Research Agent', 'Signal Extraction Agent', 'Technical Fit Agent',
  'Financial & Timing Agent', 'Market Strategy Agent', 'Scoring Engine',
  'Multi-Agent Debate', 'Verdict Generator', 'Outreach Strategist',
];

export async function runAnalysis(domain: string, onProgress: (steps: AgentStep[]) => void): Promise<AnalysisResult> {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

  // ── ENTERPRISE ISOLATION GATE ──
  const enterpriseCheck = checkEnterpriseIsolation(cleanDomain);
  if (enterpriseCheck.isEnterprise) {
    const steps: AgentStep[] = AGENT_STEPS.map(agent => ({ agent, status: 'complete' as const, progress: 100 }));
    onProgress(steps);
    return {
      id: crypto.randomUUID(), domain: cleanDomain, timestamp: new Date().toISOString(),
      research: { industry: enterpriseCheck.category || 'Enterprise', companyName: extractName(cleanDomain), domain: cleanDomain, description: enterpriseCheck.explanation || '', employeeCount: 'Enterprise Scale', fundingSignals: [], hiringSignals: [], techClues: [], expansionSignals: [], rawSources: [] },
      signals: { fundingStage: 'Enterprise', hiringVelocity: 0, growthPhase: 'Mature', digitalTransformationSignals: [], technicalDebtSignals: [] },
      technicalFit: { score: 0, matchedServices: [], riskSummary: 'Enterprise Internal Capabilities Policy' },
      timing: { timingScore: 0, budgetStrength: 0, urgencyIndex: 0, budgetConfidence: 'N/A', fundingMomentum: 'N/A', expansionReadiness: 'N/A' },
      market: { marketPositionScore: 0, industryPressure: 0, innovationUrgency: 0, competitiveRisk: 0, strategicAlignment: 0 },
      score: { leadScore: 0, category: 'Cold', confidence: 100, breakdown: { technicalFit: 0, timing: 0, budget: 0, urgency: 0, marketPosition: 0 } },
      debate: { entries: [], resolution: 'Pipeline terminated: Strategic Enterprise Isolation.', agreementPercent: 100 },
      verdict: { action: 'Isolate', whyNow: enterpriseCheck.explanation || 'Strategically self-sufficient organization.', riskFactors: ['Large Enterprise Exclusion Policy Triggered'], confidence: 100, isIsolated: true, isolationCategory: enterpriseCheck.category, isolationExplanation: enterpriseCheck.explanation },
      outreach: { decisionMakerPersona: 'N/A', email: '', linkedin: '', coldCall: '', valueProposition: 'Outreach suspended due to Enterprise Isolation Policy.' },
      confidence: { overall: 100, dataCompleteness: 100, agentAgreement: 100, evidenceStrength: 100 },
      evidenceSignals: [], riskIndex: 95, opportunityIndex: 5
    };
  }

  const seed = hash(cleanDomain);
  const steps: AgentStep[] = AGENT_STEPS.map(agent => ({ agent, status: 'pending' as const, progress: 0 }));
  const updateStep = (idx: number, status: AgentStep['status'], progress: number) => { steps[idx] = { ...steps[idx], status, progress }; onProgress([...steps]); };

  updateStep(0, 'running', 0); await delay(600 + Math.random() * 400);
  const research = researchAgent(cleanDomain, seed); updateStep(0, 'complete', 100);

  updateStep(1, 'running', 0); await delay(400 + Math.random() * 300);
  const signals = signalAgent(research, seed); updateStep(1, 'complete', 100);

  updateStep(2, 'running', 0); await delay(500 + Math.random() * 300);
  const techFit = technicalFitAgent(research, signals, seed); updateStep(2, 'complete', 100);

  updateStep(3, 'running', 0); await delay(300 + Math.random() * 200);
  const timing = timingAgent(research, signals, seed); updateStep(3, 'complete', 100);

  updateStep(4, 'running', 0); await delay(300 + Math.random() * 200);
  const market = marketAgent(research, seed); updateStep(4, 'complete', 100);

  updateStep(5, 'running', 0); await delay(200 + Math.random() * 200);
  const score = scoringEngine(techFit, timing, market, research); updateStep(5, 'complete', 100);

  updateStep(6, 'running', 0); await delay(700 + Math.random() * 500);
  const debate = debateAgent(techFit, timing, market, research); updateStep(6, 'complete', 100);

  updateStep(7, 'running', 0); await delay(300 + Math.random() * 200);
  const verdict = verdictAgent(score, debate, research); updateStep(7, 'complete', 100);

  updateStep(8, 'running', 0); await delay(500 + Math.random() * 300);
  const outreach = outreachAgent(research, verdict, techFit); updateStep(8, 'complete', 100);

  const evidenceSignals = [
    ...tagSignals(research.fundingSignals, cleanDomain, seed, 600),
    ...tagSignals(research.hiringSignals, cleanDomain, seed, 700),
    ...tagSignals(research.techClues, cleanDomain, seed, 800),
    ...tagSignals(research.expansionSignals, cleanDomain, seed, 900),
  ];
  const confidence = calculateConfidence(research, debate, evidenceSignals);
  const { riskIndex, opportunityIndex } = calculateRiskOpportunity(techFit, timing, market, signals);

  return {
    id: crypto.randomUUID(), domain: cleanDomain, timestamp: new Date().toISOString(),
    research, signals, technicalFit: techFit, timing, market, score, debate, verdict, outreach,
    confidence, evidenceSignals, riskIndex, opportunityIndex,
  };
}

export function saveAnalysis(result: AnalysisResult) {
  const stored: AnalysisResult[] = JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
  stored.unshift(result);
  localStorage.setItem('vexintel_analyses', JSON.stringify(stored.slice(0, 20)));
}

export function getRecentAnalyses(): AnalysisResult[] {
  const raw: any[] = JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
  return raw.map(migrateAnalysis);
}

export function getAnalysisById(id: string): AnalysisResult | null {
  const raw: any[] = JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
  const found = raw.find((a: any) => a.id === id);
  return found ? migrateAnalysis(found) : null;
}
