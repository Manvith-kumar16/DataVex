import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { Suspense, lazy } from 'react';
const ScoreGauge = lazy(() => import('@/components/analysis/ScoreGauge').then(module => ({ default: module.ScoreGauge })));
const AgentDebate = lazy(() => import('@/components/analysis/AgentDebate').then(module => ({ default: module.AgentDebate })));
const OutreachTabs = lazy(() => import('@/components/analysis/OutreachTabs').then(module => ({ default: module.OutreachTabs })));
const ConfidenceEngine = lazy(() => import('@/components/analysis/ConfidenceEngine').then(module => ({ default: module.ConfidenceEngine })));
const ExplainableScoring = lazy(() => import('@/components/analysis/ExplainableScoring').then(module => ({ default: module.ExplainableScoring })));
const AgentAgreement = lazy(() => import('@/components/analysis/AgentAgreement').then(module => ({ default: module.AgentAgreement })));
const RiskOpportunityQuadrant = lazy(() => import('@/components/analysis/RiskOpportunityQuadrant').then(module => ({ default: module.RiskOpportunityQuadrant })));
const ScenarioSimulator = lazy(() => import('@/components/analysis/ScenarioSimulator').then(module => ({ default: module.ScenarioSimulator })));
const EvidenceSection = lazy(() => import('@/components/analysis/EvidenceSection').then(module => ({ default: module.EvidenceSection })));
import { runAnalysis, saveAnalysis, getAnalysisById, applyScenarios } from '@/lib/agents';
import { exportAnalysisPDF as exportReport } from '@/lib/pdfExport';
import type { AnalysisResult, AgentStep } from '@/types/analysis';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, RefreshCw, Loader2, Globe, Users, Building2,
  AlertTriangle, CheckCircle2, Shield, Zap, ExternalLink,
  Cpu, Timer, DollarSign, BarChart3, Download, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Analysis() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const domainParam = params.get('domain');
  const idParam = params.get('id');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);

  const startAnalysis = useCallback(async (domain: string) => {
    setAnalyzing(true);
    setError('');
    setResult(null);
    setActiveScenarios([]);
    try {
      const res = await runAnalysis(domain, setSteps);
      saveAnalysis(res);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (idParam) {
      const stored = getAnalysisById(idParam);
      if (stored) setResult(stored);
      else setError('Analysis not found');
    } else if (domainParam) {
      startAnalysis(domainParam);
    }
  }, [domainParam, idParam, startAnalysis]);

  const modifiedScore = useMemo(() => {
    if (!result) return null;
    return applyScenarios(result.score, activeScenarios);
  }, [result, activeScenarios]);

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const displayScore = modifiedScore || result?.score;

  const verdictColor = (action: string) =>
    action === 'Pursue' ? 'text-accent bg-accent/10 border-accent/20' :
      action === 'Nurture' ? 'text-warning bg-warning/10 border-warning/20' :
        'text-destructive bg-destructive/10 border-destructive/20';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="p-6 sm:p-8 max-w-6xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {result && (
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="surface" size="sm" onClick={() => exportReport(result)} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
                <Button
                  variant="surface" size="sm"
                  onClick={() => startAnalysis(result.domain)}
                  disabled={analyzing}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} /> Re-run
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          <AnimatePresence>
            {analyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-card border border-border rounded-xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                  <div>
                    <h2 className="font-display font-semibold">Analyzing {domainParam}</h2>
                    <p className="text-xs text-muted-foreground">Running multi-agent intelligence pipeline...</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.agent} className="flex items-center gap-3">
                      <div className="w-5 flex justify-center">
                        {step.status === 'complete' ? <CheckCircle2 className="h-4 w-4 text-accent" /> : step.status === 'running' ? <Loader2 className="h-4 w-4 text-accent animate-spin" /> : <div className="h-2 w-2 rounded-full bg-border" />}
                      </div>
                      <span className={`text-xs ${step.status === 'complete' ? 'text-foreground' : step.status === 'running' ? 'text-accent' : 'text-muted-foreground'}`}>{step.agent}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && !analyzing && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="surface" size="sm" onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
            </div>
          )}

          {/* Results */}
          {result && !analyzing && displayScore && (
            <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-6 w-6 text-accent animate-spin" /></div>}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                {/* Enterprise Isolation Banner */}
                {result.verdict.isIsolated && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-accent/5 border border-accent/20 rounded-xl p-8 mb-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <Shield className="h-6 w-6 text-accent" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="font-display text-xl font-bold flex items-center gap-2">
                          🚫 Enterprise Self-Sufficient Organization
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          This company operates at enterprise scale with significant internal AI, DevOps, and digital transformation capabilities.
                          External service acquisition for core infrastructure is strategically unlikely.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-accent/10 text-accent rounded-md">
                            Category: {result.verdict.isolationCategory || result.research.industry}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-warning/10 text-warning rounded-md">
                            Suggested Action: Skip
                          </span>
                        </div>
                        <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50 text-xs italic text-muted-foreground">
                          "Strategic Reasoning: {result.verdict.isolationExplanation || result.verdict.whyNow}"
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-2xl font-bold">{result.research.companyName}</h1>
                      <span className={`text-xs font-mono px-2 py-1 rounded-md border ${verdictColor(result.verdict.action)}`}>{result.verdict.action}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Globe className="h-3.5 w-3.5" /> {result.domain}
                      <span className="text-border">·</span>
                      {result.research.industry}
                      <span className="text-border">·</span>
                      <Users className="h-3.5 w-3.5" /> {result.research.employeeCount}
                    </p>
                  </div>
                </div>

                {/* Score + Confidence Row */}
                {!result.verdict.isIsolated && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-display text-sm font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-accent" /> Lead Score
                      </h3>
                      <ScoreGauge
                        score={displayScore.leadScore}
                        previousScore={activeScenarios.length > 0 ? result.score.leadScore : undefined}
                      />
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                      <ConfidenceEngine confidence={result.confidence} />
                    </div>
                  </div>
                )}

                {/* Why Now + Risk Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" /> Why Now
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.verdict.whyNow}</p>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Risk Factors</p>
                      <ul className="space-y-1">
                        {result.verdict.riskFactors.map((r, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-warning shrink-0 mt-0.5" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6">
                    <RiskOpportunityQuadrant riskIndex={result.riskIndex} opportunityIndex={result.opportunityIndex} companyName={result.research.companyName} />
                  </div>
                </div>

                {/* Agent Scores Row */}
                {!result.verdict.isIsolated && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Technical Fit', value: result.technicalFit.score, max: 10, icon: Cpu },
                      { label: 'Timing', value: result.timing.timingScore, max: 10, icon: Timer },
                      { label: 'Budget', value: result.timing.budgetStrength, max: 10, icon: DollarSign },
                      { label: 'Market Position', value: result.market.marketPositionScore, max: 10, icon: TrendingUp },
                    ].map(item => (
                      <div key={item.label} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{item.label}</span>
                        </div>
                        <p className="font-display text-2xl font-bold">{item.value}<span className="text-sm text-muted-foreground">/{item.max}</span></p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explainable Scoring + Agent Agreement */}
                {!result.verdict.isIsolated && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-6">
                      <ExplainableScoring result={result} />
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                      <AgentAgreement debate={result.debate} />
                    </div>
                  </div>
                )}

                {/* Scenario Simulator */}
                {!result.verdict.isIsolated && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <ScenarioSimulator
                      originalScore={result.score}
                      modifiedScore={displayScore}
                      activeScenarios={activeScenarios}
                      onToggle={toggleScenario}
                    />
                  </div>
                )}

                {/* Services Match */}
                {!result.verdict.isIsolated && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-accent" /> Matched DataVex Services
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.technicalFit.matchedServices.map(svc => (
                        <div key={svc.service} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                          <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center text-xs font-mono font-bold text-accent">{svc.relevance}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{svc.service}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{svc.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-2.5">
                      <strong className="text-foreground">Risk Summary:</strong> {result.technicalFit.riskSummary}
                    </p>
                  </div>
                )}

                {/* Debate */}
                {!result.verdict.isIsolated && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <AgentDebate debate={result.debate} />
                  </div>
                )}

                {/* Outreach */}
                {!result.verdict.isIsolated && (
                  <div className="bg-card border border-border rounded-xl p-6 space-y-3">
                    <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-accent" /> Outreach Strategy
                    </h3>
                    <OutreachTabs outreach={result.outreach} />
                    <div className="bg-secondary/30 rounded-md p-3">
                      <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Value Proposition</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{result.outreach.valueProposition}</p>
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {!result.verdict.isIsolated && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <EvidenceSection evidenceSignals={result.evidenceSignals} research={result.research} />
                  </div>
                )}
              </motion.div>
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
