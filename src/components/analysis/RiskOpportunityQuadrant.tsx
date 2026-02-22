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
    { label: 'Sweet Spot', lx: pad + plotW * 0.25, ly: pad + plotH * 0.25, color: 'var(--accent)', grad: 'grad-sweet' },
    { label: 'High Stakes', lx: pad + plotW * 0.75, ly: pad + plotH * 0.25, color: 'var(--warning)', grad: 'grad-stakes' },
    { label: 'Safe / Low', lx: pad + plotW * 0.25, ly: pad + plotH * 0.75, color: 'var(--info)', grad: 'grad-safe' },
    { label: 'Avoid', lx: pad + plotW * 0.75, ly: pad + plotH * 0.75, color: 'var(--destructive)', grad: 'grad-avoid' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <Crosshair className="h-4 w-4 text-accent" />
          </div>
          <span className="font-display text-sm font-bold tracking-tight">Risk vs Opportunity</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible select-none">
        <defs>
          <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feFlood floodColor="hsl(var(--accent))" floodOpacity="0.5" result="offsetColor" />
            <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="grad-sweet" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 130) rotate(135) scale(150)">
            <stop stopColor="hsl(var(--accent) / 0.15)" />
            <stop offset="1" stopColor="hsl(var(--accent) / 0)" />
          </radialGradient>
          <radialGradient id="grad-stakes" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 130) rotate(45) scale(150)">
            <stop stopColor="hsl(var(--warning) / 0.12)" />
            <stop offset="1" stopColor="hsl(var(--warning) / 0)" />
          </radialGradient>
          <radialGradient id="grad-safe" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 130) rotate(-135) scale(150)">
            <stop stopColor="hsl(var(--info) / 0.1)" />
            <stop offset="1" stopColor="hsl(var(--info) / 0)" />
          </radialGradient>
          <radialGradient id="grad-avoid" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 130) rotate(-45) scale(150)">
            <stop stopColor="hsl(var(--destructive) / 0.12)" />
            <stop offset="1" stopColor="hsl(var(--destructive) / 0)" />
          </radialGradient>
        </defs>

        {/* Background Gradients */}
        {quadrants.map((q, i) => (
          <rect
            key={i}
            x={i % 2 === 0 ? pad : pad + plotW / 2}
            y={i < 2 ? pad : pad + plotH / 2}
            width={plotW / 2}
            height={plotH / 2}
            fill={`url(#${q.grad})`}
            className="transition-opacity duration-1000"
          />
        ))}

        {/* Grid Lines */}
        <line x1={pad} y1={pad + plotH / 2} x2={pad + plotW} y2={pad + plotH / 2} stroke="hsl(var(--accent) / 0.15)" strokeDasharray="4 4" />
        <line x1={pad + plotW / 2} y1={pad} x2={pad + plotW / 2} y2={pad + plotH} stroke="hsl(var(--accent) / 0.15)" strokeDasharray="4 4" />
        <rect x={pad} y={pad} width={plotW} height={plotH} fill="none" stroke="hsl(var(--accent) / 0.2)" strokeWidth="1" rx="12" />

        {/* Axis Labels */}
        <text x={w / 2} y={h - 10} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" className="font-body opacity-60 font-medium">Risk →</text>
        <text x={10} y={h / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10" transform={`rotate(-90, 10, ${h / 2})`} className="font-body opacity-60 font-medium">Opportunity →</text>

        {/* Quadrant Labels */}
        {quadrants.map((q, i) => (
          <text
            key={i}
            x={q.lx}
            y={q.ly}
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="10"
            className="font-display font-bold opacity-30 tracking-tight transition-opacity duration-700"
          >
            {q.label.toUpperCase()}
          </text>
        ))}

        {/* Company Data Point */}
        <g style={{ transition: 'all 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `translate(${animated ? x : w / 2}px, ${animated ? y : h / 2}px)` }}>
          <circle r="12" fill="hsl(var(--accent))" className="animate-pulse-slow opacity-20" />
          <circle r="6" fill="hsl(var(--accent))" filter="url(#point-glow)" />
          <text
            y="-22"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="11"
            className="font-display font-bold whitespace-nowrap drop-shadow-md"
          >
            {companyName}
          </text>
        </g>
      </svg>
    </div>
  );
}
