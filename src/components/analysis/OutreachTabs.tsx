import { useState } from 'react';
import { Mail, Linkedin, Phone, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OutreachData } from '@/types/analysis';

interface OutreachTabsProps {
  outreach: OutreachData;
}

const tabs = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'coldCall', label: 'Cold Call', icon: Phone },
] as const;

export function OutreachTabs({ outreach }: OutreachTabsProps) {
  const [activeTab, setActiveTab] = useState<string>('email');
  const [copied, setCopied] = useState(false);

  const content: Record<string, string> = {
    email: outreach.email,
    linkedin: outreach.linkedin,
    coldCall: outreach.coldCall,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all flex-1 justify-center ${activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="bg-secondary/30 rounded-md p-4 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
          {content[activeTab]}
        </div>
        <Button
          variant="surface"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 text-[10px] gap-1"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div className="bg-accent/5 border border-accent/10 rounded-md p-3">
        <p className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Target Persona</p>
        <p className="text-xs text-muted-foreground">{outreach.decisionMakerPersona}</p>
      </div>
    </div>
  );
}
