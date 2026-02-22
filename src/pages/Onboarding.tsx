import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, Target, Users, Briefcase, Sparkles, BarChart3, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const roles = [
  { id: 'SDR', label: 'SDR / BDR', desc: 'Prospecting & qualifying leads', icon: Target },
  { id: 'Founder', label: 'Founder / CEO', desc: 'Strategic growth decisions', icon: Briefcase },
  { id: 'Sales Lead', label: 'Sales Lead', desc: 'Managing sales pipeline', icon: Users },
];

const features = [
  { icon: Sparkles, title: 'Multi-Agent Research', desc: 'Nine specialized AI agents analyze every prospect autonomously.' },
  { icon: BarChart3, title: 'Intelligent Scoring', desc: 'Weighted scoring engine with explainable breakdowns.' },
  { icon: MessageSquare, title: 'Agent Debate', desc: 'Agents disagree and resolve conflicts for higher accuracy.' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('');
  const { updateRole } = useAuth();
  const navigate = useNavigate();

  const finish = () => {
    if (selectedRole) updateRole(selectedRole);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 gradient-mesh">
      <div className="absolute inset-0 bg-background/70" />
      <motion.div
        className="relative z-10 w-full max-w-lg p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border border-accent/20 glow-aura"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/30 shadow-accent overflow-hidden">
                  <img src="/favicon.ico" alt="Datavex.ai Logo" className="h-7 w-7 object-contain" />
                </div>
              </div>
              <h1 className="font-display text-3xl font-bold">Welcome to Datavex.ai</h1>
              <p className="text-muted-foreground leading-relaxed">
                Your autonomous enterprise intelligence engine. Let's get you set up in 30 seconds.
              </p>
              <Button variant="neon" onClick={() => setStep(1)} className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="font-display text-2xl font-bold">What's your role?</h2>
              <p className="text-sm text-muted-foreground">This helps us tailor your experience.</p>
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedRole === role.id
                      ? 'border-accent bg-accent/5 glow-neon'
                      : 'border-border bg-secondary/30 hover:border-muted-foreground/30'
                      }`}
                  >
                    <role.icon className={`h-5 w-5 ${selectedRole === role.id ? 'text-accent' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground">{role.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button variant="neon" onClick={() => setStep(2)} disabled={!selectedRole} className="gap-2">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="font-display text-2xl font-bold">How it works</h2>
              <div className="space-y-3">
                {features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border"
                  >
                    <f.icon className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="neon" onClick={finish} className="gap-2">
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
