import { Bike, Activity, Heart, Clock, Gauge } from "lucide-react";
import type { WorkoutSession } from "../types";
import { SimpleLineChart, useContainerWidth } from "../components/SimpleLineChart";

interface EstatisticasPageProps {
  sessions: WorkoutSession[];
  userName: string;
}

interface ChartCardProps {
  title: string;
  icon: React.ReactNode;
  id: string;
  series: { values: number[]; color: string; dashed?: boolean; label: string }[];
  labels: string[];
  unit?: string;
}

function ChartCard({ title, icon, id, series, labels, unit }: ChartCardProps) {
  const { ref, width } = useContainerWidth();

  return (
    <div className="rounded-xl bg-card border border-border p-4 mb-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-muted-foreground text-xs uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
          {title}
        </p>
        {unit && (
          <span className="ml-auto text-muted-foreground/50 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {unit}
          </span>
        )}
      </div>

      {/* Legenda */}
      {series.length > 1 && (
        <div className="flex gap-4 mb-3">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5 rounded"
                style={{
                  background: s.dashed ? "transparent" : s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div ref={ref} style={{ width: "100%", height: 140 }}>
        {width > 0 && labels.length > 0 && (
          <SimpleLineChart id={id} width={width} height={140} labels={labels} series={series} />
        )}
        {labels.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground/50 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              Sem dados ainda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function EstatisticasPage({ sessions }: EstatisticasPageProps) {
  const labels = sessions.map((_, i) => `T${i + 1}`);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Gauge size={48} className="text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
          Nenhum treino registrado ainda.
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Complete treinos para ver sua evolução aqui.
        </p>
      </div>
    );
  }

  const bpmPre     = sessions.map((s) => Number(s.pre.bpm) || 0);
  const bpmDuring  = sessions.map((s) => Number(s.during.bpm) || 0);
  const bpmPost    = sessions.map((s) => Number(s.post.bpm) || 0);
  const sisPre     = sessions.map((s) => Number(s.pre.systolic) || 0);
  const diaPre     = sessions.map((s) => Number(s.pre.diastolic) || 0);
  const sisPost    = sessions.map((s) => Number(s.post.systolic) || 0);
  const diaPost    = sessions.map((s) => Number(s.post.diastolic) || 0);
  const distances  = sessions.map((s) => Number(s.during.distance) || 0);
  const speeds     = sessions.map((s) => Number(s.during.speed) || 0);
  const durations  = sessions.map((s) => Math.round(s.during.timeSeconds / 60));

  return (
    <div className="pb-6">
      <div className="mb-6">
        <h2
          className="text-foreground"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2rem", fontWeight: 800 }}
        >
          ESTATÍSTICAS
        </h2>
        <p className="text-muted-foreground text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
          Evolução ao longo de {sessions.length} treino{sessions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ChartCard
        id="bpm"
        title="Frequência Cardíaca"
        icon={<Activity size={14} className="text-destructive" />}
        unit="bpm"
        labels={labels}
        series={[
          { values: bpmPre,    color: "#39ff14", label: "Pré" },
          { values: bpmDuring, color: "#ff3131", label: "Durante" },
          { values: bpmPost,   color: "#0099b3", label: "Pós", dashed: true },
        ]}
      />

      <ChartCard
        id="pa-pre"
        title="Pressão Arterial — Pré-Treino"
        icon={<Heart size={14} style={{ color: "#39ff14" }} />}
        unit="mmHg"
        labels={labels}
        series={[
          { values: sisPre, color: "#39ff14", label: "Sistólica" },
          { values: diaPre, color: "#39ff14", label: "Diastólica", dashed: true },
        ]}
      />

      <ChartCard
        id="pa-pos"
        title="Pressão Arterial — Pós-Treino"
        icon={<Heart size={14} className="text-primary" />}
        unit="mmHg"
        labels={labels}
        series={[
          { values: sisPost, color: "#0099b3", label: "Sistólica" },
          { values: diaPost, color: "#0099b3", label: "Diastólica", dashed: true },
        ]}
      />

      <ChartCard
        id="distance"
        title="Distância"
        icon={<Bike size={14} className="text-primary" />}
        unit="km"
        labels={labels}
        series={[{ values: distances, color: "#0099b3", label: "Distância" }]}
      />

      <ChartCard
        id="speed"
        title="Velocidade Média"
        icon={<Gauge size={14} className="text-accent" />}
        unit="km/h"
        labels={labels}
        series={[{ values: speeds, color: "#ff5733", label: "Velocidade" }]}
      />

      <ChartCard
        id="duration"
        title="Duração"
        icon={<Clock size={14} className="text-muted-foreground" />}
        unit="min"
        labels={labels}
        series={[{ values: durations, color: "#0099b3", label: "Duração" }]}
      />
    </div>
  );
}