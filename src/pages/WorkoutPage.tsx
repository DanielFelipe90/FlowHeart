import { Activity, Bike, ChevronRight, CheckCircle2 } from "lucide-react";
import { MetricInput } from "../components/MetricInput";
import { BloodPressureInput } from "../components/BloodPressureInput";
import { WorkoutTimer } from "../components/WorkoutTimer";
import { IHBToggle } from "../components/IHBToggle";
import { PhaseHeader } from "../components/PhaseHeader";
import { StepIndicator } from "../components/StepIndicator";
import type { AppPage, Phase, PreState, DuringState, PostState } from "../types";
import { useInactivityHeartbeat } from "../hooks/useInactivityHeartbeat";
import { useWorkoutNotifications } from "../hooks/useWorkoutNotifications";

// Props para o componente WorkoutPage
interface WorkoutPageProps {
  phase: Phase;
  pre: PreState; setPre: React.Dispatch<React.SetStateAction<PreState>>;
  during: DuringState; setDuring: React.Dispatch<React.SetStateAction<DuringState>>;
  post: PostState; setPost: React.Dispatch<React.SetStateAction<PostState>>;
  setPage: (page: AppPage) => void;
  saveSession: () => void;
  resetInactivity: () => void;
}

export function WorkoutPage({ phase, pre, setPre, during, setDuring, post, setPost, setPage, saveSession, resetInactivity }: WorkoutPageProps) {
  console.log("WorkoutPage renderizou!");

  // Determina se os botões de avançar ou salvar devem estar habilitados
  const canAdvancePre = pre.systolic && pre.diastolic && pre.bpm;
  const canAdvanceDuring = during.bpm;
  const canSavePost = post.systolic && post.diastolic && post.bpm;

  // Hooks customizados para lidar com inatividade e notificações durante o treino
  useInactivityHeartbeat(phase, resetInactivity);

  // Hook customizado para lidar com notificações durante o treino
  useWorkoutNotifications(phase, during.timeSeconds);

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
            onClick={() => setPage({ tag: "workout", phase: "during" })}
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
            <WorkoutTimer onTimeChange={(s) => setDuring((p) => ({ ...p, timeSeconds: s }))} />
            <MetricInput label="Frequência Cardíaca" unit="bpm" value={during.bpm} onChange={(v) => setDuring((p) => ({ ...p, bpm: v }))} placeholder="158" icon={<Activity size={14} />} min={30} max={250} />
            <MetricInput label="Distância Percorrida" unit="km" value={during.distance} onChange={(v) => setDuring((p) => ({ ...p, distance: v }))} placeholder="20.0" icon={<Bike size={14} />} />
          </div>
          <button
            disabled={!canAdvanceDuring}
            onClick={() => setPage({ tag: "workout", phase: "post" })}
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