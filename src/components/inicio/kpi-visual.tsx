"use client";

type KpiVisualProps = {
  variant: "occupancy" | "bars" | "area" | "dots";
  /** 0–100 for occupancy ring */
  percent?: number;
  /** normalized 0–1 values for bars/area */
  series?: number[];
  color?: string;
  alert?: boolean;
  className?: string;
};

const OLIVE = "#5c6b4a";
const OLIVE_DARK = "#3e4f3c";
const NEUTRAL = "#c4b8a8";
const TERRACOTTA = "#c4845a";

function OccupancyRing({ percent, color }: { percent: number; color: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" stroke={NEUTRAL} strokeWidth="4" opacity={0.35} />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
      />
    </svg>
  );
}

function MiniBars({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(...series, 1);
  return (
    <div className="flex h-10 flex-1 items-end gap-[3px]" aria-hidden>
      {series.map((v, i) => (
        <div
          key={i}
          className="min-w-[4px] flex-1 rounded-sm"
          style={{
            height: `${Math.max(12, (v / max) * 100)}%`,
            backgroundColor: i === series.length - 1 ? color : `${color}66`,
          }}
        />
      ))}
    </div>
  );
}

function AreaSpark({ series, color }: { series: number[]; color: string }) {
  const w = 88;
  const h = 36;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const line = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - 4 - ((v - min) / range) * (h - 8);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full max-w-[100px]" preserveAspectRatio="none" aria-hidden>
      <polygon points={area} fill={`${color}18`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
    </svg>
  );
}

function StatusDots({ count, alert }: { count: number; alert?: boolean }) {
  const total = Math.min(Math.max(count, 1), 5);
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: alert && i === total - 1 ? TERRACOTTA : i < total - 1 ? `${OLIVE}55` : OLIVE_DARK,
          }}
        />
      ))}
    </div>
  );
}

export function KpiVisual({
  variant,
  percent = 0,
  series = [],
  color = OLIVE,
  alert,
  className = "",
}: KpiVisualProps) {
  return (
    <div className={`flex items-center justify-end ${className}`}>
      {variant === "occupancy" && <OccupancyRing percent={percent} color={color} />}
      {variant === "bars" && series.length > 0 && <MiniBars series={series} color={color} />}
      {variant === "area" && series.length > 1 && <AreaSpark series={series} color={color} />}
      {variant === "dots" && <StatusDots count={Math.max(1, Math.round(series[series.length - 1] ?? 1))} alert={alert} />}
    </div>
  );
}
