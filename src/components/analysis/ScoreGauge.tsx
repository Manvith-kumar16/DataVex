import { useEffect, useState, memo } from 'react';
import type { ScoreData } from '@/types/analysis';

interface ScoreGaugeProps {
  score: ScoreData;
}

export const ScoreGauge = memo(function ScoreGauge({ score }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const target = score.leadScore;
    const step = target / 40;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setAnimatedScore(Math.round(current));
    }, 25);
    return () => clearInterval(interval);
  }, [score.leadScore]);

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const color = score.leadScore >= 70 ? 'hsl(var(--accent))' : score.leadScore >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  const bgColor = score.leadScore >= 70 ? 'hsl(var(--accent) / 0.1)' : score.leadScore >= 40 ? 'hsl(var(--warning) / 0.1)' : 'hsl(var(--destructive) / 0.1)';

  const breakdownItems = [
    { label: 'Technical Fit', value: score.breakdown.technicalFit, weight: '30%' },
    { label: 'Timing', value: score.breakdown.timing, weight: '25%' },
    { label: 'Budget', value: score.breakdown.budget, weight: '20%' },
    { label: 'Urgency', value: score.breakdown.urgency, weight: '15%' },
    { label: 'Market Position', value: score.breakdown.marketPosition, weight: '10%' },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          <circle
            cx="90" cy="90" r={radius} fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color})` }}
          />
          <text x="90" y="80" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="36" fontWeight="700" fontFamily="Space Grotesk">
            {animatedScore}
          </text>
          <text x="90" y="102" textAnchor="middle" fill={color} fontSize="12" fontWeight="600" letterSpacing="0.1em">
            {score.category.toUpperCase()}
          </text>
        </svg>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${bgColor} 0%, transparent 70%)` }}
        />
      </div>

      <div className="w-full space-y-2">
        {breakdownItems.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.value >= 70 ? 'hsl(var(--accent))' : item.value >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
                }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        {score.confidence}% confidence
      </div>
    </div>
  );
});
