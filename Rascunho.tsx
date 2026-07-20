import { useState } from "react";
import { Activity, Bike, ChevronRight, CheckCircle2, Radio, PenLine } from "lucide-react";
import { MetricInput } from "../components/MetricInput";
import { BloodPressureInput } from "../components/BloodPressureInput";
import { WorkoutTimer } from "../components/WorkoutTimer";
import { IHBToggle } from "../components/IHBToggle";
import { PhaseHeader } from "../components/PhaseHeader";
import { StepIndicator } from "../components/StepIndicator";
import type { AppPage, Phase, PreState, DuringState, PostState } from "../types";
import { useWorkoutNotifications } from "../hooks/useWorkoutNotifications";
import { useBpm } from "../hooks/useBpm";
import { useBpmMode } from "../hooks/useBpmMode";

// Props para o componente WorkoutPage
interface WorkoutPageProps {
  phase: Phase;
  userId: string | null;
  pre: PreState; setPre: React.Dispatch<React.SetStateAction<PreState>>;
  during: DuringState; setDuring: React.Dispatch<React.SetStateAction<DuringState>>;
  post: PostState; setPost: React.Dispatch<React.SetStateAction<PostState>>;
  setPage: (page: AppPage) => void;
  saveSession: () => void;
  onTimerRunningChange: (running: boolean) => void;
}

export function WorkoutPage({ phase, userId, pre, setPre, during, setDuring, post, setPost, setPage, saveSession, onTimerRunningChange }: WorkoutPageProps) {

  // Determina se os botões de avançar ou salvar devem estar habilitados
  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = during.bpm;
  const canSavePost = post.systolic && post.diastolic && post.bpm;
  const [timerRunning, setTimerRunning] = useState(false);

  const { status, currentBpm, isMobileOnline, getAverageBpm, resetReadings } = useBpm({
    userId,
    enabled: phase === "during",
    onBpmReceived: (bpm) => {
      // Atualiza o BPM em tempo real só no modo sensor
      if (mode === "sensor") {
        setDuring(p => ({ ...p, bpm: String(bpm) }));
      }
    },
  });

  const { mode, selectSensor, selectManual, isSelecting } = useBpmMode({ isMobileOnline });

  // Hook customizado para lidar com notificações durante o treino
  useWorkoutNotifications(phase, during.timeSeconds, timerRunning);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAdvanceDuring = () => {
    // Se estava no modo sensor, salva a média como BPM final
    if (mode === "sensor") {
      const avg = getAverageBpm();
      if (avg) setDuring(p => ({ ...p, bpm: avg }));
    }
    setPage({ tag: "workout", phase: "post" });
  };

  const handleStartDuring = () => {
    resetReadings();
    setPage({ tag: "workout", phase: "during" });
  };

  // ─── Label de status do sensor ────────────────────────────────────────────

  const sensorStatusLabel = {
    disconnected:         "Sensor desconectado",
    waiting:              "Aguardando Fit 3 / Watch...",
    flutter_connected:    "Sensor conectado",
    flutter_disconnected: "Sensor perdido — reconectando...",
  }[status];


  return (
    <div>
      <StepIndicator current={phase} />

      {phase === "pre" && (
        <div>
          <PhaseHeader phase="pre" />
          <div className="space-y-3">
            <BloodPressureInput
              systolic={pre.systolic} diastolic={pre.diastolic}
              onSystolicChange={(v) => setPre((p) => ({ ...p, systolic: v }))}
              onDiastolicChange={(v) => setPre((p) => ({ ...p, diastolic: v }))}
            />
            <MetricInput label="Frequência Cardíaca" unit="bpm" value={pre.bpm} onChange={(v) => setPre((p) => ({ ...p, bpm: v }))} placeholder="72" icon={<Activity size={14} />} min={30} max={250} />
            <IHBToggle value={pre.ihb} onChange={(v) => setPre((p) => ({ ...p, ihb: v }))} />
          </div>
          <button
            disabled={!canAdvancePre}
            onClick={handleStartDuring}
            className="w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-primary text-primary-foreground"
          >
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>INICIAR TREINO</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {phase === "during" && (
        <div>
          <PhaseHeader phase="during" />
          <div className="space-y-3">
            <WorkoutTimer
              onTimeChange={(s) => setDuring((p) => ({ ...p, timeSeconds: s }))}
              onRunningChange={(running) => {
                onTimerRunningChange(running);
                setTimerRunning(running);
              }}
            />

            {/* ── Seleção de modo BPM ── */}
            <div className="rounded-xl border border-border bg-input-background p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Inter', sans-serif" }}>
                Frequência Cardíaca
              </p>

              {/* Botões de modo */}
              <div className="flex gap-2 mb-3">
                {/* Botão sensor — só aparece se Flutter online OU já estava no modo sensor */}
                {(isMobileOnline || mode === "sensor") && (
                  <button
                    onClick={selectSensor}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${mode === "sensor"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Radio size={14} />
                    Sensor
                  </button>
                )}

                {/* Botão manual — sempre aparece */}
                <button
                  onClick={selectManual}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${mode === "manual"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <PenLine size={14} />
                  Manual
                </button>
              </div>

              {/* ── Modo sensor ── */}
              {mode === "sensor" && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{sensorStatusLabel}</p>
                  {currentBpm ? (
                    <p
                      className="text-primary"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3rem", fontWeight: 700, lineHeight: 1 }}
                    >
                      {currentBpm} <span className="text-lg">bpm</span>
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">— bpm</p>
                  )}
                </div>
              )}

              {/* ── Modo manual ── */}
              {mode === "manual" && (
                <MetricInput
                  label="" unit="bpm" value={during.bpm}
                  onChange={(v) => setDuring(p => ({ ...p, bpm: v }))}
                  placeholder="158" icon={<Activity size={14} />} min={30} max={250}
                />
              )}

              {/* ── Aguardando escolha ── */}
              {isSelecting && (
                <p className="text-muted-foreground text-sm text-center">
                  Escolha como registrar o BPM
                </p>
              )}
            </div>            <MetricInput label="Frequência Cardíaca" unit="bpm" value={during.bpm} onChange={(v) => setDuring((p) => ({ ...p, bpm: v }))} placeholder="158" icon={<Activity size={14} />} min={30} max={250} />

            <MetricInput label="Distância Percorrida" unit="km" value={during.distance} onChange={(v) => setDuring((p) => ({ ...p, distance: v }))} placeholder="20.0" icon={<Bike size={14} />} />
          </div>
          <button
            disabled={!canAdvanceDuring}
            onClick={handleAdvanceDuring}
            className={`w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 ${canAdvanceDuring ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
          >
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>FINALIZAR TREINO</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {phase === "post" && (
        <div>
          <PhaseHeader phase="post" />
          <div className="space-y-3">
            <BloodPressureInput
              systolic={post.systolic} diastolic={post.diastolic}
              onSystolicChange={(v) => setPost((p) => ({ ...p, systolic: v }))}
              onDiastolicChange={(v) => setPost((p) => ({ ...p, diastolic: v }))}
            />
            <MetricInput label="Frequência Cardíaca" unit="bpm" value={post.bpm} onChange={(v) => setPost((p) => ({ ...p, bpm: v }))} placeholder="88" icon={<Activity size={14} />} min={30} max={250} />
            <IHBToggle value={post.ihb} onChange={(v) => setPost((p) => ({ ...p, ihb: v }))} />
          </div>
          <button
            disabled={!canSavePost}
            onClick={saveSession}
            className={`w-full mt-6 rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 ${canSavePost ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
          >
            <CheckCircle2 size={18} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>SALVAR TREINO</span>
          </button>
        </div>
      )}
    </div>
  );
}