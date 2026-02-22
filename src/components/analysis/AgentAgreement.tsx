import type { DebateData } from '@/types/analysis';
import { Users } from 'lucide-react';

interface Props { debate: DebateData }

const sentimentColor = { positive: 'bg-success', neutral: 'bg-warning', negative: 'bg-destructive' };
const sentimentLabel = { positive: 'Aligned', neutral: 'Uncertain', negative: 'Opposed' };

export function AgentAgreement({ debate }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-semibold">Agent Alignment</span>
        </div>
        <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">{debate.agreementPercent}%</span>
      </div>
      <div className="space-y-3">
        {debate.entries.map(entry => (
          <div key={entry.agent} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">{entry.agent}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${entry.sentiment === 'positive' ? 'bg-success/10 text-success' :
                    entry.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                  }`}>{sentimentLabel[entry.sentiment]}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{entry.confidence}%</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${sentimentColor[entry.sentiment]}`} style={{ width: `${entry.confidence}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
