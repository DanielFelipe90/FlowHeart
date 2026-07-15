import { AlertCircle } from "lucide-react";
import { ArrowLeft, Clock, Bike } from "lucide-react";
import type { WorkoutSession } from "../types";
import { SimpleLineChart, useContainerWidth } from "./SimpleLineChart";

// Props para o componente SessionDetail
interface SessionDetailProps {
  session: WorkoutSession;
  onBack: () => void;
}

// Função auxiliar para formatar o tempo em segundos para um formato legível
function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Componente principal que exibe os detalhes de uma sessão de treino
const PHASE_LABELS = ["Pré", "Durante", "Pós"];

export function SessionDetail({ session, onBack }: SessionDetailProps) {

  // Hook customizado para obter a largura do contêiner, usado para dimensionar o gráfico de BPM
  const bpmRef = useContainerWidth();

  // Array de valores de BPM para cada fase do treino, garantindo que sejam números válidos
  const bpmValues = [
    Number(session.pre.bpm) || 0,
    Number(session.during.bpm) || 0,
    Number(session.post.bpm) || 0,
  ];

  return (
    <div className="space-y-6 flex flex-col justify-center min-h-[70vh]">
      {/* Botão voltar */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <ArrowLeft size={16} />
        <span>Voltar ao histórico</span>
      </button>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h2
            className="text-foreground"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Detalhes do Treino
          </h2>
          <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            {session.date}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {session.pre.ihb && (
            <span
              className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs whitespace-nowrap"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              IHB Pré
            </span>
          )}
          {session.post.ihb && (
            <span
              className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs whitespace-nowrap"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              IHB Pós
            </span>
          )}
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bike size={13} className="text-primary shrink-0" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Distância
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(0.9rem, 5vw, 1.6rem)", fontWeight: 700, lineHeight: 1.1 }}
            className="text-primary">
            {session.during.distance}
            <span className="text-muted-foreground text-sm ml-1">km</span>
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={13} className="text-primary shrink-0" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Duração
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(0.9rem, 4vw, 1.6rem)", fontWeight: 700, lineHeight: 1.1 }}
            className="text-foreground">
            {fmtTime(session.during.timeSeconds)}
          </p>
        </div>

        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bike size={13} className="text-accent shrink-0" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              Vel. Média
            </span>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(0.9rem, 3vw, 1.6rem)", fontWeight: 700, lineHeight: 1.1 }}
            className="text-accent">
            {session.during.speed}
            <span className="text-muted-foreground text-sm ml-1">km/h</span>
          </p>
        </div>
      </div>

      {/* Gráfico BPM */}
      <div className="rounded-xl bg-card border border-border p-4 mb-4">
        <p
          className="text-muted-foreground text-xs uppercase tracking-widest mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Frequência Cardíaca (BPM)
        </p>
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

      {/* Tabela por fase */}
      <div className="space-y-2" style={{ paddingBottom: "0.5rem" }}>
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
            ihb: null as boolean | null,
            color: "#ff3131",
          },
          {
            label: "Pós-Treino",
            sys: session.post.systolic,
            dia: session.post.diastolic,
            bpm: session.post.bpm,
            ihb: session.post.ihb as boolean | null,
            color: "#0099b3",
          },
        ].map((phase) => (
          <div
            key={phase.label}
            className="rounded-xl bg-card border border-border p-4 flex items-center gap-4 mb-2"
          >
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: phase.color }} />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs mb-0.5 font-semibold" style={{ fontFamily: "'Inter', sans-serif", color: phase.color }}>
                  {phase.label}
                </p>
                {phase.sys !== null && (
                  <>
                    <p className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>PA</p>
                    <p className="text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>
                      {phase.sys}/{phase.dia}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>BPM</p>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", color: phase.color }}>
                  {phase.bpm}
                </p>
              </div>
              <div className="flex flex-col justify-end items-start">
                {phase.ihb && (
                  <span
                    className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <AlertCircle size={14} className="text-accent shrink-0" />
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