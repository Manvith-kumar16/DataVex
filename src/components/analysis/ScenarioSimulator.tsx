import { Switch } from '@/components/ui/switch';
import { SCENARIOS } from '@/lib/agents';
import type { ScoreData } from '@/types/analysis';
import { Sliders, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  originalScore: ScoreData;
  modifiedScore: ScoreData;
  activeScenarios: string[];
  onToggle: (id: string) => void;
}

export function ScenarioSimulator({ originalScore, modifiedScore, activeScenarios, onToggle }: Props) {
  const diff = modifiedScore.leadScore - originalScore.leadScore;
  const hasChanges = activeScenarios.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-accent" />
          <span className="font-display text-sm font-semibold">Scenario Simulator</span>
        </div>
        {hasChanges && (
          <div className={`flex items-center gap-1 text-xs font-mono ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
            {diff > 0 ? '+' : ''}{diff} pts
          </div>
        )}
      </div>
      <div className="space-y-2">
        {SCENARIOS.map(scenario => {
          const isActive = activeScenarios.includes(scenario.id);
          const net = Object.values(scenario.modifiers).reduce<number>((s, v) => s + (v || 0), 0);
          return (
            <div key={scenario.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isActive ? 'border-accent/30 bg-accent/5' : 'border-border bg-secondary/20'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{scenario.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{scenario.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-mono ${net > 0 ? 'text-success' : 'text-destructive'}`}>{net > 0 ? '+' : ''}{net}</span>
                <Switch checked={isActive} onCheckedChange={() => onToggle(scenario.id)} />
              </div>
            </div>
          );
        })}
      </div>
      {hasChanges && (
        <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-lg p-3">
          <span className="text-xs text-accent font-medium">Modified Score</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground line-through">{originalScore.leadScore}</span>
            <span className="font-display text-lg font-bold text-accent">{modifiedScore.leadScore}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${modifiedScore.category === 'Hot' ? 'bg-accent/10 text-accent' : modifiedScore.category === 'Warm' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>{modifiedScore.category}</span>
          </div>
        </div>
      )}
    </div>
  );
}
