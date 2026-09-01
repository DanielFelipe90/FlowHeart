import { useState, useEffect } from "react";
import { Activity, Bike, ChevronRight, CheckCircle2, Radio, PenLine, Bluetooth, Heart, AlertTriangle } from "lucide-react";
import { MetricInput } from "../components/MetricInput";
import { BloodPressureInput } from "../components/BloodPressureInput";
import { WorkoutTimer } from "../components/WorkoutTimer";
import { IHBToggle } from "../components/IHBToggle";
import { PhaseHeader } from "../components/PhaseHeader";
import { StepIndicator } from "../components/StepIndicator";
import type { AppPage, Phase, PreState, DuringState, PostState } from "../types";
import { useWorkoutNotifications } from "../hooks/useWorkoutNotifications";
import { useBpmSource, type BpmConnectionStatus } from "../hooks/useBpmSource";

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

export function WorkoutPage({ phase, pre, setPre, during, setDuring, post, setPost, setPage, saveSession, onTimerRunningChange }: WorkoutPageProps) {
  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = Boolean(during.bpm) && Boolean(during.distance);
  const canSavePost = post.systolic && post.diastolic && post.bpm;
  const [timerRunning, setTimerRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
  }, [phase]);

  const isDuringPhase = phase === "during";

  const { mode, status, currentBpm, getAverageBpm, getReadings, resetReadings, selectSensor, selectMagene, selectManual } =
    useBpmSource({ enabled: isDuringPhase });
  const isAutoMode = mode === "sensor" || mode === "magene";

  useEffect(() => {
    if (!isAutoMode || currentBpm == null) return;
    // Evita disparar setDuring (e o re-render que vem junto) quando a nova
    // leitura é idêntica à já salva — o sensor pode reenviar o mesmo valor
    // em eventos de status que não representam uma leitura nova.
    setDuring((p) => (p.bpm === String(currentBpm) ? p : { ...p, bpm: String(currentBpm) }));
  }, [isAutoMode, currentBpm, setDuring]);

  useWorkoutNotifications(phase, during.timeSeconds, timerRunning);

  // ─── Handlers de Validação ─────────────────────────────────────────────────────────────
  const handleStartDuringAttempt = () => {
    if (!canAdvancePre) {
      setErrorMessage("Preencha sua pressão arterial e frequência cardíaca para iniciar.");
      return;
    }
    setErrorMessage(null);
    resetReadings();
    setPage({ tag: "workout", phase: "during" });
  };

  const handleAdvanceDuringAttempt = () => {
    if (!canAdvanceDuring) {
      setErrorMessage("Preencha a frequência cardíaca média e a distância percorrida para finalizar.");
      return;
    }
    setErrorMessage(null);
    if (isAutoMode) {
      const avg = getAverageBpm();
      const readings = getReadings();
      setDuring(p => ({
        ...p,
        ...(avg ? { bpm: avg } : {}),
        bpmSeries: readings,
      }));
    }
    setPage({ tag: "workout", phase: "post" });
  };

  const handleSaveSessionAttempt = () => {
    if (!canSavePost) {
      setErrorMessage("Preencha sua pressão arterial e frequência cardíaca finais para salvar.");
      return;
    }
    setErrorMessage(null);
    saveSession();
  };

  // ─── Lógica UI do Card de FC ────────────────────────────────────────────
  const autoSourceLabel = mode === "magene" ? "Magene H003" : "Fit 3 / Watch";

  const sensorStatusLabels: Record<BpmConnectionStatus, string> = {
    disconnected: "Sensor desconectado",
    waiting: `Procurando ${autoSourceLabel}...`,
    mobile_connected: "Sensor conectado",
    mobile_disconnected: "Sensor perdido — reconectando...",
  };
  const sensorStatusLabel = sensorStatusLabels[status];

  // Helper para determinar a cor do batimento baseado nas zonas cardíacas
  const getBpmColor = (bpm: number | null) => {
    if (!bpm) return "text-primary";
    if (bpm < 85) return "text-foreground";           // Repouso/Leve
    if (bpm < 110) return "text-emerald-500";          // Aquecimento/Queima Gordura
    if (bpm < 130) return "text-amber-500";            // Aeróbico
    return "text-destructive";                         // Anaeróbico/Extremo
  };

  // Altera a borda do card se o sinal cair durante o treino
  const isDisconnectedWarning = isAutoMode && status === "mobile_disconnected";

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

          <div className="mt-6 flex flex-col gap-2">
            {errorMessage && (
              <p className="text-destructive font-medium text-sm text-center animate-in fade-in slide-in-from-top-1">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleStartDuringAttempt}
              className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all hover:opacity-90 ${canAdvancePre
                ? "bg-primary text-primary-foreground"
                : "bg-primary/50 text-primary-foreground/80"
                }`}
            >
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>INICIAR TREINO</span>
              <ChevronRight size={18} />
            </button>
          </div>
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

            {/* ── Card Frequência Cardíaca ── */}
            <div className={`rounded-2xl border bg-input-background p-5 shadow-sm space-y-4 transition-colors duration-300 ${isDisconnectedWarning ? "border-amber-500/50" : "border-border"
              }`}>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {isDisconnectedWarning && <AlertTriangle size={14} className="text-amber-500" />}
                  Frequência Cardíaca
                </p>

                {/* Status do sensor */}
                {isAutoMode && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                    <span className={`w-2 h-2 rounded-full ${status === "mobile_connected" ? "bg-emerald-500 animate-pulse" :
                        status === "mobile_disconnected" ? "bg-amber-500" : "bg-muted-foreground animate-pulse"
                      }`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {status === "mobile_connected" ? "Online" :
                        status === "mobile_disconnected" ? "Desconectado" : "Buscando"}
                    </span>
                  </div>
                )}
              </div>

              {/* Segmented Control - Com Acessibilidade (Roles) */}
              <div role="tablist" className="flex bg-secondary/40 p-1 rounded-xl border border-border/30">
                <button
                  role="tab"
                  aria-selected={mode === "sensor"}
                  onClick={selectSensor}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring ${mode === "sensor"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Radio size={13} className={mode === "sensor" ? "text-primary" : ""} />
                  Watch
                </button>

                <button
                  role="tab"
                  aria-selected={mode === "magene"}
                  onClick={selectMagene}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring ${mode === "magene"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Bluetooth size={13} className={mode === "magene" ? "text-primary" : ""} />
                  Magene
                </button>

                <button
                  role="tab"
                  aria-selected={mode === "manual"}
                  onClick={selectManual}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring ${mode === "manual"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <PenLine size={13} className={mode === "manual" ? "text-primary" : ""} />
                  Manual
                </button>
              </div>

              {/* ── Conteúdo dos modos automáticos ── */}
              {isAutoMode && (
                <div className="flex flex-col items-center justify-center min-h-[140px] bg-card/20 rounded-xl border border-border/5">
                  <p className={`text-xs mb-2 text-center max-w-[220px] leading-tight transition-colors ${isDisconnectedWarning ? "text-amber-500 font-medium" : "text-muted-foreground"
                    }`}>
                    {sensorStatusLabel}
                  </p>

                  {currentBpm ? (
                    <div className="flex items-baseline justify-center gap-2 animate-in zoom-in-95 duration-200">
                      <Heart
                        size={28}
                        className={`${getBpmColor(currentBpm)} text-accent animate-heartbeat fill-current self-center mr-1 drop-shadow-sm`}
                      />
                      <span
                        className={`${getBpmColor(currentBpm)} font-bold tracking-tighter tabular-nums text-5xl sm:text-6xl`}
                        style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}
                      >
                        {currentBpm}
                      </span>
                      <span className="text-muted-foreground text-sm font-semibold uppercase">bpm</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-4 h-[60px] animate-in fade-in">
                      <div className="w-2 h-2 rounded-full bg-primary/40 animate-ping" />
                      <span className="text-primary/60 text-4xl font-bold tracking-tighter tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        --
                      </span>
                      <span className="text-muted-foreground/50 text-sm font-semibold uppercase">bpm</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Conteúdo do Modo Manual ── */}
              {mode === "manual" && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 mt-4">
                  <MetricInput
                    label="Inserir Manualmente"
                    unit="bpm"
                    value={during.bpm}
                    onChange={(v) => setDuring(p => ({ ...p, bpm: v }))}
                    placeholder="158"
                    icon={<Heart size={14} className="text-muted-foreground" />}
                    min={30}
                    max={250}
                  />
                </div>
              )}
            </div>

            <MetricInput label="Distância Percorrida" unit="km" value={during.distance} onChange={(v) => setDuring((p) => ({ ...p, distance: v }))} placeholder="20.0" icon={<Bike size={14} />} />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            {errorMessage && (
              <p className="text-destructive font-medium text-sm text-center animate-in fade-in slide-in-from-top-1">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleAdvanceDuringAttempt}
              className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all hover:opacity-90 ${canAdvanceDuring
                ? "bg-primary text-primary-foreground"
                : "bg-primary/50 text-primary-foreground/80"
                }`}
            >
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>FINALIZAR TREINO</span>
              <ChevronRight size={18} />
            </button>
          </div>
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

          <div className="mt-6 flex flex-col gap-2">
            {errorMessage && (
              <p className="text-destructive font-medium text-sm text-center animate-in fade-in slide-in-from-top-1">
                {errorMessage}
              </p>
            )}
            <button
              onClick={handleSaveSessionAttempt}
              className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all hover:opacity-90 ${canSavePost
                ? "bg-primary text-primary-foreground"
                : "bg-primary/50 text-primary-foreground/80"
                }`}
            >
              <CheckCircle2 size={18} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>SALVAR TREINO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}