import { cn } from "@/lib/utils";

/**
 * Tiny dependency-free SVG charts (sparkline, multi-series trend, donut).
 * Pure/presentational — no hooks — so they render in server or client trees.
 * Colors accept any CSS color, including theme vars like "var(--color-primary)".
 */

function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length === 0) return "";
  const first = pts[0] as [number, number];
  if (pts.length === 1) return `M ${first[0]} ${first[1]}`;
  const d = [`M ${first[0]} ${first[1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i] as [number, number];
    const p2 = pts[i + 1] as [number, number];
    const p0 = pts[i - 1] ?? p1;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

export function Sparkline({
  data,
  color = "var(--color-primary)",
  height = 38,
  fill = true,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  className?: string;
}) {
  const W = 120;
  const n = data.length;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pad = 3;
  const sx = (i: number) => (n <= 1 ? W : (i / (n - 1)) * W);
  const sy = (v: number) => height - pad - ((v - min) / (max - min || 1)) * (height - 2 * pad);
  const pts = data.map((v, i) => [sx(i), sy(v)] as [number, number]);
  const line = smoothPath(pts);
  const area = `${line} L ${sx(n - 1)} ${height} L ${sx(0)} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
      aria-hidden
    >
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function TrendChart({
  series,
  height = 240,
  className,
}: {
  series: { name: string; color: string; data: number[] }[];
  height?: number;
  className?: string;
}) {
  const W = 700;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 14;
  const padB = 8;
  const n = Math.max(...series.map((s) => s.data.length), 1);
  const max = Math.max(1, ...series.flatMap((s) => s.data));
  const sx = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const sy = (v: number) => H - padB - (v / max) * (H - padT - padB);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((t) => H - padB - t * (H - padT - padB));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height: H }}
      aria-hidden
    >
      {grid.map((gy) => (
        <line
          key={gy}
          x1={padL}
          x2={W - padR}
          y1={gy}
          y2={gy}
          stroke="var(--color-border)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {series.map((s) => {
        const pts = s.data.map((v, i) => [sx(i), sy(v)] as [number, number]);
        const line = smoothPath(pts);
        const area = `${line} L ${sx(s.data.length - 1)} ${H - padB} L ${sx(0)} ${H - padB} Z`;
        return (
          <g key={s.name}>
            <path d={area} fill={s.color} opacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  segments,
  size = 150,
  thickness = 20,
  className,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size }}
      className={className}
      aria-hidden
    >
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth={thickness}
        />
        {segments.map((s) => {
          const dash = (s.value / total) * circ;
          const node = (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return node;
        })}
      </g>
    </svg>
  );
}
