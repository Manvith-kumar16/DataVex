import type { SignalWithEvidence, ResearchData, EvidenceLevel } from '@/types/analysis';
import { ChevronRight, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  evidenceSignals: SignalWithEvidence[];
  research: ResearchData;
}

const levelConfig: Record<EvidenceLevel, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  verified: { label: 'VERIFIED', cls: 'text-success bg-success/10 border-success/20', Icon: CheckCircle2 },
  inferred: { label: 'INFERRED', cls: 'text-warning bg-warning/10 border-warning/20', Icon: HelpCircle },
  assumed: { label: 'ASSUMED', cls: 'text-muted-foreground bg-muted/30 border-border', Icon: AlertCircle },
};

export function EvidenceSection({ evidenceSignals, research }: Props) {
  const categories = [
    { label: 'Funding Signals', signals: evidenceSignals.filter(s => research.fundingSignals.includes(s.signal)) },
    { label: 'Hiring Signals', signals: evidenceSignals.filter(s => research.hiringSignals.includes(s.signal)) },
    { label: 'Tech Clues', signals: evidenceSignals.filter(s => research.techClues.includes(s.signal)) },
    { label: 'Expansion Signals', signals: evidenceSignals.filter(s => research.expansionSignals.includes(s.signal)) },
  ];

  const counts = { verified: 0, inferred: 0, assumed: 0 };
  evidenceSignals.forEach(s => counts[s.evidence.level]++);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">Evidence & Validation</h3>
        <div className="flex items-center gap-1.5">
          {(['verified', 'inferred', 'assumed'] as EvidenceLevel[]).map(level => (
            <span key={level} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${levelConfig[level].cls}`}>
              {counts[level]} {levelConfig[level].label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.label} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{cat.label}</p>
            {cat.signals.map((s, i) => {
              const cfg = levelConfig[s.evidence.level];
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-muted-foreground flex items-start gap-1.5 cursor-help group">
                      <ChevronRight className="h-3 w-3 text-accent shrink-0 mt-0.5" />
                      <span className="flex-1">{s.signal}</span>
                      <span className={`text-[8px] font-mono px-1 py-0.5 rounded border shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <cfg.Icon className="h-3 w-3" />
                        <span className="text-xs font-semibold">{cfg.label}</span>
                        <span className="text-[10px] text-muted-foreground">Reliability: {Math.round(s.evidence.reliability * 100)}%</span>
                      </div>
                      {s.evidence.source && <p className="text-[10px] text-muted-foreground font-mono">{s.evidence.source}</p>}
                      {s.evidence.snippet && <p className="text-[10px] italic text-muted-foreground">{s.evidence.snippet}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-[11px] text-muted-foreground">
        <strong className="text-foreground">Sources:</strong>{' '}
        {research.rawSources.map((s, i) => (
          <span key={i} className="font-mono">{s}{i < research.rawSources.length - 1 ? ' · ' : ''}</span>
        ))}
      </div>
    </div>
  );
}
