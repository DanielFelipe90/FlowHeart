/**
 * SimpleLineChart.tsx — Gráfico de linha em SVG puro
 *
 * Reutilizado em SessionDetail e EstatisticasPage.
 * Extraído para evitar duplicação de código.
 */

import { useRef, useState, useEffect } from "react";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useContainerWidth — Mede a largura real de um elemento DOM via ResizeObserver.
 * O gráfico só é renderizado quando width > 0, evitando SVG com dimensões inválidas.
 */
export function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChartSeries {
  values: number[];
  color: string;
  dashed?: boolean;
  label?: string; // para legenda
}

interface SimpleLineChartProps {
  series: ChartSeries[];
  labels: string[];
  width: number;
  height: number;
  id: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function SimpleLineChart({ series, labels, width, height, id }: SimpleLineChartProps) {
  const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;
  const n = labels.length;

  const allVals = series.flatMap((s) => s.values).filter((v) => v > 0);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const pad = (maxVal - minVal) * 0.2 || 10;
  const lo = Math.max(0, minVal - pad);
  const hi = maxVal + pad;

  const x = (i: number) => n === 1 ? PAD.left + W / 2 : PAD.left + (i / (n - 1)) * W;
  const y = (v: number) => PAD.top + H - ((v - lo) / (hi - lo)) * H;

  const ticks = 3;
  const yTicks = Array.from({ length: ticks }, (_, i) => lo + ((hi - lo) * i) / (ticks - 1));

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {/* Linhas de grade + labels eixo Y */}
      {yTicks.map((t, i) => (
        <g key={`ytick-${id}-${i}`}>
          <line
            x1={PAD.left} x2={PAD.left + W}
            y1={y(t)} y2={y(t)}
            stroke="rgba(0,229,255,0.06)" strokeWidth={1}
          />
          <text
            x={PAD.left - 4} y={y(t) + 4}
            textAnchor="end" fill="#7a8099"
            fontSize={9} fontFamily="'JetBrains Mono', monospace"
          >
            {Math.round(t)}
          </text>
        </g>
      ))}

      {/* Labels eixo X */}
      {labels.map((label, i) => (
        <text
          key={`xlabel-${id}-${i}`}
          x={x(i)} y={height - 6}
          textAnchor="middle" fill="#7a8099"
          fontSize={11} fontFamily="'Inter', sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Séries */}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
        return (
          <g key={`series-${id}-${si}`}>
            {n > 1 && (
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? "5 3" : undefined}
              />
            )}
            {s.values.map((v, i) => (
              <circle key={`dot-${id}-${si}-${i}`} cx={x(i)} cy={y(v)} r={5} fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}