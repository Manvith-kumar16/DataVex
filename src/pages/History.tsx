import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { getRecentAnalyses } from '@/lib/agents';
import type { AnalysisResult } from '@/types/analysis';
import { Clock, ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

export default function History() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setAnalyses(getRecentAnalyses());
  }, []);

  const filtered = analyses.filter(a =>
    a.domain.toLowerCase().includes(filter.toLowerCase()) ||
    a.research.companyName.toLowerCase().includes(filter.toLowerCase())
  );

  const categoryColor = (cat: string) =>
    cat === 'Hot' ? 'text-accent bg-accent/10' : cat === 'Warm' ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" /> History
            </h1>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter analyses..."
                className="pl-8 h-9 bg-secondary border-border text-sm"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No analyses found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a, i) => (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/analysis?id=${a.id}`)}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-all group text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-sm text-accent">
                    {a.score.leadScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.research.companyName}</p>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${categoryColor(a.score.category)}`}>
                        {a.score.category}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground`}>
                        {a.verdict.action}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.domain} · {a.research.industry} · {a.score.confidence}% confidence
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
