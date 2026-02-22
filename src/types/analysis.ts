export interface ResearchData {
  industry: string;
  companyName: string;
  domain: string;
  description: string;
  employeeCount: string;
  fundingSignals: string[];
  hiringSignals: string[];
  techClues: string[];
  expansionSignals: string[];
  rawSources: string[];
}

export interface SignalData {
  fundingStage: string;
  hiringVelocity: number;
  growthPhase: string;
  digitalTransformationSignals: string[];
  technicalDebtSignals: string[];
}

export interface TechnicalFitData {
  score: number;
  matchedServices: { service: string; relevance: number; reason: string; isMatch: boolean; detailedExplanation: string }[];
  riskSummary: string;
}

export interface TimingData {
  timingScore: number;
  budgetStrength: number;
  urgencyIndex: number;
  budgetConfidence: string;
  fundingMomentum: string;
  expansionReadiness: string;
}

export interface MarketData {
  marketPositionScore: number;
  industryPressure: number;
  innovationUrgency: number;
  competitiveRisk: number;
  strategicAlignment: number;
}

export interface ScoreData {
  leadScore: number;
  category: 'Hot' | 'Warm' | 'Cold';
  confidence: number;
  breakdown: {
    technicalFit: number;
    timing: number;
    budget: number;
    urgency: number;
    marketPosition: number;
  };
}

export interface DebateEntry {
  agent: string;
  position: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface DebateData {
  entries: DebateEntry[];
  resolution: string;
  agreementPercent: number;
}

export interface VerdictData {
  action: 'Pursue' | 'Nurture' | 'Skip' | 'Isolate';
  whyNow: string;
  riskFactors: string[];
  confidence: number;
  isIsolated?: boolean;
  isolationCategory?: string;
  isolationExplanation?: string;
}

export interface OutreachData {
  decisionMakerPersona: string;
  email: string;
  linkedin: string;
  coldCall: string;
  valueProposition: string;
}

export type EvidenceLevel = 'verified' | 'inferred' | 'assumed';

export interface EvidenceTag {
  level: EvidenceLevel;
  source?: string;
  snippet?: string;
  timestamp: string;
  reliability: number;
}

export interface SignalWithEvidence {
  signal: string;
  evidence: EvidenceTag;
}

export interface ConfidenceData {
  overall: number;
  dataCompleteness: number;
  agentAgreement: number;
  evidenceStrength: number;
  alignmentIndex?: number;
  alignmentRisk?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  modifiers: {
    technicalFit?: number;
    timing?: number;
    budget?: number;
    urgency?: number;
    marketPosition?: number;
  };
}

export interface AnalysisResult {
  id: string;
  domain: string;
  timestamp: string;
  research: ResearchData;
  signals: SignalData;
  technicalFit: TechnicalFitData;
  timing: TimingData;
  market: MarketData;
  score: ScoreData;
  debate: DebateData;
  verdict: VerdictData;
  outreach: OutreachData;
  confidence: ConfidenceData;
  evidenceSignals: SignalWithEvidence[];
  riskIndex: number;
  opportunityIndex: number;
}

export interface AgentStep {
  agent: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
}

export interface ScoreBreakdown {
  technical: number;
  financial: number;
  market: number;
  finalScore: number;
  weights: {
    technical: number;
    financial: number;
    market: number;
  };
}

export interface AgentOutput {
  agentName: string;
  score: number;
  insights: string[];
  risks?: string[];
  metadata?: Record<string, any>;
}

export interface Signal {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  source: string;
}

export interface StructuredSignal {
  id: string;
  type: string;
  signal: string;
  confidence: number;
}

export interface DebateMessage {
  agent: string;
  content: string;
  timestamp: string;
}

export interface MemoryConfidenceData {
  overall: number;
  breakdown: {
    dataCompleteness: number;
    agentAgreement: number;
    evidenceReliability: number;
  };
  alignmentIndex?: number;
  alignmentRisk?: string;
}

export interface ExecutionMeta {
  startedAt: number;
  completedAt?: number;
  retries: number;
  timings?: Record<string, number>;
  attempts?: Record<string, number>;
}

export interface SharedMemory {
  id?: string;
  domain: string;
  timestamp?: string;
  research?: ResearchData;
  rawSignals: Signal[];
  structuredSignals: StructuredSignal[];
  agentOutputs: Record<string, AgentOutput>;
  scoreBreakdown: ScoreBreakdown;
  debateLog: DebateMessage[];
  confidenceMetrics: MemoryConfidenceData;
  executionMeta?: ExecutionMeta;
  confidence?: ConfidenceData;
}
