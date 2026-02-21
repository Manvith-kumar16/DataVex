import { useEffect, useState } from 'react';
import { Crosshair } from 'lucide-react';

interface Props {
  riskIndex: number;
  opportunityIndex: number;
  companyName: string;
}

export function RiskOpportunityQuadrant({ riskIndex, opportunityIndex, companyName }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const w = 300, h = 260, pad = 36;
  const plotW = w - pad * 2, plotH = h - pad * 2;
  const x = pad + (riskIndex / 100) * plotW;
  const y = pad + ((100 - opportunityIndex) / 100) * plotH;

  const quadrants = [
    { label: 'Sweet Spot', lx: pad + plotW * 0.25, ly: pad + plotH * 0.25, fill: 'hsl(var(--accent) / 0.06)' },
    { label: 'High Stakes', lx: pad + plotW * 0.75, ly: pad + plotH * 0.25, fill: 'hsl(var(--warning) / 0.06)' },
    { label: 'Safe / Low', lx: pad + plotW * 0.25, ly: pad + plotH * 0.75, fill: 'hsl(var(--info) / 0.04)' },
    { label: 'Avoid', lx: pad + plotW * 0.75, ly: pad + plotH * 0.75, fill: 'hsl(var(--destructive) / 0.06)' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Crosshair className="h-4 w-4 text-accent" />
        <span className="font-display text-sm font-semibold">Risk vs Opportunity</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {quadrants.map((q, i) => (
          <rect key={i} x={i % 2 === 0 ? pad : pad + plotW / 2} y={i < 2 ? pad : pad + plotH / 2} width={plotW / 2} height={plotH / 2} fill={q.fill} rx="2" />
        ))}
        <line x1={pad} y1={pad + plotH / 2} x2={pad + plotW} y2={pad + plotH / 2} stroke="hsl(var(--border))" strokeDasharray="3" />
        <line x1={pad + plotW / 2} y1={pad} x2={pad + plotW / 2} y2={pad + plotH} stroke="hsl(var(--border))" strokeDasharray="3" />
        <rect x={pad} y={pad} width={plotW} height={plotH} fill="none" stroke="hsl(var(--border))" rx="4" />
        {quadrants.map((q, i) => (
          <text key={i} x={q.lx} y={q.ly} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" opacity="0.5" fontWeight="500">{q.label}</text>
        ))}
        <text x={w / 2} y={h - 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9">Risk →</text>
        <text x={8} y={h / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" transform={`rotate(-90, 8, ${h / 2})`}>Opportunity →</text>
        <circle cx={animated ? x : w / 2} cy={animated ? y : h / 2} r="10" fill="hsl(var(--accent))" opacity="0.2" style={{ transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
        <circle cx={animated ? x : w / 2} cy={animated ? y : h / 2} r="5" fill="hsl(var(--accent))" style={{ transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: 'drop-shadow(0 0 6px hsl(var(--accent)))' }} />
        <text x={animated ? x : w / 2} y={(animated ? y : h / 2) - 16} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="10" fontWeight="600" style={{ transition: 'all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>{companyName}</text>
      </svg>
    </div>
  );
}
