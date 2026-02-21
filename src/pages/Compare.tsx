import { useState, useEffect } from 'react';
import { getRecentAnalyses } from '@/lib/agents';
import type { AnalysisResult } from '@/types/analysis';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCompareArrows } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Compare() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');

  useEffect(() => { setAnalyses(getRecentAnalyses()); }, []);

  const left = analyses.find(a => a.id === leftId);
  const right = analyses.find(a => a.id === rightId);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-accent" /> Lead Comparison
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select first lead..." /></SelectTrigger>
              <SelectContent>
                {analyses.filter(a => a.id !== rightId).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.research.companyName} ({a.score.leadScore})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select second lead..." /></SelectTrigger>
              <SelectContent>
                {analyses.filter(a => a.id !== leftId).map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.research.companyName} ({a.score.leadScore})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {left && right ? <ComparisonGrid left={left} right={right} /> : (
            <div className="text-center py-20 text-muted-foreground text-sm">
              {analyses.length < 2 ? 'Run at least two analyses to compare leads.' : 'Select two leads above to compare.'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ComparisonGrid({ left, right }: { left: AnalysisResult; right: AnalysisResult }) {
  const rows = [
    { label: 'Lead Score', l: left.score.leadScore, r: right.score.leadScore },
    { label: 'Confidence', l: left.confidence.overall, r: right.confidence.overall },
    { label: 'Technical Fit', l: left.technicalFit.score * 10, r: right.technicalFit.score * 10 },
    { label: 'Timing', l: left.timing.timingScore * 10, r: right.timing.timingScore * 10 },
    { label: 'Budget', l: left.timing.budgetStrength * 10, r: right.timing.budgetStrength * 10 },
    { label: 'Market Position', l: left.market.marketPositionScore * 10, r: right.market.marketPositionScore * 10 },
    { label: 'Agreement', l: left.debate.agreementPercent, r: right.debate.agreementPercent },
    { label: 'Risk', l: left.riskIndex, r: right.riskIndex, inverted: true },
    { label: 'Opportunity', l: left.opportunityIndex, r: right.opportunityIndex },
  ];

  const cc = (cat: string) => cat === 'Hot' ? 'text-accent' : cat === 'Warm' ? 'text-warning' : 'text-destructive';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div />
        {[left, right].map(a => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="font-display font-bold text-sm">{a.research.companyName}</p>
            <p className="text-[11px] text-muted-foreground">{a.domain}</p>
            <p className={`text-2xl font-display font-bold mt-2 ${cc(a.score.category)}`}>{a.score.leadScore}</p>
            <p className="text-[10px] text-muted-foreground">{a.score.category} · {a.verdict.action}</p>
          </div>
        ))}
      </div>

      {rows.map(row => {
        const lWins = row.inverted ? row.l < row.r : row.l > row.r;
        const rWins = row.inverted ? row.r < row.l : row.r > row.l;
        return (
          <div key={row.label} className="grid grid-cols-3 gap-4 items-center">
            <p className="text-xs text-muted-foreground text-right">{row.label}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.l}%`, backgroundColor: lWins ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))' }} />
              </div>
              <span className={`text-xs font-mono w-8 text-right ${lWins ? 'text-accent' : 'text-muted-foreground'}`}>{row.l}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono w-8 ${rWins ? 'text-accent' : 'text-muted-foreground'}`}>{row.r}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.r}%`, backgroundColor: rWins ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))' }} />
              </div>
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-2 gap-4">
        {[left, right].map(a => (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-2">Why Now</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{a.verdict.whyNow}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
