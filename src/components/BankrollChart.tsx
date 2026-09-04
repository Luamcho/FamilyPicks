import { useId } from "react";
import type { BankrollPoint } from "@/lib/types";

interface Props {
  data: BankrollPoint[];
  height?: number;
}

function niceBounds(min: number, max: number): [number, number] {
  const pad = Math.max(4, (max - min) * 0.15);
  let lo = Math.floor((min - pad) / 5) * 5;
  const hi = Math.ceil((max + pad) / 5) * 5;
  if (lo > 0) lo = 0;
  return [lo, hi];
}

export function BankrollChart({ data }: Props) {
  const clipId = useId().replace(/:/g, "");
  const W = 720;
  const H = 300;
  const L = 52;
  const R = 704;
  const T = 24;
  const B = 252;

  if (data.length < 2) {
    return <p className="sub">Sin datos suficientes para la gráfica.</p>;
  }

  const values = data.map((d) => d.cumulative_units);
  const [lo, hi] = niceBounds(Math.min(...values), Math.max(...values));
  const x = (i: number) => L + (i * (R - L)) / (values.length - 1);
  const y = (v: number) => T + ((hi - v) / (hi - lo)) * (B - T);
  const crossesZero = lo < 0 && hi > 0;
  const zeroY = y(0);
  const baseY = crossesZero ? zeroY : y(Math.max(lo, 0));

  const ticks = 5;
  const gridLines = Array.from({ length: ticks + 1 }, (_, t) => {
    const gv = hi - ((hi - lo) * t) / ticks;
    return { gv, gy: y(gv) };
  });

  const step = Math.max(1, Math.ceil(data.length / 6));
  const linePts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const areaPath =
    `M${x(0).toFixed(1)},${baseY.toFixed(1)} ` +
    values.map((v, i) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ") +
    ` L${x(values.length - 1).toFixed(1)},${baseY.toFixed(1)} Z`;

  const last = values[values.length - 1];
  // drawdown máximo
  let peak = values[0];
  let dd = 0;
  let ddIdx = 0;
  values.forEach((v, i) => {
    peak = Math.max(peak, v);
    if (v - peak < dd) {
      dd = v - peak;
      ddIdx = i;
    }
  });

  const monthLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { month: "short" });

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Evolución del bankroll: de ${values[0]} a ${last} unidades en el periodo mostrado.`}
    >
      <defs>
        <pattern
          id={`hatch-${clipId}`}
          width="6"
          height="6"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--loss)" strokeWidth="1.4" opacity="0.5" />
        </pattern>
        <clipPath id={`above-${clipId}`}>
          <rect x={L} y={T} width={R - L} height={(crossesZero ? zeroY : B) - T} />
        </clipPath>
        {crossesZero && (
          <clipPath id={`below-${clipId}`}>
            <rect x={L} y={zeroY} width={R - L} height={B - zeroY} />
          </clipPath>
        )}
      </defs>

      {gridLines.map(({ gv, gy }, i) => (
        <g key={i}>
          <line x1={L} y1={gy.toFixed(1)} x2={R} y2={gy.toFixed(1)} stroke="var(--grid-line)" strokeWidth="1" />
          <text
            x={L - 8}
            y={(gy + 4).toFixed(1)}
            textAnchor="end"
            fill="var(--muted)"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
          >
            {gv > 0 ? "+" : ""}
            {Math.round(gv)}
          </text>
        </g>
      ))}

      {crossesZero && (
        <line
          x1={L}
          y1={zeroY.toFixed(1)}
          x2={R}
          y2={zeroY.toFixed(1)}
          stroke="var(--text)"
          strokeWidth="1.2"
          strokeDasharray="2 3"
          opacity="0.5"
        />
      )}

      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          <text
            key={i}
            x={x(i).toFixed(1)}
            y="278"
            textAnchor="middle"
            fill="var(--muted)"
            fontFamily="Inter, sans-serif"
            fontSize="11"
          >
            {monthLabel(d.bucket_start)}
          </text>
        ) : null,
      )}

      <path d={areaPath} fill="var(--win)" fillOpacity="0.16" clipPath={`url(#above-${clipId})`} />
      {crossesZero && (
        <path d={areaPath} fill={`url(#hatch-${clipId})`} clipPath={`url(#below-${clipId})`} />
      )}
      <polyline
        points={linePts}
        fill="none"
        stroke="var(--win)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <circle cx={x(values.length - 1).toFixed(1)} cy={y(last).toFixed(1)} r="4.5" fill="var(--win)" />
      <text
        x={(x(values.length - 1) - 8).toFixed(1)}
        y={(y(last) - 10).toFixed(1)}
        textAnchor="end"
        fill="var(--win)"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fontWeight="700"
      >
        {last > 0 ? "+" : ""}
        {last} u
      </text>

      {dd < -1 && (
        <>
          <circle cx={x(ddIdx).toFixed(1)} cy={y(values[ddIdx]).toFixed(1)} r="3.5" fill="var(--loss)" />
          <text
            x={(x(ddIdx) + 8).toFixed(1)}
            y={(y(values[ddIdx]) + 15).toFixed(1)}
            fill="var(--loss)"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fontWeight="700"
          >
            {values[ddIdx] > 0 ? "+" : ""}
            {values[ddIdx]} u
          </text>
        </>
      )}
    </svg>
  );
}
