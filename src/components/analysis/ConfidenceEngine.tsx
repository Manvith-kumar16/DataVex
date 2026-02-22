import type { ConfidenceData } from '@/types/analysis';
import { ShieldCheck, Database, Users2, FileSearch, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props { confidence: ConfidenceData }

const items = [
  { key: 'dataCompleteness' as const, label: 'Data Completeness', icon: Database, weight: '40%' },
  { key: 'agentAgreement' as const, label: 'Agent Agreement', icon: Users2, weight: '30%' },
  { key: 'evidenceStrength' as const, label: 'Evidence Strength', icon: FileSearch, weight: '30%' },
];

export function ConfidenceEngine({ confidence }: Props) {
  const getScoreInfo = (score: number) => {
    if (score >= 70) return { color: 'hsl(var(--accent))', colorClass: 'text-accent', bgClass: 'bg-accent', glow: 'shadow-[0_0_15px_hsl(var(--accent)/0.3)]' };
    if (score >= 45) return { color: 'hsl(var(--warning))', colorClass: 'text-warning', bgClass: 'bg-warning', glow: 'shadow-[0_0_15px_hsl(var(--warning)/0.3)]' };
    return { color: 'hsl(var(--destructive))', colorClass: 'text-destructive', bgClass: 'bg-destructive', glow: 'shadow-[0_0_15px_hsl(var(--destructive)/0.3)]' };
  };

  const overall = getScoreInfo(confidence.overall);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <span className="font-display text-sm font-bold block tracking-tight">Confidence Engine</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Real-time Validity Check</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`font-display text-4xl font-extrabold tracking-tighter ${overall.colorClass}`}
            >
              {confidence.overall}
            </motion.span>
            <span className="text-sm font-bold text-muted-foreground/60">%</span>
          </div>
        </div>
      </div>

      <div className="relative h-3 bg-secondary/30 backdrop-blur-sm rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence.overall}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ backgroundColor: overall.color }}
          className={`h-full rounded-full ${overall.glow} relative`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:40px_40px] animate-shimmer" />
        </motion.div>
      </div>

      <div className="grid gap-3">
        {items.map((item, idx) => {
          const score = confidence[item.key];
          const info = getScoreInfo(score);

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-2">
                  <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold ${info.colorClass}`}>{score}%</span>
                  <span className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-tighter">W: {item.weight}</span>
                </div>
              </div>
              <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.2, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                  style={{ backgroundColor: info.color }}
                  className="h-full rounded-full opacity-60 group-hover:opacity-100 transition-all"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="pt-2 flex items-center gap-2 text-[9px] text-muted-foreground/60 italic border-t border-border/20">
        <HelpCircle className="h-2.5 w-2.5" />
        Probability of enterprise-grade accuracy based on evidence density.
      </div>
    </div>
  );
}
