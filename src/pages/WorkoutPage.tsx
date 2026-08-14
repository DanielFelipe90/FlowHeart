import { useState, useEffect } from "react";
import { Activity, Bike, ChevronRight, CheckCircle2, Radio, PenLine, Bluetooth } from "lucide-react";
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

export function WorkoutPage({ phase, pre, setPre, during, setDuring, post, setPost, setPage, saveSession, onTimerRunningChange }: WorkoutPageProps) {
  // Determina se os botões de avançar ou salvar devem estar habilitados
  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = Boolean(during.bpm) && Boolean(during.distance);
  const canSavePost = post.systolic && post.diastolic && post.bpm;
  const [timerRunning, setTimerRunning] = useState(false);

  // A entrega do BPM é 100% local (ponte nativa).
  const { status, currentBpm, isMobileOnline, getAverageBpm, resetReadings } = useBpm({
    enabled: phase === "during",
  });

  const { mode, selectSensor, selectMagene, selectManual } = useBpmMode({ isMobileOnline });

  // Sensor (Samsung Health) e Magene (BLE) são as duas fontes "automáticas" —
  // ambas alimentam during.bpm a partir de currentBpm; só o Manual usa input.
  const isAutoMode = mode === "sensor" || mode === "magene";

  // Sincroniza during.bpm com a leitura do sensor de forma REATIVA (não mais via
  // callback imperativo no momento do evento). Isso evita a corrida entre este
  // hook e o useBpmMode: como useBpm é chamado antes de useBpmMode, um callback
  // que checasse `mode === "sensor"` no instante do evento via a leitura inicial
  // (cache) passar em branco, porque "mode" ainda estava null nesse ponto — e o
  // sync inicial do useBpm só roda uma vez (não reexecuta quando "mode" muda
  // depois). Com o efeito abaixo, a sincronização roda de novo sempre que
  // "mode" OU "currentBpm" mudarem, em qualquer ordem.
  useEffect(() => {
    if (isAutoMode && currentBpm != null) {
      setDuring((p) => ({ ...p, bpm: String(currentBpm) }));
    }
  }, [isAutoMode, currentBpm, setDuring]);

  // Hook customizado para lidar com notificações durante o treino
  useWorkoutNotifications(phase, during.timeSeconds, timerRunning);
  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAdvanceDuring = () => {
    // Se estava numa fonte automática (sensor ou Magene), salva a média como BPM final
    if (isAutoMode) {
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

  const autoSourceLabel = mode === "magene" ? "Magene H003" : "Fit 3 / Watch";

  const sensorStatusLabel = {
    disconnected: "Sensor desconectado",
    waiting: `Procurando ${autoSourceLabel}...`,
    mobile_connected: "Sensor conectado",
    mobile_disconnected: "Sensor perdido — reconectando...",
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
                onTimerRunningChange(running); // Notifica o App.tsx
                setTimerRunning(running);      // Atualiza o estado local para as notificações
              }}
            />

            {/* ── Card Frequência Cardíaca Premium ── */}
            <div className="rounded-2xl border border-border bg-input-background p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  Frequência Cardíaca
                </p>

                {/* Status do sensor */}
                {isAutoMode && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <span className={`w-2 h-2 rounded-full ${status === "mobile_connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                      }`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {status === "mobile_connected" ? "Online" : "Aguardando"}
                    </span>
                  </div>
                )}
              </div>

              {/* Segmented Control (Abas unificadas estilo pílula) */}
              <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/30">
                <button
                  onClick={selectSensor}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === "sensor"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Radio size={13} className={mode === "sensor" ? "text-primary" : ""} />
                  Watch
                </button>

                <button
                  onClick={selectMagene}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${mode === "magene"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Bluetooth size={13} className={mode === "magene" ? "text-primary" : ""} />
                  Magene
                </button>

                <button
                  onClick={selectManual}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${mode === "manual"
                    ? "bg-card text-foreground shadow-sm border border-border/10"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <PenLine size={13} className={mode === "manual" ? "text-primary" : ""} />
                  Manual
                </button>
              </div>

              {/* ── Conteúdo dos modos automáticos (Watch / Magene) ── */}
              {isAutoMode && (
                <div className="flex flex-col items-center justify-center py-4 bg-card/20 rounded-xl border border-border/5">
                  <p className="text-xs text-muted-foreground mb-2 text-center max-w-[220px] leading-tight">
                    {sensorStatusLabel}
                  </p>

                  {currentBpm ? (
                    <div className="flex items-baseline justify-center gap-1.5">
                      {/* Coração pulsante para dar a sensação de leitura em tempo real */}
                      <Activity size={22} className="text-destructive animate-pulse mr-1 self-center" />
                      <span
                        className="text-primary font-bold tracking-tighter"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "3.5rem", lineHeight: 1 }}
                      >
                        {currentBpm}
                      </span>
                      <span className="text-muted-foreground text-sm font-semibold uppercase">bpm</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 animate-ping" />
                      <span className="text-muted-foreground text-sm font-medium tracking-wide">Aguardando sinal...</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Conteúdo do Modo Manual ── */}
              {mode === "manual" && (
                <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <MetricInput
                    label="" unit="bpm" value={during.bpm}
                    onChange={(v) => setDuring(p => ({ ...p, bpm: v }))}
                    placeholder="158" icon={<Activity size={14} />} min={30} max={250}
                  />
                </div>
              )}
            </div>

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