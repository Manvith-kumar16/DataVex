import { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnalysisResult } from '@/types/analysis';

interface Props { result: AnalysisResult }

interface Panel {
  label: string;
  score: number;
  weight: string;
  signals: string[];
  confidence: number;
}

export function ExplainableScoring({ result }: Props) {
  const panels: Panel[] = [
    { label: 'Technical Fit', score: result.score.breakdown.technicalFit, weight: '30%', signals: result.technicalFit.matchedServices.map(s => `${s.service}: ${s.reason}`), confidence: result.technicalFit.score * 10 },
    { label: 'Timing', score: result.score.breakdown.timing, weight: '25%', signals: [`Timing Score: ${result.timing.timingScore}/10`, `Funding Momentum: ${result.timing.fundingMomentum}`, `Expansion: ${result.timing.expansionReadiness}`], confidence: result.timing.timingScore * 10 },
    { label: 'Budget', score: result.score.breakdown.budget, weight: '20%', signals: [`Budget Confidence: ${result.timing.budgetConfidence}`, `Budget Strength: ${result.timing.budgetStrength}/10`, ...result.research.fundingSignals.slice(0, 2)], confidence: result.timing.budgetStrength * 10 },
    { label: 'Urgency', score: result.score.breakdown.urgency, weight: '15%', signals: [`Urgency Index: ${result.timing.urgencyIndex}/10`, ...result.research.hiringSignals.slice(0, 2)], confidence: result.timing.urgencyIndex * 10 },
    { label: 'Market Position', score: result.score.breakdown.marketPosition, weight: '10%', signals: [`Industry Pressure: ${result.market.industryPressure}/10`, `Innovation Urgency: ${result.market.innovationUrgency}/10`, `Competitive Risk: ${result.market.competitiveRisk}/10`], confidence: result.market.marketPositionScore * 10 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" />
        <span className="font-display text-sm font-semibold">Explainable Scoring</span>
      </div>
      {panels.map(p => <ScoringPanel key={p.label} panel={p} />)}
    </div>
  );
}

function ScoringPanel({ panel }: { panel: Panel }) {
  const [open, setOpen] = useState(false);
  const color = panel.score >= 70 ? 'text-accent' : panel.score >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors">
        <span className={`font-mono text-sm font-bold w-8 ${color}`}>{panel.score}</span>
        <span className="text-xs font-medium flex-1 text-left">{panel.label}</span>
        <span className="text-[10px] text-muted-foreground/50">×{panel.weight}</span>
        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent/60" style={{ width: `${panel.score}%` }} />
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border overflow-hidden">
            <div className="p-3 space-y-1.5 bg-secondary/10">
              {panel.signals.map((s, i) => (
                <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                  <span className="text-accent mt-0.5">›</span>{s}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Component Confidence:</span>
                <span className="text-[10px] font-mono text-accent">{panel.confidence}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
