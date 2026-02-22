import type { AnalysisResult, AgentStep, Scenario, ScoreData } from '@/types/analysis';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * runAnalysis — Now a secure proxy to the production AI backend.
 * 
 * This replaces the legacy frontend-orchestration logic. 
 * All agents, search providers, and secret keys now live 
 * safely in the /server directory.
 */
export async function runAnalysis(
  domain: string,
  onProgress: (steps: AgentStep[]) => void
): Promise<AnalysisResult> {
  console.time("analysis_backend");

  // Simulate standard pipeline steps for UI progress feedback
  const INITIAL_STEPS: AgentStep[] = [
    { agent: 'Initializing Secure Pipeline', status: 'running', progress: 10 },
    { agent: 'Researching Domain', status: 'pending', progress: 0 },
    { agent: 'Analyzing Signals', status: 'pending', progress: 0 },
    { agent: 'Scoring Lead', status: 'pending', progress: 0 },
    { agent: 'Generating Verdict', status: 'pending', progress: 0 }
  ];
  onProgress(INITIAL_STEPS);

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a minute.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Backend error: ${response.status}`);
    }

    const result = await response.json();

    // Finalize UI progress
    onProgress(INITIAL_STEPS.map(s => ({ ...s, status: 'complete', progress: 100 })));

    console.timeEnd("analysis_backend");
    return result;
  } catch (error) {
    console.error('[runAnalysis] Error calling backend:', error);
    throw error;
  }
}

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

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

// Memory getters
export function saveAnalysis(result: AnalysisResult) {
  const stored: AnalysisResult[] = JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
  stored.unshift(result);
  localStorage.setItem('vexintel_analyses', JSON.stringify(stored.slice(0, 20)));
}

export function getRecentAnalyses(): AnalysisResult[] {
  return JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
}

export function getAnalysisById(id: string): AnalysisResult | null {
  const raw: AnalysisResult[] = JSON.parse(localStorage.getItem('vexintel_analyses') || '[]');
  return raw.find((a) => a.id === id) || null;
}
