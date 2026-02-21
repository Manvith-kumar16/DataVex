import type { ConfidenceData } from '@/types/analysis';
import { ShieldCheck } from 'lucide-react';

interface Props { confidence: ConfidenceData }

const items = [
  { key: 'dataCompleteness' as const, label: 'Data Completeness', weight: '40%' },
  { key: 'agentAgreement' as const, label: 'Agent Agreement', weight: '30%' },
  { key: 'evidenceStrength' as const, label: 'Evidence Strength', weight: '30%' },
];

export function ConfidenceEngine({ confidence }: Props) {
  const color = confidence.overall >= 70 ? 'hsl(var(--accent))' : confidence.overall >= 45 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-semibold">Confidence Engine</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold" style={{ color }}>{confidence.overall}</span>
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${confidence.overall}%`, backgroundColor: color }} />
      </div>
      <div className="space-y-2.5">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-32 shrink-0">{item.label}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-accent/60 transition-all duration-1000" style={{ width: `${confidence[item.key]}%` }} />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">{confidence[item.key]}%</span>
            <span className="text-[9px] text-muted-foreground/40 w-7">×{item.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
