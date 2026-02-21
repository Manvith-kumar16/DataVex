import { useEffect, useState, memo } from 'react';
import type { ScoreData } from '@/types/analysis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreGaugeProps {
  score: number;
  previousScore?: number;
  size?: number;
  strokeWidth?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ColorSet {
  stroke: string;
  text: string;
  glow: string;
  disc: string;
}

function getColor(score: number): ColorSet {
  if (score >= 70)
    return { stroke: '#22c55e', text: '#22c55e', glow: '#22c55e2e', disc: '#22c55e0c' };
  if (score >= 40)
    return { stroke: '#facc15', text: '#facc15', glow: '#facc152e', disc: '#facc150c' };
  return { stroke: '#ef4444', text: '#ef4444', glow: '#ef44442e', disc: '#ef44440c' };
}

function getLabel(score: number): string {
  if (score >= 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

export const ScoreGauge = memo(function ScoreGauge({ score }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const from = prev;
    const to = score;

    // cancel any in-flight animation
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;

    if (from === to) {
      setDisplayScore(to);
      return;
    }

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min((ts - startRef.current) / ANIM_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic easeOut mirrors arc easing
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="inline-flex flex-col items-center gap-3 select-none"
      style={{ width: size }}
    >
      {/* Gauge */}
      <div
        className="relative"
        style={{
          width: size,
          height: size,
          filter: `drop-shadow(0 6px 24px ${color.glow})`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          overflow="visible"
          aria-label={`Score: ${score}`}
          role="img"
        >
          {/* Soft background disc that takes on the score color */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2 - 1}
            fill={color.disc}
          />

          {/* Grey track ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-gray-200 dark:text-white/10"
          />

          {/* Animated arc — Framer Motion handles dashOffset transition */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}   // start fully hidden
            transform={`rotate(-90 ${center} ${center})`}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ willChange: 'stroke-dashoffset' }}
          />
        </svg>

        {/* Center labels */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
          {/* Animated number */}
          <span
            className="text-4xl font-semibold leading-none tabular-nums tracking-tight"
            style={{ color: color.text }}
          >
            {displayScore}
          </span>
          {/* Category label */}
          <span
            className="text-[10px] font-bold tracking-[0.2em] mt-0.5"
            style={{ color: color.text, opacity: 0.75 }}
          >
            {getLabel(score)}
          </span>
        </div>
      </div>

      {/* Delta chip — only shown when there's a previous score */}
      <AnimatePresence mode="wait">
        {delta !== 0 && (
          <motion.span
            key={`delta-${score}-${prev}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
              delta > 0
                ? 'bg-green-500/10 text-green-500 ring-1 ring-green-500/20'
                : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20',
            ].join(' ')}
          >
            <span className="text-[10px]">{delta > 0 ? '▲' : '▼'}</span>
            {delta > 0 ? `+${delta}` : delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
});
