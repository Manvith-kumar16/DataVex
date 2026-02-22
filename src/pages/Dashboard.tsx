import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, MobileHeader } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRecentAnalyses } from '@/lib/agents';
import { debounce } from '@/lib/utils';
import type { AnalysisResult } from '@/types/analysis';
import { Search, ArrowRight, Globe, Clock, TrendingUp, Zap, BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [recent, setRecent] = useState<AnalysisResult[]>([]);

  // We should debounce the input change, or debounce the analysis. The easiest is adding an intermediate state.
  // Actually, standard usage of debounce on an input:
  const setDomainDebounced = debounce((val: string) => setDomain(val), 300);

  useEffect(() => {
    setRecent(getRecentAnalyses());
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    navigate(`/analysis?domain=${encodeURIComponent(domain.trim())}`);
  };

  const categoryColor = (cat: string) =>
    cat === 'Hot' ? 'text-accent bg-accent/10' : cat === 'Warm' ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />

      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
            <h1 className="font-display text-2xl font-bold">
              Welcome back, <span className="text-gradient-neon">{user?.name}</span>
            </h1>
            <p className="text-sm text-muted-foreground">Enter a company domain to begin autonomous analysis.</p>
          </motion.div>

          {/* Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/30 backdrop-blur-md border border-accent/20 rounded-[2rem] p-8 glow-aura"
          >
            <form onSubmit={handleAnalyze} className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  defaultValue={domain}
                  onChange={e => setDomainDebounced(e.target.value)}
                  placeholder="company.com"
                  className="pl-9 bg-secondary border-border h-11"
                />
              </div>
              <Button type="submit" variant="neon" className="gap-2 h-11 px-6">
                <Search className="h-4 w-4" />
                Analyze
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground mt-3">
              Enter any company domain — 9 agents will autonomously research, score, and generate strategic outreach.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {[
              { label: 'Analyses Run', value: recent.length, icon: BarChart3 },
              { label: 'Hot Leads', value: recent.filter(r => r.score.category === 'Hot').length, icon: Zap },
              { label: 'Avg. Score', value: recent.length ? Math.round(recent.reduce((s, r) => s + r.score.leadScore, 0) / recent.length) : '—', icon: Target },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-display font-bold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Recent Analyses */}
          {recent.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Analyses
              </h2>
              <div className="space-y-2">
                {recent.slice(0, 5).map((analysis, i) => (
                  <motion.button
                    key={analysis.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={() => navigate(`/analysis?id=${analysis.id}`)}
                    className="w-full flex items-center gap-4 bg-card/20 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-accent/40 hover:glow-aura transition-all group text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-sm text-accent">
                      {analysis.score.leadScore}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{analysis.research.companyName}</p>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${categoryColor(analysis.score.category)}`}>
                          {analysis.score.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {analysis.domain} · {analysis.research.industry} · {analysis.verdict.action}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
