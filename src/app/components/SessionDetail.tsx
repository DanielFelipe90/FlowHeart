import { AlertCircle } from "lucide-react";

/*
 * SessionDetail.tsx — Tela de análise detalhada de uma sessão de treino
 *
 * Exibe três blocos principais:
 *  1. Cards de estatísticas (Distância e Duração)
 *  2. Gráfico de linha — Frequência Cardíaca (BPM) nas 3 fases
 *  3. Gráfico de linha — Pressão Arterial sistólica e diastólica nas 3 fases
 *  4. Tabela por fase (Pré / Durante / Pós) com PA, BPM e status IHB
 *
 * Decisão técnica — SVG puro em vez de recharts:
 *  Os gráficos foram implementados com SVG nativo (componente SimpleLineChart)
 *  para eliminar o warning "duplicate key" do recharts, que ocorria porque
 *  a biblioteca gerava internamente chaves SVG baseadas nos valores dos dados.
 *  Com dois gráficos na mesma tela usando os mesmos rótulos de eixo ("Pré",
 *  "Durante", "Pós"), as chaves colidiam. O SVG puro dá controle total
 *  sobre as keys e é suficiente para gráficos de 3 pontos.
 *
 * Decisão técnica — useContainerWidth (ResizeObserver):
 *  ResponsiveContainer do recharts causava overflow no Android porque
 *  calculava a largura antes do layout do card estar estabilizado.
 *  O hook useContainerWidth observa o container real via ResizeObserver
 *  e só renderiza o gráfico quando a largura disponível for > 0,
 *  eliminando o problema de dimensões zero/incorretas em mobile.
 *
 * Props:
 *  session — objeto WorkoutSession completo da sessão selecionada
 *  onBack  — callback para retornar ao histórico
 */

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Clock, Bike } from "lucide-react";
import type { WorkoutSession } from "./SessionHistory";

interface SessionDetailProps {
  session: WorkoutSession;
  onBack: () => void;
}

/*
 * fmtTime — Formata segundos em "MM:SS" ou "Xh Ym"
 * Usado nos cards de estatística (Duração).
 * Formato diferente do SessionHistory.fmtTime para maior precisão nos detalhes.
 */
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/*
 * useContainerWidth — Hook que mede a largura real de um elemento DOM
 *
 * Usa ResizeObserver para reagir a mudanças de layout (rotação de tela,
 * redimensionamento de janela). Retorna um ref para anexar ao container
 * e o width atual em pixels.
 *
 * O gráfico só é renderizado quando width > 0, evitando que o SVG
 * seja criado com dimensões inválidas antes do primeiro layout.
 */
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect(); // cleanup ao desmontar
  }, []);
  return { ref, width };
}

/*
 * SimpleLineChart — Gráfico de linha em SVG puro
 *
 * Recebe uma ou mais séries de dados (arrays de números) e as plota como
 * polylines sobre um eixo X de rótulos fixos e eixo Y calculado
 * automaticamente a partir dos valores mínimo e máximo.
 *
 * Props:
 *  id      — prefixo único para as keys SVG (ex: "bpm", "pa")
 *            Garante que dois gráficos na mesma tela não conflitem
 *  width   — largura total do SVG em px (vem do useContainerWidth)
 *  height  — altura total do SVG em px
 *  labels  — rótulos do eixo X (ex: ["Pré", "Durante", "Pós"])
 *  series  — array de séries; cada série tem:
 *    values  — array de números (um por label)
 *    color   — cor hex da linha e dos pontos
 *    dashed  — true para linha tracejada (ex: diastólica)
 *
 * Cálculo do eixo Y:
 *  - min/max são calculados de todos os valores de todas as séries
 *  - Um padding de 20% é adicionado acima e abaixo para evitar que
 *    os pontos fiquem colados nas bordas do gráfico
 *  - 3 linhas de grade horizontais são geradas igualmente espaçadas
 */
interface LineChartProps {
  series: { values: number[]; color: string; dashed?: boolean }[];
  labels: string[];
  width: number;
  height: number;
  id: string;
}

function SimpleLineChart({ series, labels, width, height, id }: LineChartProps) {
  // Margens internas do SVG — deixam espaço para labels e eixos
  const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
  // Área útil de desenho após as margens
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;
  const n = labels.length; // número de pontos no eixo X

  // Calcula domínio do eixo Y a partir de todos os valores presentes
  const allVals = series.flatMap((s) => s.values).filter((v) => v > 0);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const pad = (maxVal - minVal) * 0.2 || 10; // padding de 20% (mínimo 10)
  const lo = Math.max(0, minVal - pad); // limite inferior (não vai abaixo de 0)
  const hi = maxVal + pad;              // limite superior

  // Converte índice X (0..n-1) para coordenada pixel horizontal
  const x = (i: number) => PAD.left + (i / (n - 1)) * W;

  // Converte valor Y para coordenada pixel vertical (invertida — SVG cresce para baixo)
  const y = (v: number) => PAD.top + H - ((v - lo) / (hi - lo)) * H;

  // 3 ticks igualmente espaçados no eixo Y para as linhas de grade
  const ticks = 3;
  const yTicks = Array.from({ length: ticks }, (_, i) => lo + ((hi - lo) * i) / (ticks - 1));

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>

      {/* Linhas de grade horizontais + labels do eixo Y */}
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

      {/* Labels do eixo X */}
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

      {/* Linhas e pontos de cada série de dados */}
      {series.map((s, si) => {
        // Gera a string "x1,y1 x2,y2 x3,y3" para o atributo points do polyline
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
        return (
          <g key={`series-${id}-${si}`}>
            <polyline
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={s.dashed ? "5 3" : undefined}
            />
            {/* Ponto circular em cada valor medido */}
            {s.values.map((v, i) => (
              <circle key={`dot-${id}-${si}-${i}`} cx={x(i)} cy={y(v)} r={5} fill={s.color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// Rótulos fixos do eixo X — correspondem às 3 fases de coleta de dados
const PHASE_LABELS = ["Pré", "Durante", "Pós"];

export function SessionDetail({ session, onBack }: SessionDetailProps) {
  // Dois hooks independentes — cada um observa seu próprio container
  const bpmRef = useContainerWidth();

  // Extrai os valores de BPM das 3 fases como array numérico
  const bpmValues = [
    Number(session.pre.bpm) || 0,
    Number(session.during.bpm) || 0,
    Number(session.post.bpm) || 0,
  ];

  return (
    <div>
      {/* Botão de voltar ao histórico */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#7a8099] hover:text-[#00e5ff] transition-colors mb-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={16} />
        <span>Voltar ao histórico</span>
      </button>

      {/* Cabeçalho: título + data + badges IHB */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h2
            className="text-[#e8eaf0]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Detalhes do Treino
          </h2>
          <p className="text-[#7a8099] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            {session.date}
          </p>
        </div>
        {/* Badges IHB são exibidos individualmente por fase */}
        <div className="flex flex-col gap-1 items-end shrink-0">
          {session.pre.ihb && (
            <span
              className="px-2 py-0.5 rounded-full bg-[#ff5c00]/15 text-[#ff5c00] text-xs whitespace-nowrap"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              IHB Pré
            </span>
          )}
          {session.post.ihb && (
            <span
              className="px-2 py-0.5 rounded-full bg-[#ff5c00]/15 text-[#ff5c00] text-xs whitespace-nowrap"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              IHB Pós
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-[#1e2330] border border-[rgba(0,229,255,0.12)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bike size={13} className="text-[#00e5ff] shrink-0" />
            <span className="text-[#7a8099] text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Distância
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: "#00e5ff", lineHeight: 1.1 }}>
            {session.during.distance}
            <span className="text-[#7a8099] text-sm ml-1">km</span>
          </p>
        </div>

        <div className="rounded-xl bg-[#1e2330] border border-[rgba(0,229,255,0.12)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-[#00e5ff] shrink-0" />
            <span className="text-[#7a8099] text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Duração
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: "#e8eaf0", lineHeight: 1.1 }}>
            {fmtTime(session.during.timeSeconds)}
          </p>
        </div>

        <div className="rounded-xl bg-[#1e2330] border border-[rgba(0,229,255,0.12)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bike size={13} className="text-[#ff5733] shrink-0" />
            <span className="text-[#7a8099] text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Vel. Média
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.6rem", fontWeight: 700, color: "#ff5733", lineHeight: 1.1 }}>
            {session.during.speed}
            <span className="text-[#7a8099] text-sm ml-1">km/h</span>
          </p>
        </div>
      </div>

      {/* Gráfico BPM — linha vermelha neon única (3 pontos: pré, durante, pós) */}
      <div className="rounded-xl bg-[#1e2330] border border-[rgba(0,229,255,0.12)] p-4 mb-4">
        <p
          className="text-[#7a8099] text-xs uppercase tracking-widest mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Frequência Cardíaca (BPM)
        </p>
        {/* Container observado pelo ResizeObserver — define a largura real do SVG */}
        <div ref={bpmRef.ref} style={{ width: "100%", height: 130 }}>
          {bpmRef.width > 0 && (
            <SimpleLineChart
              id="bpm"
              width={bpmRef.width}
              height={130}
              labels={PHASE_LABELS}
              series={[{ values: bpmValues, color: "#ff3131" }]}
            />
          )}
        </div>
      </div>

      {/* Tabela por fase: Pré / Durante / Pós com PA, BPM e IHB */}
      <div className="space-y-2" style={{ paddingBottom: "2rem" }}>
        {/*
         * Cada objeto da lista define uma fase.
         * `ihb: null` na fase "Durante" oculta o campo IHB (não é coletado
         * durante o treino — somente no pré e pós).
         */}
        {[
          {
            label: "Pré-Treino",
            sys: session.pre.systolic,
            dia: session.pre.diastolic,
            bpm: session.pre.bpm,
            ihb: session.pre.ihb as boolean | null,
            color: "#39ff14",
          },
          {
            label: "Durante-Treino",
            sys: null,
            dia: null,
            bpm: session.during.bpm,
            ihb: null as boolean | null, // IHB não coletado durante o treino
            color: "#ff3131",
          },
          {
            label: "Pós-Treino",
            sys: session.post.systolic,
            dia: session.post.diastolic,
            bpm: session.post.bpm,
            ihb: session.post.ihb as boolean | null,
            color: "#00e5ff",
          },
        ].map((phase) => (
          <div
            key={phase.label}
            className="rounded-xl bg-[#161a23] border border-[rgba(0,229,255,0.08)] p-4 flex items-center gap-4 mb-2"
          >
            {/* Barra vertical colorida como identificador visual da fase */}
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: phase.color }} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs mb-0.5 font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: phase.color }}>
                  {phase.label}
                </p>
                {phase.sys !== null && (
                  <>
                    <p className="text-[#7a8099] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>PA</p>
                    <p className="text-[#e8eaf0]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>
                      {phase.sys}/{phase.dia}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-[#7a8099] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                  BPM
                </p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", color: phase.color }}>
                  {phase.bpm}
                </p>
              </div>
              <div className="flex flex-col justify-end items-start">
                {/* Renderiza o badge IHB somente nas fases pré e pós */}
                {phase.ihb && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[#ff5c00]/15 text-[#ff5c00]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <AlertCircle size={14} className="text-[#ff5c00] shrink-0" />
                    IHB
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
