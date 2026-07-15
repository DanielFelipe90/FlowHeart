import { Bike, Activity, Heart, Clock, Gauge } from "lucide-react";
import type { WorkoutSession } from "../types";
import { ReportButton } from "../components/ReportButton";
import { ChartCard } from "../components/ChartCard";
import { apiDownloadReport } from "../utils/api";

// Props para o componente EstatisticasPage
interface EstatisticasPageProps {
  sessions: WorkoutSession[];
  userName: string;
}


export function EstatisticasPage({ sessions, userName }: EstatisticasPageProps) {
  // Gera os rótulos para o eixo X do gráfico, como T1, T2, T3, etc.
  const labels = sessions.map((_, i) => `T${i + 1}`);

  // Se não houver sessões registradas, exibe uma mensagem informando que não há dados para mostrar
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

  // Extrai os dados relevantes das sessões para cada métrica que será exibida nos gráficos
  const bpmPre    = sessions.map((s) => Number(s.pre.bpm) || 0);
  const bpmDuring = sessions.map((s) => Number(s.during.bpm) || 0);
  const bpmPost   = sessions.map((s) => Number(s.post.bpm) || 0);
  const sisPre    = sessions.map((s) => Number(s.pre.systolic) || 0);
  const diaPre    = sessions.map((s) => Number(s.pre.diastolic) || 0);
  const sisPost   = sessions.map((s) => Number(s.post.systolic) || 0);
  const diaPost   = sessions.map((s) => Number(s.post.diastolic) || 0);
  const distances = sessions.map((s) => Number(s.during.distance) || 0);
  const speeds    = sessions.map((s) => Number(s.during.speed) || 0);
  const durations = sessions.map((s) => Math.round(s.during.timeSeconds / 60));

  return (
    <div className="pb-6">

      {/* Cabeçalho da página com botão de exportar */}
      <div className="flex items-center justify-between mb-6">
        <div>
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
        <ReportButton
          onGenerate={() => apiDownloadReport(userName)}
          disabled={sessions.length === 0}
          label="Gerar PDF"
        />
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