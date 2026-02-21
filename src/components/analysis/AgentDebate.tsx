import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageSquare, CheckCircle2, AlertTriangle, MinusCircle } from 'lucide-react';
import type { DebateData } from '@/types/analysis';

interface AgentDebateProps {
  debate: DebateData;
}

const sentimentIcon = {
  positive: <CheckCircle2 className="h-4 w-4 text-success" />,
  negative: <AlertTriangle className="h-4 w-4 text-destructive" />,
  neutral: <MinusCircle className="h-4 w-4 text-warning" />,
};

const sentimentBorder = {
  positive: 'border-l-success',
  negative: 'border-l-destructive',
  neutral: 'border-l-warning',
};

export function AgentDebate({ debate }: AgentDebateProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <h3 className="font-display font-semibold text-sm">Agent Debate Trace</h3>
          <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded">
            {debate.agreementPercent}% agreement
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {debate.entries.map((entry, i) => (
              <motion.div
                key={entry.agent}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`border-l-2 ${sentimentBorder[entry.sentiment]} bg-secondary/50 rounded-r-md p-3`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {sentimentIcon[entry.sentiment]}
                  <span className="text-xs font-semibold">{entry.agent}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">{entry.confidence}% conf.</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{entry.position}</p>
              </motion.div>
            ))}

            <div className="bg-accent/5 border border-accent/20 rounded-md p-3 mt-3">
              <p className="text-xs font-semibold text-accent mb-1">Orchestrator Resolution</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{debate.resolution}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
